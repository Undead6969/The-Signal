export class GameState {
    constructor() {
        // Game session state
        this.isInitialized = false;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.realTime = 0;

        // Player state
        this.playerState = {
            position: { x: 0, y: 2, z: 10 },
            health: 100,
            maxHealth: 100,
            battery: 100,
            maxBattery: 100,
            ammo: 30,
            maxAmmo: 30,
            clip: 10,
            maxClip: 10,
            madness: 0.0,
            inventory: {
                ammo: 0,
                batteries: 0,
                healthKits: 0,
                keyCards: [],
                documents: []
            }
        };

        // World state
        this.worldState = {
            currentLevel: 'facility_main',
            exploredAreas: [],
            unlockedDoors: [],
            collectedItems: [],
            environmentalHazards: []
        };

        // Story state
        this.storyState = {
            currentAct: 0,
            completedObjectives: [],
            discoveredClues: [],
            plotPoints: [],
            endingPath: null
        };

        // Enemy state
        this.enemyState = {
            activeEnemies: [],
            defeatedEnemies: [],
            alertedEnemies: []
        };

        // Audio state
        this.audioState = {
            masterVolume: 0.8,
            musicVolume: 0.6,
            sfxVolume: 0.8,
            ambientVolume: 0.4,
            currentMusic: null,
            activeAmbience: []
        };

        // UI state
        this.uiState = {
            currentScreen: 'loading',
            showHUD: false,
            showInventory: false,
            notifications: [],
            objectiveText: 'Investigate the distress signal'
        };

        // Settings
        this.settings = {
            mouseSensitivity: 1.0,
            graphicsQuality: 'medium',
            soundEnabled: true,
            subtitlesEnabled: true,
            vibrationEnabled: true,
            reducedMotion: false
        };

        // Performance metrics
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            renderCalls: 0,
            triangles: 0
        };

        // Debug state
        this.debugMode = false;
        this.debugInfo = {
            showWireframe: false,
            showBoundingBoxes: false,
            showPerformance: false,
            spawnEnemies: false
        };

        console.log('🎮 Game State initialized');
    }

    // Game session management
    startNewGame() {
        console.log('🎮 Starting new game session');
        this.reset();
        this.isPlaying = true;
        this.isPaused = false;
        this.uiState.currentScreen = 'gameHUD';
        this.uiState.showHUD = true;
    }

    pauseGame() {
        console.log('⏸️ Game paused');
        this.isPaused = true;
        this.uiState.currentScreen = 'pauseMenu';
    }

    resumeGame() {
        console.log('▶️ Game resumed');
        this.isPaused = false;
        this.uiState.currentScreen = 'gameHUD';
    }

    endGame(reason = 'unknown') {
        console.log(`🏁 Game ended: ${reason}`);
        this.isPlaying = false;
        this.isPaused = false;
        this.uiState.currentScreen = 'gameOver';
        this.uiState.showHUD = false;
    }

    reset() {
        console.log('🔄 Resetting game state');
        this.gameTime = 0;
        this.realTime = 0;

        // Reset player state
        this.playerState = {
            position: { x: 0, y: 2, z: 10 },
            health: 100,
            maxHealth: 100,
            battery: 100,
            maxBattery: 100,
            ammo: 30,
            maxAmmo: 30,
            clip: 10,
            maxClip: 10,
            madness: 0.0,
            inventory: {
                ammo: 0,
                batteries: 0,
                healthKits: 0,
                keyCards: [],
                documents: []
            }
        };

        // Reset world state
        this.worldState = {
            currentLevel: 'facility_main',
            exploredAreas: [],
            unlockedDoors: [],
            collectedItems: [],
            environmentalHazards: []
        };

        // Reset story state
        this.storyState = {
            currentAct: 0,
            completedObjectives: [],
            discoveredClues: [],
            plotPoints: [],
            endingPath: null
        };

        // Reset enemy state
        this.enemyState = {
            activeEnemies: [],
            defeatedEnemies: [],
            alertedEnemies: []
        };

        // Reset UI state
        this.uiState = {
            currentScreen: 'mainMenu',
            showHUD: false,
            showInventory: false,
            notifications: [],
            objectiveText: 'Investigate the distress signal'
        };
    }

    // Player state management
    updatePlayerState(updates) {
        Object.assign(this.playerState, updates);
    }

    getPlayerPosition() {
        return { ...this.playerState.position };
    }

    setPlayerPosition(x, y, z) {
        this.playerState.position = { x, y, z };
    }

    takeDamage(amount) {
        this.playerState.health = Math.max(0, this.playerState.health - amount);
        if (this.playerState.health <= 0) {
            this.endGame('death');
        }
        return this.playerState.health;
    }

    heal(amount) {
        this.playerState.health = Math.min(this.playerState.maxHealth, this.playerState.health + amount);
        return this.playerState.health;
    }

    useBattery(amount) {
        this.playerState.battery = Math.max(0, this.playerState.battery - amount);
        return this.playerState.battery;
    }

    rechargeBattery(amount) {
        this.playerState.battery = Math.min(this.playerState.maxBattery, this.playerState.battery + amount);
        return this.playerState.battery;
    }

    fireWeapon() {
        if (this.playerState.clip > 0) {
            this.playerState.clip--;
            return true;
        }
        return false; // No ammo
    }

    reloadWeapon() {
        const ammoNeeded = this.playerState.maxClip - this.playerState.clip;
        const ammoToUse = Math.min(ammoNeeded, this.playerState.ammo);

        if (ammoToUse > 0) {
            this.playerState.clip += ammoToUse;
            this.playerState.ammo -= ammoToUse;
            return true;
        }
        return false; // No ammo available
    }

    addAmmo(amount) {
        this.playerState.ammo = Math.min(this.playerState.maxAmmo, this.playerState.ammo + amount);
    }

    increaseMadness(amount) {
        this.playerState.madness = Math.min(1.0, this.playerState.madness + amount);
        return this.playerState.madness;
    }

    decreaseMadness(amount) {
        this.playerState.madness = Math.max(0.0, this.playerState.madness - amount);
        return this.playerState.madness;
    }

    // Inventory management
    addItem(type, item) {
        if (Array.isArray(this.playerState.inventory[type])) {
            this.playerState.inventory[type].push(item);
        } else {
            this.playerState.inventory[type] = (this.playerState.inventory[type] || 0) + item;
        }
    }

    removeItem(type, item) {
        if (Array.isArray(this.playerState.inventory[type])) {
            const index = this.playerState.inventory[type].indexOf(item);
            if (index > -1) {
                this.playerState.inventory[type].splice(index, 1);
                return true;
            }
        } else {
            if (this.playerState.inventory[type] >= item) {
                this.playerState.inventory[type] -= item;
                return true;
            }
        }
        return false;
    }

    hasItem(type, item) {
        if (Array.isArray(this.playerState.inventory[type])) {
            return this.playerState.inventory[type].includes(item);
        } else {
            return this.playerState.inventory[type] >= item;
        }
    }

    // World state management
    markAreaExplored(areaId) {
        if (!this.worldState.exploredAreas.includes(areaId)) {
            this.worldState.exploredAreas.push(areaId);
        }
    }

    unlockDoor(doorId) {
        if (!this.worldState.unlockedDoors.includes(doorId)) {
            this.worldState.unlockedDoors.push(doorId);
        }
    }

    collectItem(itemId) {
        if (!this.worldState.collectedItems.includes(itemId)) {
            this.worldState.collectedItems.push(itemId);
        }
    }

    // Story state management
    completeObjective(objectiveId) {
        if (!this.storyState.completedObjectives.includes(objectiveId)) {
            this.storyState.completedObjectives.push(objectiveId);
        }
    }

    discoverClue(clueId) {
        if (!this.storyState.discoveredClues.includes(clueId)) {
            this.storyState.discoveredClues.push(clueId);
        }
    }

    setEndingPath(path) {
        this.storyState.endingPath = path;
    }

    // UI state management
    addNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration,
            timestamp: this.realTime
        };
        this.uiState.notifications.push(notification);
    }

    removeNotification(id) {
        this.uiState.notifications = this.uiState.notifications.filter(n => n.id !== id);
    }

    updateObjectiveText(text) {
        this.uiState.objectiveText = text;
    }

    // Settings management
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
    }

    // Performance tracking
    updatePerformanceMetrics(metrics) {
        Object.assign(this.performanceMetrics, metrics);
    }

    // Time management
    updateTime(deltaTime) {
        if (this.isPlaying && !this.isPaused) {
            this.gameTime += deltaTime;
        }
        this.realTime += deltaTime;
    }

    // Save/Load system
    getSaveData() {
        return {
            version: '1.0.0',
            timestamp: Date.now(),
            gameTime: this.gameTime,
            playerState: { ...this.playerState },
            worldState: { ...this.worldState },
            storyState: { ...this.storyState },
            enemyState: { ...this.enemyState },
            audioState: { ...this.audioState },
            settings: { ...this.settings }
        };
    }

    loadSaveData(saveData) {
        if (saveData.version !== '1.0.0') {
            console.warn('Save data version mismatch');
        }

        this.gameTime = saveData.gameTime || 0;
        this.playerState = { ...saveData.playerState };
        this.worldState = { ...saveData.worldState };
        this.storyState = { ...saveData.storyState };
        this.enemyState = { ...saveData.enemyState };
        this.audioState = { ...saveData.audioState };
        this.settings = { ...saveData.settings };

        console.log('💾 Game state loaded from save data');
    }

    // Debug methods
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`🐛 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    }

    getDebugInfo() {
        return {
            gameTime: Math.floor(this.gameTime),
            realTime: Math.floor(this.realTime),
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            playerHealth: this.playerState.health,
            playerMadness: this.playerState.madness,
            currentAct: this.storyState.currentAct,
            activeEnemies: this.enemyState.activeEnemies.length,
            exploredAreas: this.worldState.exploredAreas.length,
            collectedItems: this.worldState.collectedItems.length
        };
    }

    // Utility methods
    isGameComplete() {
        return this.storyState.endingPath !== null;
    }

    getGameProgress() {
        const totalObjectives = 10; // Approximate total objectives
        const completedObjectives = this.storyState.completedObjectives.length;
        return Math.min(100, Math.floor((completedObjectives / totalObjectives) * 100));
    }

    getEndingType() {
        return this.storyState.endingPath;
    }
}
