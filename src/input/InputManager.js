export class InputManager {
    constructor(mouseSensitivity = 1.0) {
        this.mouseSensitivity = mouseSensitivity;

        // Input state
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: {},
            wheel: 0
        };

        // Gamepad support
        this.gamepad = null;
        this.gamepadIndex = -1;
        this.gamepadState = {
            buttons: [],
            axes: []
        };

        // Touch support (for mobile)
        this.touch = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };

        // Input settings
        this.keyBindings = {
            // Movement
            moveForward: ['KeyW', 'ArrowUp'],
            moveBackward: ['KeyS', 'ArrowDown'],
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            jump: ['Space'],
            crouch: ['ControlLeft', 'ControlRight'],
            sprint: ['ShiftLeft', 'ShiftRight'],

            // Combat
            shoot: ['leftMouse'],
            reload: ['KeyR'],
            switchWeapon: ['KeyQ'],

            // Interaction
            interact: ['KeyE'],
            flashlight: ['KeyF'],
            inventory: ['KeyI'],

            // UI
            pause: ['Escape'],
            menu: ['KeyM'],

            // Debug
            debug: ['KeyP'],
            wireframe: ['KeyZ']
        };

        // Input buffers for frame-perfect input
        this.inputBuffer = {
            pressed: new Set(),
            released: new Set(),
            held: new Set()
        };

        // Pointer lock state
        this.pointerLocked = false;
        this.pointerLockRequested = false;

        // Ensure cursor is visible by default
        document.body.style.cursor = 'default';

        // Event handlers bound to this instance
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            keyup: this.handleKeyUp.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            mouseup: this.handleMouseUp.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            wheel: this.handleWheel.bind(this),
            pointerlockchange: this.handlePointerLockChange.bind(this),
            pointerlockerror: this.handlePointerLockError.bind(this),
            gamepadconnected: this.handleGamepadConnected.bind(this),
            gamepaddisconnected: this.handleGamepadDisconnected.bind(this),
            touchstart: this.handleTouchStart.bind(this),
            touchmove: this.handleTouchMove.bind(this),
            touchend: this.handleTouchEnd.bind(this)
        };

        this.init();
    }

    init() {
        console.log('🎮 Initializing Input Manager...');

        // Setup event listeners
        this.setupEventListeners();

        // Initialize gamepad polling
        this.startGamepadPolling();

        console.log('✅ Input Manager initialized');
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);

        // Mouse events
        document.addEventListener('mousedown', this.boundHandlers.mousedown);
        document.addEventListener('mouseup', this.boundHandlers.mouseup);
        document.addEventListener('mousemove', this.boundHandlers.mousemove);
        document.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

        // Pointer lock events
        document.addEventListener('pointerlockchange', this.boundHandlers.pointerlockchange);
        document.addEventListener('pointerlockerror', this.boundHandlers.pointerlockerror);

        // Gamepad events
        window.addEventListener('gamepadconnected', this.boundHandlers.gamepadconnected);
        window.addEventListener('gamepaddisconnected', this.boundHandlers.gamepaddisconnected);

        // Touch events (for mobile support)
        document.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        document.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        document.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
    }

    handleKeyDown(event) {
        const key = event.code;
        if (!this.keys[key]) {
            this.keys[key] = {
                pressed: true,
                held: false,
                released: false,
                timestamp: performance.now()
            };
            this.inputBuffer.pressed.add(key);
        } else {
            this.keys[key].held = true;
        }

        // Prevent default for game keys
        if (this.isGameKey(key)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        const key = event.code;
        if (this.keys[key]) {
            this.keys[key].pressed = false;
            this.keys[key].held = false;
            this.keys[key].released = true;
            this.inputBuffer.released.add(key);
        }
    }

    handleMouseDown(event) {
        const button = this.getMouseButtonName(event.button);
        this.mouse.buttons[button] = {
            pressed: true,
            held: false,
            released: false,
            timestamp: performance.now()
        };
        this.inputBuffer.pressed.add(button);

        event.preventDefault();
    }

    handleMouseUp(event) {
        const button = this.getMouseButtonName(event.button);
        if (this.mouse.buttons[button]) {
            this.mouse.buttons[button].pressed = false;
            this.mouse.buttons[button].held = false;
            this.mouse.buttons[button].released = true;
            this.inputBuffer.released.add(button);
        }
    }

    handleMouseMove(event) {
        if (this.pointerLocked) {
            // Use movement values when pointer is locked
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
        } else {
            // Use client coordinates when pointer is not locked
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
    }

    handleWheel(event) {
        this.mouse.wheel = event.deltaY;
        event.preventDefault();
    }

    handlePointerLockChange() {
        this.pointerLocked = (document.pointerLockElement === document.body);
        console.log(`🔒 Pointer lock: ${this.pointerLocked ? 'enabled' : 'disabled'}`);

        // Reset the requested flag when we get a response
        this.pointerLockRequested = false;

        // Update cursor visibility based on pointer lock state and current UI
        this.updateCursorVisibility();
    }

    updateCursorVisibility() {
        // Only hide cursor during actual gameplay with pointer lock
        // Keep cursor visible in menus and UI screens
        if (this.pointerLocked && this.isInGameplay()) {
            document.body.style.cursor = 'none';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    forceCursorVisible() {
        // Force cursor to be visible (for menus)
        document.body.style.cursor = 'default';
    }

    isInGameplay() {
        // Check if we're in actual gameplay (not menus)
        // Keep cursor visible in all menu screens
        if (!window.gameEngine) return false;

        // If not playing, we're in menus
        if (!window.gameEngine.isPlaying) return false;

        // If paused, we're in pause menu
        if (window.gameEngine.isPaused) return false;

        // If in cutscene, we're not in active gameplay
        if (window.uiManager && window.uiManager.currentScreen === 'cutscene') return false;

        // We're in active gameplay
        return true;
    }

    handlePointerLockError(event) {
        console.error('❌ Pointer lock failed:', event);

        // Reset states on error
        this.pointerLocked = false;
        this.pointerLockRequested = false;

        // Show user-friendly message
        if (event && event.message) {
            console.warn('💡 Pointer lock error:', event.message);
        } else {
            console.warn('💡 Pointer lock may require user interaction or browser permissions');
        }

        // Try to inform the user
        this.showPointerLockHelp();
    }

    showPointerLockHelp() {
        // This could show a UI notification or tooltip
        console.log('💡 Tip: Click on the game area to enable mouse look');
    }

    handleGamepadConnected(event) {
        console.log(`🎮 Gamepad connected: ${event.gamepad.id}`);
        this.gamepad = event.gamepad;
        this.gamepadIndex = event.gamepad.index;
    }

    handleGamepadDisconnected(event) {
        console.log(`🎮 Gamepad disconnected: ${event.gamepad.id}`);
        if (this.gamepadIndex === event.gamepad.index) {
            this.gamepad = null;
            this.gamepadIndex = -1;
        }
    }

    handleTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touch.active = true;
            this.touch.startX = touch.clientX;
            this.touch.startY = touch.clientY;
            this.touch.currentX = touch.clientX;
            this.touch.currentY = touch.clientY;
        }
        event.preventDefault();
    }

    handleTouchMove(event) {
        if (this.touch.active && event.touches.length > 0) {
            const touch = event.touches[0];
            this.touch.currentX = touch.clientX;
            this.touch.currentY = touch.clientY;
            this.touch.deltaX = this.touch.currentX - this.touch.startX;
            this.touch.deltaY = this.touch.currentY - this.touch.startY;
        }
        event.preventDefault();
    }

    handleTouchEnd(event) {
        this.touch.active = false;
        this.touch.deltaX = 0;
        this.touch.deltaY = 0;
        event.preventDefault();
    }

    startGamepadPolling() {
        // Poll gamepad state at 60fps
        setInterval(() => {
            if (this.gamepadIndex >= 0) {
                const gamepads = navigator.getGamepads();
                if (gamepads[this.gamepadIndex]) {
                    this.updateGamepadState(gamepads[this.gamepadIndex]);
                }
            }
        }, 1000 / 60);
    }

    updateGamepadState(gamepad) {
        // Update button states
        gamepad.buttons.forEach((button, index) => {
            const buttonName = `gamepad_button_${index}`;
            const wasPressed = this.gamepadState.buttons[index] || false;
            const isPressed = button.pressed;

            if (isPressed && !wasPressed) {
                this.inputBuffer.pressed.add(buttonName);
            } else if (!isPressed && wasPressed) {
                this.inputBuffer.released.add(buttonName);
            }

            this.gamepadState.buttons[index] = isPressed;
        });

        // Update axes
        this.gamepadState.axes = Array.from(gamepad.axes);
    }

    // Utility methods
    getMouseButtonName(button) {
        const buttonNames = {
            0: 'leftMouse',
            1: 'middleMouse',
            2: 'rightMouse'
        };
        return buttonNames[button] || `mouse_${button}`;
    }

    isGameKey(key) {
        // Check if the key is used by the game
        for (const binding of Object.values(this.keyBindings)) {
            if (binding.includes(key)) {
                return true;
            }
        }
        return false;
    }

    // Public API methods
    isPressed(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;

        return keys.some(key => {
            if (key.includes('Mouse')) {
                return this.mouse.buttons[key]?.pressed || false;
            } else if (key.includes('gamepad')) {
                return this.inputBuffer.pressed.has(key);
            } else {
                return this.keys[key]?.pressed || false;
            }
        });
    }

    isHeld(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;

        return keys.some(key => {
            if (key.includes('Mouse')) {
                return this.mouse.buttons[key]?.held || false;
            } else if (key.includes('gamepad')) {
                return this.gamepadState.buttons[parseInt(key.split('_')[2])] || false;
            } else {
                return this.keys[key]?.held || false;
            }
        });
    }

    isReleased(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;

        return keys.some(key => {
            if (key.includes('Mouse')) {
                return this.mouse.buttons[key]?.released || false;
            } else if (key.includes('gamepad')) {
                return this.inputBuffer.released.has(key);
            } else {
                return this.keys[key]?.released || false;
            }
        });
    }

    getAxis(action) {
        // For analog inputs like mouse movement or gamepad sticks
        switch (action) {
            case 'lookX':
                return this.pointerLocked ? this.mouse.deltaX * this.mouseSensitivity : 0;
            case 'lookY':
                return this.pointerLocked ? this.mouse.deltaY * this.mouseSensitivity : 0;
            case 'moveX':
                return this.gamepadState.axes[0] || 0; // Left stick X
            case 'moveY':
                return this.gamepadState.axes[1] || 0; // Left stick Y
            default:
                return 0;
        }
    }

    getMouseDelta() {
        const delta = {
            x: this.mouse.deltaX,
            y: this.mouse.deltaY
        };

        // Reset delta after reading
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;

        return delta;
    }

    getTouchDelta() {
        if (!this.touch.active) return { x: 0, y: 0 };

        const delta = {
            x: this.touch.deltaX,
            y: this.touch.deltaY
        };

        return delta;
    }

    // Update method (called each frame)
    update() {
        // Clear input buffer for next frame
        this.inputBuffer.pressed.clear();
        this.inputBuffer.released.clear();

        // Update held states
        Object.keys(this.keys).forEach(key => {
            if (this.keys[key].pressed) {
                this.keys[key].pressed = false;
                this.keys[key].held = true;
            }
            if (this.keys[key].released) {
                this.keys[key].released = false;
            }
        });

        // Update mouse button states
        Object.keys(this.mouse.buttons).forEach(button => {
            if (this.mouse.buttons[button].pressed) {
                this.mouse.buttons[button].pressed = false;
                this.mouse.buttons[button].held = true;
            }
            if (this.mouse.buttons[button].released) {
                this.mouse.buttons[button].released = false;
            }
        });

        // Update touch
        if (this.touch.active) {
            this.touch.deltaX = this.touch.currentX - this.touch.startX;
            this.touch.deltaY = this.touch.currentY - this.touch.startY;
        }

        // Reset mouse wheel
        this.mouse.wheel = 0;
    }

    // Settings
    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
        console.log(`🎯 Mouse sensitivity: ${this.mouseSensitivity}`);
    }

    updateKeyBinding(action, keys) {
        this.keyBindings[action] = Array.isArray(keys) ? keys : [keys];
        console.log(`🔧 Updated key binding: ${action} -> ${keys}`);
    }

    // Check for recent user gesture (required for pointer lock)
    hasUserGesture() {
        // Modern browsers require user gesture for pointer lock
        // This is a simple check - in practice, you'd track actual user interactions
        return true; // For now, assume we have permission
    }

    // Request pointer lock on user interaction (call this from click handlers)
    requestPointerLockOnInteraction() {
        // This method should be called from user interaction events
        // It bypasses the user gesture check since we're already in a user event
        if (this.pointerLocked || this.pointerLockRequested) {
            return;
        }

        this.pointerLockRequested = true;

        try {
            const targetElement = document.body || document.documentElement;

            if (targetElement.requestPointerLock) {
                targetElement.requestPointerLock().then(() => {
                    console.log('🔒 Pointer lock granted via user interaction');
                }).catch(error => {
                    console.warn('⚠️ Pointer lock request rejected:', error);
                    this.pointerLockRequested = false;
                });
            } else {
                console.warn('⚠️ requestPointerLock not available');
                this.pointerLockRequested = false;
            }
        } catch (error) {
            console.warn('⚠️ Pointer lock request failed:', error);
            this.pointerLockRequested = false;
        }

        // Reset the requested flag after a delay
        setTimeout(() => {
            this.pointerLockRequested = false;
        }, 200);
    }

    // Pointer lock management
    requestPointerLock() {
        // Prevent multiple rapid requests
        if (this.pointerLocked || this.pointerLockRequested) {
            return;
        }

        // Check if document is ready and pointer lock is supported
        if (!document || !document.body || !document.body.requestPointerLock) {
            console.warn('⚠️ Pointer lock not supported in this environment');
            return;
        }

        // Check if we need a user gesture
        if (!this.hasUserGesture()) {
            console.log('ℹ️ Pointer lock requires user interaction, will request on next user input');
            return;
        }

        this.pointerLockRequested = true;

        try {
            // Try requesting on document.body first, fallback to document.documentElement
            const targetElement = document.body || document.documentElement;

            if (targetElement.requestPointerLock) {
                targetElement.requestPointerLock().catch(error => {
                    console.warn('⚠️ Pointer lock request rejected:', error);
                    this.pointerLockRequested = false;
                });
            } else {
                console.warn('⚠️ requestPointerLock not available on target element');
                this.pointerLockRequested = false;
            }
        } catch (error) {
            console.warn('⚠️ Pointer lock request failed:', error);
            this.pointerLockRequested = false;
        }

        // Reset the requested flag after a short delay
        setTimeout(() => {
            this.pointerLockRequested = false;
        }, 200);
    }

    exitPointerLock() {
        if (this.pointerLocked) {
            document.exitPointerLock();
        }
        // Ensure cursor is visible after exiting pointer lock
        document.body.style.cursor = 'default';
    }

    // Handle pause/resume for pointer lock
    onPause() {
        this.exitPointerLock();
        // Update cursor visibility after exiting pointer lock
        this.updateCursorVisibility();
    }

    onResume() {
        // Request pointer lock when resuming
        // Use a longer delay to ensure the DOM is ready
        setTimeout(() => {
            if (!this.pointerLocked && !this.pointerLockRequested) {
                console.log('🔒 Requesting pointer lock on resume...');
                this.requestPointerLock();
            }
        }, 300); // Increased delay for stability
    }

    // Vibration (for gamepad feedback)
    vibrateGamepad(pattern) {
        if (this.gamepad && this.gamepad.vibrationActuator) {
            this.gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: pattern.startDelay || 0,
                duration: pattern.duration || 200,
                weakMagnitude: pattern.weak || 0.5,
                strongMagnitude: pattern.strong || 0.5
            });
        }
    }

    // Debug methods
    getDebugInfo() {
        return {
            keysPressed: Object.keys(this.keys).filter(key => this.keys[key].pressed || this.keys[key].held),
            mouseButtons: Object.keys(this.mouse.buttons).filter(button => this.mouse.buttons[button].pressed || this.mouse.buttons[button].held),
            pointerLocked: this.pointerLocked,
            gamepadConnected: this.gamepad !== null,
            touchActive: this.touch.active,
            mouseSensitivity: this.mouseSensitivity
        };
    }

    getInputState() {
        return {
            keys: { ...this.keys },
            mouse: { ...this.mouse },
            gamepad: this.gamepad ? { ...this.gamepadState } : null,
            touch: { ...this.touch }
        };
    }

    // Cleanup
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
        document.removeEventListener('mousedown', this.boundHandlers.mousedown);
        document.removeEventListener('mouseup', this.boundHandlers.mouseup);
        document.removeEventListener('mousemove', this.boundHandlers.mousemove);
        document.removeEventListener('wheel', this.boundHandlers.wheel);
        document.removeEventListener('pointerlockchange', this.boundHandlers.pointerlockchange);
        document.removeEventListener('pointerlockerror', this.boundHandlers.pointerlockerror);
        window.removeEventListener('gamepadconnected', this.boundHandlers.gamepadconnected);
        window.removeEventListener('gamepaddisconnected', this.boundHandlers.gamepaddisconnected);
        document.removeEventListener('touchstart', this.boundHandlers.touchstart);
        document.removeEventListener('touchmove', this.boundHandlers.touchmove);
        document.removeEventListener('touchend', this.boundHandlers.touchend);

        console.log('🧹 Input Manager cleaned up');
    }
}
