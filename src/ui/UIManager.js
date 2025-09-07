export class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.isInitialized = false;

        // UI elements
        this.elements = {
            loading: {
                screen: document.getElementById('loading-screen'),
                progress: document.querySelector('.loading-progress'),
                text: document.querySelector('.loading-text')
            },
            mainMenu: {
                screen: document.getElementById('main-menu'),
                newGameBtn: document.getElementById('new-game-btn'),
                continueBtn: document.getElementById('continue-btn'),
                settingsBtn: document.getElementById('settings-btn'),
                creditsBtn: document.getElementById('credits-btn')
            },
            gameHUD: {
                screen: document.getElementById('game-hud'),
                ammoCounter: document.querySelector('.ammo-current'),
                ammoMax: document.querySelector('.ammo-max'),
                healthBar: document.querySelector('.health-fill'),
                batteryLevel: document.getElementById('battery-level'),
                objectiveText: document.querySelector('.objective-text'),
                interactionPrompt: document.querySelector('.interaction-prompt'),
                madnessMeter: document.querySelector('.madness-fill')
            },
            settings: {
                screen: document.getElementById('settings-panel'),
                saveBtn: document.getElementById('save-settings'),
                mouseSensitivity: document.getElementById('mouse-sensitivity'),
                soundVolume: document.getElementById('sound-volume'),
                graphicsQuality: document.getElementById('graphics-quality')
            },
            pauseMenu: {
                screen: document.getElementById('pause-menu'),
                resumeBtn: document.getElementById('resume-btn'),
                restartBtn: document.getElementById('restart-btn'),
                mainMenuBtn: document.getElementById('main-menu-btn')
            },
            gameOver: {
                screen: document.getElementById('game-over'),
                title: document.querySelector('.game-over-content h2'),
                stats: document.querySelector('.ending-stats'),
                retryBtn: document.getElementById('retry-btn'),
                mainMenuEndBtn: document.getElementById('main-menu-end-btn')
            },
            cutscene: {
                screen: document.getElementById('cutscene-overlay'),
                text: document.querySelector('.cutscene-text'),
                image: document.querySelector('.cutscene-image')
            },
            inventory: {
                screen: document.getElementById('inventory'),
                grid: document.querySelector('.inventory-grid')
            }
        };

        // Notifications system
        this.notifications = [];
        this.notificationContainer = null;

        this.init();
    }

    init() {
        console.log('🎨 Initializing UI Manager...');

        // Setup notification system
        this.setupNotifications();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize HUD values
        this.updateHUD({
            ammo: 30,
            maxAmmo: 30,
            health: 100,
            maxHealth: 100,
            battery: 100,
            objective: 'Investigate the distress signal',
            madness: 0
        });

        this.isInitialized = true;
        console.log('✅ UI Manager initialized');
    }

    setupNotifications() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    setupEventListeners() {
        // Menu navigation
        this.elements.mainMenu.newGameBtn.addEventListener('click', () => this.emit('newGame'));
        this.elements.mainMenu.continueBtn.addEventListener('click', () => this.emit('continueGame'));
        this.elements.mainMenu.settingsBtn.addEventListener('click', () => this.emit('showSettings'));
        this.elements.mainMenu.creditsBtn.addEventListener('click', () => this.emit('showCredits'));

        // Settings
        this.elements.settings.saveBtn.addEventListener('click', () => this.emit('saveSettings'));

        // Pause menu
        this.elements.pauseMenu.resumeBtn.addEventListener('click', () => this.emit('resumeGame'));
        this.elements.pauseMenu.restartBtn.addEventListener('click', () => this.emit('restartGame'));
        this.elements.pauseMenu.mainMenuBtn.addEventListener('click', () => this.emit('returnToMainMenu'));

        // Game over
        this.elements.gameOver.retryBtn.addEventListener('click', () => this.emit('retryGame'));
        this.elements.gameOver.mainMenuEndBtn.addEventListener('click', () => this.emit('returnToMainMenu'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                event.preventDefault();
                if (this.currentScreen === 'game' || this.currentScreen === 'gameHUD') {
                    this.emit('pauseGame');
                } else if (this.currentScreen === 'pause') {
                    this.emit('resumeGame');
                }
            }
        });
    }

    // Screen management
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.elements).forEach(element => {
            if (element.screen) {
                element.screen.classList.add('hidden');
            }
        });

        // Show target screen
        if (this.elements[screenName] && this.elements[screenName].screen) {
            this.elements[screenName].screen.classList.remove('hidden');
            this.currentScreen = screenName;
        }

        console.log(`📺 Switched to screen: ${screenName}`);
    }

    showLoadingScreen() {
        this.showScreen('loading');
    }

    showMainMenu() {
        this.showScreen('mainMenu');
    }

    showGameHUD() {
        this.showScreen('gameHUD');
    }

    showSettings() {
        this.showScreen('settings');
    }

    showCredits() {
        this.showScreen('credits');
    }

    showPauseMenu() {
        this.showScreen('pauseMenu');
    }

    showGameOver(ending) {
        this.updateGameOverScreen(ending);
        this.showScreen('gameOver');
    }

    showCutscene(content) {
        this.updateCutscene(content);
        this.showScreen('cutscene');
    }

    showInventory() {
        this.updateInventory();
        this.showScreen('inventory');
    }

    hideMainMenu() {
        this.elements.mainMenu.screen.classList.add('hidden');
    }

    hideGameOver() {
        this.elements.gameOver.screen.classList.add('hidden');
    }

    hidePauseMenu() {
        this.elements.pauseMenu.screen.classList.add('hidden');
    }

    hideSettings() {
        this.elements.settings.screen.classList.add('hidden');
    }

    hideCutscene() {
        this.elements.cutscene.screen.classList.add('hidden');
    }

    hideInventory() {
        this.elements.inventory.screen.classList.add('hidden');
    }

    toggleInventory() {
        if (this.currentScreen === 'inventory') {
            this.hideInventory();
            this.showScreen('gameHUD');
        } else {
            this.showInventory();
        }
    }

    // Loading screen
    updateLoadingProgress(progress) {
        if (this.elements.loading.progress) {
            this.elements.loading.progress.style.width = `${progress}%`;
        }

        // Update loading text based on progress
        const texts = [
            'INITIALIZING NEURAL LINK...',
            'CALIBRATING SENSORS...',
            'LOADING FACILITY DATA...',
            'SYNCHRONIZING SYSTEMS...',
            'DEPLOYMENT READY'
        ];

        const textIndex = Math.floor((progress / 100) * texts.length);
        if (this.elements.loading.text && texts[textIndex]) {
            this.elements.loading.text.textContent = texts[textIndex];
        }
    }

    // HUD updates
    updateHUD(data) {
        if (!this.elements.gameHUD) return;

        const hud = this.elements.gameHUD;

        // Ammo
        if (data.ammo !== undefined && hud.ammoCounter) {
            hud.ammoCounter.textContent = data.ammo;
        }
        if (data.maxAmmo !== undefined && hud.ammoMax) {
            hud.ammoMax.textContent = data.maxAmmo;
        }

        // Health
        if (data.health !== undefined && data.maxHealth !== undefined && hud.healthBar) {
            const healthPercent = (data.health / data.maxHealth) * 100;
            hud.healthBar.style.width = `${healthPercent}%`;

            // Change color based on health
            if (healthPercent > 60) {
                hud.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #44ff44)';
            } else if (healthPercent > 30) {
                hud.healthBar.style.background = 'linear-gradient(90deg, #ffaa44, #ffff44)';
            } else {
                hud.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #aa4444)';
            }
        }

        // Battery
        if (data.battery !== undefined && hud.batteryLevel) {
            const batteryPercent = Math.round(data.battery);
            hud.batteryLevel.textContent = `${batteryPercent}%`;

            // Change color based on battery level
            if (batteryPercent > 50) {
                hud.batteryLevel.style.color = '#87ceeb';
            } else if (batteryPercent > 20) {
                hud.batteryLevel.style.color = '#ffa500';
            } else {
                hud.batteryLevel.style.color = '#ff4444';
                hud.batteryLevel.style.animation = 'pulse 1s infinite';
            }
        }

        // Objective
        if (data.objective !== undefined && hud.objectiveText) {
            hud.objectiveText.textContent = data.objective;
        }

        // Madness
        if (data.madness !== undefined && hud.madnessMeter) {
            const madnessPercent = Math.min(data.madness * 100, 100);
            hud.madnessMeter.style.width = `${madnessPercent}%`;

            // Change color based on madness level
            if (madnessPercent < 30) {
                hud.madnessMeter.style.background = 'linear-gradient(90deg, #aa44ff, #ff44aa)';
            } else if (madnessPercent < 70) {
                hud.madnessMeter.style.background = 'linear-gradient(90deg, #ff44aa, #ffaa44)';
            } else {
                hud.madnessMeter.style.background = 'linear-gradient(90deg, #ff4444, #aa4444)';
            }
        }
    }

    // Interaction prompts
    showInteractionPrompt(text) {
        if (this.elements.gameHUD.interactionPrompt) {
            this.elements.gameHUD.interactionPrompt.textContent = text;
            this.elements.gameHUD.interactionPrompt.style.opacity = '1';
        }
    }

    hideInteractionPrompt() {
        if (this.elements.gameHUD.interactionPrompt) {
            this.elements.gameHUD.interactionPrompt.style.opacity = '0';
        }
    }

    // Game over screen
    updateGameOverScreen(ending) {
        if (!this.elements.gameOver) return;

        const gameOver = this.elements.gameOver;

        if (gameOver.title) {
            gameOver.title.textContent = ending.title;
        }

        if (gameOver.stats && ending.stats) {
            let statsHTML = '<div class="stats-grid">';
            Object.entries(ending.stats).forEach(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                statsHTML += `<div class="stat-item"><span class="stat-label">${formattedKey}:</span><span class="stat-value">${value}</span></div>`;
            });
            statsHTML += '</div>';
            gameOver.stats.innerHTML = statsHTML;
        }
    }

    // Cutscene system
    updateCutscene(content) {
        if (!this.elements.cutscene) return;

        const cutscene = this.elements.cutscene;

        if (content.text && cutscene.text) {
            cutscene.text.textContent = content.text;
        }

        if (content.image && cutscene.image) {
            cutscene.image.style.backgroundImage = `url(${content.image})`;
            cutscene.image.style.display = 'block';
        } else if (cutscene.image) {
            cutscene.image.style.display = 'none';
        }
    }

    // Inventory system
    updateInventory(inventory = {}) {
        if (!this.elements.inventory.grid) return;

        const grid = this.elements.inventory.grid;
        grid.innerHTML = '';

        // Create inventory slots
        const slots = [
            { type: 'ammo', label: 'Ammo', value: inventory.ammo || 0 },
            { type: 'batteries', label: 'Batteries', value: inventory.batteries || 0 },
            { type: 'healthKits', label: 'Health Kits', value: inventory.healthKits || 0 },
            { type: 'keyCards', label: 'Key Cards', value: inventory.keyCards?.length || 0 },
            { type: 'documents', label: 'Documents', value: inventory.documents?.length || 0 }
        ];

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'inventory-slot';
            slotElement.innerHTML = `
                <div class="slot-icon">${this.getSlotIcon(slot.type)}</div>
                <div class="slot-info">
                    <div class="slot-label">${slot.label}</div>
                    <div class="slot-value">${slot.value}</div>
                </div>
            `;
            grid.appendChild(slotElement);
        });
    }

    getSlotIcon(type) {
        const icons = {
            ammo: '🔫',
            batteries: '🔋',
            healthKits: '💊',
            keyCards: '🗝️',
            documents: '📄'
        };
        return icons[type] || '📦';
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-text">${message}</div>
        `;

        this.notificationContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            achievement: '🏆'
        };
        return icons[type] || '📢';
    }

    // Event system
    emit(eventType, data = null) {
        const event = new CustomEvent('uiEvent', {
            detail: { type: eventType, data }
        });
        document.dispatchEvent(event);
    }

    on(eventType, callback) {
        document.addEventListener('uiEvent', (event) => {
            if (event.detail.type === eventType) {
                callback(event.detail.data);
            }
        });
    }

    // Utility methods
    fadeIn(element, duration = 500) {
        if (!element) return;

        element.style.opacity = '0';
        element.style.display = 'block';

        const start = performance.now();
        const animate = (timestamp) => {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 500) {
        if (!element) return;

        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity) || 1;

        const animate = (timestamp) => {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = startOpacity * (1 - progress);

            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Debug methods
    getCurrentScreen() {
        return this.currentScreen;
    }

    getDebugInfo() {
        return {
            currentScreen: this.currentScreen,
            isInitialized: this.isInitialized,
            notifications: this.notifications.length
        };
    }

    // Cleanup
    cleanup() {
        // Remove event listeners
        Object.values(this.elements).forEach(element => {
            if (element.screen) {
                // Remove all event listeners (simplified)
                const newElement = element.screen.cloneNode(true);
                element.screen.parentNode.replaceChild(newElement, element.screen);
            }
        });

        // Remove notification container
        if (this.notificationContainer && this.notificationContainer.parentNode) {
            this.notificationContainer.parentNode.removeChild(this.notificationContainer);
        }

        console.log('🧹 UI Manager cleaned up');
    }
}
