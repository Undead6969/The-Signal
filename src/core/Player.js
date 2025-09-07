import * as THREE from 'three';

export class Player {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;

        // Player state
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;

        // Movement
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.speed = 5.0;
        this.sprintSpeed = 8.0;
        this.currentSpeed = this.speed;
        this.isSprinting = false;
        this.isCrouching = false;
        this.crouchSpeed = 2.5;

        // Camera controls
        this.mouseSensitivity = config.mouseSensitivity || 1.0;
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.pitch = 0;
        this.yaw = 0;
        this.maxPitch = Math.PI / 2.2; // Prevent over-rotation

        // Physics
        this.gravity = -30;
        this.jumpForce = 12;
        this.isGrounded = true;
        this.canJump = true;

        // Weapon system
        this.weapon = {
            name: 'Pistol',
            damage: 25,
            fireRate: 0.3, // seconds between shots
            lastFired: 0,
            recoil: 0.05,
            ammo: 30,
            maxAmmo: 30,
            clipSize: 10,
            currentClip: 10,
            reloadTime: 2.0,
            isReloading: false,
            reloadStartTime: 0
        };

        // Flashlight
        this.flashlightBattery = 100;
        this.maxBattery = 100;
        this.batteryDrainRate = 2.0; // per second
        this.flashlightOn = true;

        // Madness system
        this.madnessLevel = 0.0;
        this.maxMadness = 1.0;
        this.madnessIncreaseRate = 0.01;
        this.madnessDecreaseRate = 0.005;

        // Inventory
        this.inventory = {
            ammo: 0,
            batteries: 0,
            healthKits: 0,
            keyCards: [],
            documents: []
        };

        // Interaction
        this.interactionRange = 3.0;
        this.interactionCooldown = 0;
        this.lastInteractionTime = 0;

        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            crouch: false,
            sprint: false,
            shoot: false,
            reload: false,
            interact: false,
            flashlight: false
        };

        // Position and bounds checking
        this.position = new THREE.Vector3();
        this.worldBounds = new THREE.Box3(
            new THREE.Vector3(-config.worldSize/2, -10, -config.worldSize/2),
            new THREE.Vector3(config.worldSize/2, config.worldSize, config.worldSize/2)
        );

        // Audio feedback
        this.lastFootstepTime = 0;
        this.footstepInterval = 0.3;

        this.init();
    }

    init() {
        // Set initial camera position
        this.camera.position.set(0, 2, 0);
        this.position.copy(this.camera.position);

        // Setup event listeners
        this.setupInputListeners();

        console.log('👤 Player initialized');
    }

    setupInputListeners() {
        // Mouse movement for camera
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                this.handleMouseMove(event);
            }
        });

        // Mouse click for shooting
        document.addEventListener('mousedown', (event) => {
            if (document.pointerLockElement === document.body) {
                if (event.button === 0) { // Left click
                    this.keys.shoot = true;
                }
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.keys.shoot = false;
            }
        });

        // Keyboard input
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        // Pointer lock for FPS controls
        document.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
    }

    handleMouseMove(event) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Horizontal rotation (yaw)
        this.yaw -= movementX * 0.002 * this.mouseSensitivity;

        // Vertical rotation (pitch)
        this.pitch -= movementY * 0.002 * this.mouseSensitivity;
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));

        // Apply rotation to camera
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                event.preventDefault();
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                event.preventDefault();
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                event.preventDefault();
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                event.preventDefault();
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = true;
                event.preventDefault();
                break;
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.crouch = true;
                event.preventDefault();
                break;
            case 'KeyR':
                this.keys.reload = true;
                event.preventDefault();
                break;
            case 'KeyE':
                this.keys.interact = true;
                event.preventDefault();
                break;
            case 'KeyF':
                this.keys.flashlight = true;
                event.preventDefault();
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = false;
                break;
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.crouch = false;
                break;
            case 'KeyR':
                this.keys.reload = false;
                break;
            case 'KeyE':
                this.keys.interact = false;
                break;
            case 'KeyF':
                this.keys.flashlight = false;
                break;
        }
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Update position based on current camera position
        this.position.copy(this.camera.position);

        // Handle movement
        this.handleMovement(deltaTime);

        // Handle shooting
        this.handleShooting(deltaTime);

        // Handle reloading
        this.handleReloading(deltaTime);

        // Handle flashlight
        this.handleFlashlight(deltaTime);

        // Handle interactions
        this.handleInteractions(deltaTime);

        // Update madness level
        this.updateMadness(deltaTime);

        // Update battery level
        this.updateBattery(deltaTime);

        // Update physics
        this.updatePhysics(deltaTime);

        // Update audio feedback
        this.updateAudioFeedback(deltaTime);

        // Clamp position to world bounds
        this.clampToWorldBounds();

        // Update camera position
        this.camera.position.copy(this.position);
    }

    handleMovement(deltaTime) {
        // Calculate movement direction based on camera orientation
        this.direction.set(0, 0, 0);

        if (this.keys.forward) this.direction.z -= 1;
        if (this.keys.backward) this.direction.z += 1;
        if (this.keys.left) this.direction.x -= 1;
        if (this.keys.right) this.direction.x += 1;

        // Normalize direction vector
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }

        // Apply camera rotation to movement direction
        this.direction.applyEuler(new THREE.Euler(0, this.yaw, 0));

        // Determine speed based on state
        this.currentSpeed = this.speed;

        if (this.keys.sprint && this.isGrounded) {
            this.currentSpeed = this.sprintSpeed;
            this.isSprinting = true;
        } else {
            this.isSprinting = false;
        }

        if (this.keys.crouch) {
            this.currentSpeed = this.crouchSpeed;
            this.isCrouching = true;
        } else {
            this.isCrouching = false;
        }

        // Apply movement
        if (this.direction.length() > 0) {
            const movement = this.direction.clone().multiplyScalar(this.currentSpeed * deltaTime);
            this.velocity.add(movement);
        }

        // Handle jumping
        if (this.keys.jump && this.isGrounded && this.canJump) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.canJump = false;
        }

        // Reset jump when key is released
        if (!this.keys.jump) {
            this.canJump = true;
        }
    }

    handleShooting(deltaTime) {
        if (this.weapon.isReloading) return;

        const currentTime = performance.now() / 1000;

        if (this.keys.shoot && currentTime - this.weapon.lastFired >= this.weapon.fireRate) {
            if (this.weapon.currentClip > 0) {
                this.fireWeapon();
                this.weapon.lastFired = currentTime;
                this.weapon.currentClip--;

                // Apply recoil
                this.pitch += this.weapon.recoil;
                this.pitch = Math.min(this.maxPitch, this.pitch);
            } else {
                // Click sound for empty weapon
                this.playEmptyWeaponSound();
            }
        }
    }

    fireWeapon() {
        // Create bullet trajectory
        const bulletDirection = new THREE.Vector3(0, 0, -1);
        bulletDirection.applyEuler(this.camera.rotation);

        // Add spread (inaccuracy)
        const spread = 0.02;
        bulletDirection.x += (Math.random() - 0.5) * spread;
        bulletDirection.y += (Math.random() - 0.5) * spread;
        bulletDirection.z += (Math.random() - 0.5) * spread;
        bulletDirection.normalize();

        // Play shooting sound
        this.playShootingSound();

        // Create muzzle flash effect
        this.createMuzzleFlash();

        // Raycast for hit detection
        this.performRaycast(bulletDirection);

        // Trigger screen shake
        this.triggerScreenShake();
    }

    performRaycast(direction) {
        // In a full implementation, this would use the physics engine
        // For now, we'll simulate basic raycasting
        const raycaster = new THREE.Raycaster();
        raycaster.set(this.camera.position, direction);

        // Check for hits against enemies, walls, etc.
        // This would be handled by the physics/world manager
    }

    handleReloading(deltaTime) {
        if (this.weapon.isReloading) {
            const currentTime = performance.now() / 1000;
            if (currentTime - this.weapon.reloadStartTime >= this.weapon.reloadTime) {
                this.finishReloading();
            }
        } else if (this.keys.reload && this.weapon.currentClip < this.weapon.clipSize && this.weapon.ammo > 0) {
            this.startReloading();
        }
    }

    startReloading() {
        this.weapon.isReloading = true;
        this.weapon.reloadStartTime = performance.now() / 1000;
        this.playReloadSound();
    }

    finishReloading() {
        const ammoNeeded = this.weapon.clipSize - this.weapon.currentClip;
        const ammoToLoad = Math.min(ammoNeeded, this.weapon.ammo);

        this.weapon.currentClip += ammoToLoad;
        this.weapon.ammo -= ammoToLoad;
        this.weapon.isReloading = false;
    }

    handleFlashlight(deltaTime) {
        if (this.keys.flashlight) {
            this.toggleFlashlight();
            this.keys.flashlight = false; // Prevent continuous toggling
        }
    }

    toggleFlashlight() {
        this.flashlightOn = !this.flashlightOn;
        // This would control the actual flashlight light in the game engine
    }

    handleInteractions(deltaTime) {
        this.interactionCooldown -= deltaTime;

        if (this.keys.interact && this.interactionCooldown <= 0) {
            this.performInteraction();
            this.interactionCooldown = 0.5; // 500ms cooldown
            this.keys.interact = false;
        }
    }

    performInteraction() {
        // Raycast for interactive objects
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.camera.rotation);
        raycaster.set(this.camera.position, direction);

        // Check for interactive objects within range
        // This would be handled by the world/interaction manager
    }

    updateMadness(deltaTime) {
        // Increase madness based on various factors
        let madnessIncrease = 0;

        // Proximity to signal source
        const distanceToSignal = this.getDistanceToSignal();
        if (distanceToSignal < 20) {
            madnessIncrease += (20 - distanceToSignal) / 20 * 0.02;
        }

        // Darkness
        if (!this.flashlightOn || this.flashlightBattery < 10) {
            madnessIncrease += 0.01;
        }

        // Sprinting (exhaustion)
        if (this.isSprinting) {
            madnessIncrease += 0.005;
        }

        // Apply changes
        this.madnessLevel += (madnessIncrease - this.madnessDecreaseRate) * deltaTime;
        this.madnessLevel = Math.max(0, Math.min(this.maxMadness, this.madnessLevel));
    }

    updateBattery(deltaTime) {
        if (this.flashlightOn) {
            this.flashlightBattery -= this.batteryDrainRate * deltaTime;
            this.flashlightBattery = Math.max(0, this.flashlightBattery);
        }
    }

    updatePhysics(deltaTime) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Apply velocity to position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Ground collision (simple)
        if (this.position.y <= 2) {
            this.position.y = 2;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Apply friction
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
    }

    updateAudioFeedback(deltaTime) {
        // Footstep sounds
        if (this.isGrounded && this.direction.length() > 0) {
            this.lastFootstepTime += deltaTime;
            if (this.lastFootstepTime >= this.footstepInterval) {
                this.playFootstepSound();
                this.lastFootstepTime = 0;
            }
        }
    }

    clampToWorldBounds() {
        this.position.clamp(
            this.worldBounds.min,
            this.worldBounds.max
        );
    }

    // Combat methods
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);

        if (this.health <= 0) {
            this.isDead = true;
        }

        // Increase madness from taking damage
        this.madnessLevel += 0.1;
        this.madnessLevel = Math.min(this.maxMadness, this.madnessLevel);

        this.playDamageSound();
    }

    heal(amount) {
        this.health += amount;
        this.health = Math.min(this.maxHealth, this.health);
    }

    // Inventory methods
    addItem(itemType, amount = 1) {
        if (this.inventory[itemType] !== undefined) {
            this.inventory[itemType] += amount;
            return true;
        }
        return false;
    }

    removeItem(itemType, amount = 1) {
        if (this.inventory[itemType] !== undefined && this.inventory[itemType] >= amount) {
            this.inventory[itemType] -= amount;
            return true;
        }
        return false;
    }

    // Getters
    getPosition() { return this.position.clone(); }
    getHealth() { return this.health; }
    getMaxHealth() { return this.maxHealth; }
    getBatteryLevel() { return this.flashlightBattery / this.maxBattery; }
    getMadnessLevel() { return this.madnessLevel; }
    getAmmoCount() { return this.weapon.currentClip; }
    getMaxAmmo() { return this.weapon.maxAmmo; }
    getAmmoUsed() { return this.weapon.ammo; }
    isPlayerDead() { return this.isDead; }

    // Distance to signal source (placeholder)
    getDistanceToSignal() {
        // This would be calculated based on the story/world state
        return 50; // Placeholder
    }

    // Audio methods (placeholders - would integrate with AudioManager)
    playShootingSound() { console.log('🔊 Bang!'); }
    playReloadSound() { console.log('🔊 Reloading...'); }
    playEmptyWeaponSound() { console.log('🔊 Click!'); }
    playDamageSound() { console.log('🔊 Ouch!'); }
    playFootstepSound() { console.log('🔊 Step...'); }

    // Visual effects (placeholders)
    createMuzzleFlash() { /* Would create particle effect */ }
    triggerScreenShake() { /* Would shake camera */ }

    // Save/Load
    getSaveData() {
        return {
            position: this.position.toArray(),
            health: this.health,
            battery: this.flashlightBattery,
            madness: this.madnessLevel,
            weapon: { ...this.weapon },
            inventory: { ...this.inventory }
        };
    }

    loadSaveData(saveData) {
        this.position.fromArray(saveData.position);
        this.health = saveData.health;
        this.flashlightBattery = saveData.battery;
        this.madnessLevel = saveData.madness;
        this.weapon = { ...saveData.weapon };
        this.inventory = { ...saveData.inventory };
    }

    reset() {
        this.health = this.maxHealth;
        this.isDead = false;
        this.flashlightBattery = this.maxBattery;
        this.madnessLevel = 0.0;
        this.weapon.currentClip = this.weapon.clipSize;
        this.weapon.ammo = this.weapon.maxAmmo;
        this.inventory = {
            ammo: 0,
            batteries: 0,
            healthKits: 0,
            keyCards: [],
            documents: []
        };
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.camera.position.copy(this.position);
    }
}
