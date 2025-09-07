import * as THREE from 'three';
import { Player } from './Player.js';
import { EnemyManager } from './EnemyManager.js';
import { WorldManager } from './WorldManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { StoryManager } from './StoryManager.js';
import { EffectManager } from './EffectManager.js';
import { SaveManager } from './SaveManager.js';

export class GameEngine {
    constructor(config, uiManager, audioManager, inputManager) {
        this.config = config;
        this.scene = config.scene;
        this.camera = config.camera;
        this.renderer = config.renderer;
        this.clock = config.clock;

        // External managers
        this.uiManager = uiManager;
        this.audioManager = audioManager;
        this.inputManager = inputManager;

        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.deltaTime = 0;

        // Core systems
        this.player = null;
        this.enemyManager = null;
        this.worldManager = null;
        this.physicsManager = null;
        this.storyManager = null;
        this.effectManager = null;
        this.saveManager = new SaveManager();

        // Game world
        this.worldBounds = new THREE.Box3(
            new THREE.Vector3(-config.worldSize/2, -10, -config.worldSize/2),
            new THREE.Vector3(config.worldSize/2, config.worldSize, config.worldSize/2)
        );

        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 0;

        this.init();
    }

    async init() {
        console.log('🔧 Initializing Game Engine...');

        // Initialize core systems
        this.physicsManager = new PhysicsManager();
        this.worldManager = new WorldManager(this.scene, this.config);
        this.player = new Player(this.camera, this.config);
        this.enemyManager = new EnemyManager(this.scene, this.physicsManager);
        this.storyManager = new StoryManager(this);
        this.effectManager = new EffectManager(this.scene, this.camera);

        // Setup initial world
        await this.worldManager.generateFacility();

        // Setup lighting
        this.setupLighting();

        // Setup post-processing effects
        this.setupPostProcessing();

        console.log('✅ Game Engine initialized');
    }

    setupLighting() {
        // Remove existing lights
        this.scene.children = this.scene.children.filter(child => !(child instanceof THREE.Light));

        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);

        // Main directional light (simulating facility lighting)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Emergency red lights
        this.emergencyLights = [];
        for (let i = 0; i < 5; i++) {
            const emergencyLight = new THREE.PointLight(0xff0000, 0.5, 20);
            emergencyLight.position.set(
                (Math.random() - 0.5) * 100,
                15,
                (Math.random() - 0.5) * 100
            );
            emergencyLight.castShadow = true;
            this.scene.add(emergencyLight);
            this.emergencyLights.push(emergencyLight);
        }

        // Flickering flashlight effect
        this.flashlight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI / 6, 0.5);
        this.flashlight.position.copy(this.camera.position);
        this.flashlight.target.position.copy(this.camera.position).add(new THREE.Vector3(0, 0, -1));
        this.scene.add(this.flashlight);
        this.scene.add(this.flashlight.target);
    }

    setupPostProcessing() {
        // Create render targets for post-processing
        this.renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                stencilBuffer: false
            }
        );

        // Signal interference effect
        this.signalInterference = {
            intensity: 0,
            frequency: 0,
            time: 0
        };

        // Chromatic aberration effect
        this.chromaticAberration = {
            intensity: 0,
            offset: new THREE.Vector2(0, 0)
        };

        // Screen distortion effect
        this.screenDistortion = {
            intensity: 0,
            time: 0
        };
    }

    startNewGame() {
        console.log('🎮 Starting new game...');

        this.isPlaying = true;
        this.isPaused = false;
        this.gameTime = 0;

        // Reset player
        this.player.reset();

        // Reset world
        this.worldManager.reset();

        // Reset enemies
        this.enemyManager.reset();

        // Start story
        this.storyManager.startStory();

        // Position camera at spawn point
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 2, 0);

        console.log('✅ New game started');
    }

    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;

        this.deltaTime = deltaTime / 1000; // Convert to seconds
        this.gameTime += this.deltaTime;

        // Update performance metrics
        this.updatePerformanceMetrics();

        // Update core systems
        this.player.update(this.deltaTime);
        this.enemyManager.update(this.deltaTime, this.player);
        this.worldManager.update(this.deltaTime);
        this.physicsManager.update(this.deltaTime);
        this.storyManager.update(this.deltaTime);
        this.effectManager.update(this.deltaTime);

        // Update dynamic effects
        this.updateLighting();
        this.updatePostProcessing();

        // Check win/lose conditions
        this.checkGameState();
    }

    updatePerformanceMetrics() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFPSUpdate > 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;

            // Update FPS display (if enabled)
            if (this.config.debugMode) {
                document.getElementById('fps-counter').textContent = `FPS: ${this.fps}`;
            }
        }
    }

    updateLighting() {
        // Update flashlight position and direction
        this.flashlight.position.copy(this.camera.position);
        this.flashlight.target.position.copy(this.camera.position)
            .add(new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion));

        // Flicker flashlight based on battery
        const batteryLevel = this.player.getBatteryLevel();
        if (batteryLevel < 0.3) {
            const flicker = Math.sin(this.gameTime * 20) * 0.3 + 0.7;
            this.flashlight.intensity = flicker * (batteryLevel / 0.3);
        } else {
            this.flashlight.intensity = 1.0;
        }

        // Flicker emergency lights
        this.emergencyLights.forEach((light, index) => {
            const flicker = Math.sin(this.gameTime * (2 + index * 0.5)) * 0.3 + 0.7;
            light.intensity = flicker * 0.5;
        });
    }

    updatePostProcessing() {
        // Update signal interference based on player proximity to source
        const distanceToSignal = this.player.getDistanceToSignal();
        this.signalInterference.intensity = Math.max(0, 1 - distanceToSignal / 50);
        this.signalInterference.frequency = 0.5 + this.signalInterference.intensity * 2;
        this.signalInterference.time += this.deltaTime;

        // Update chromatic aberration based on madness level
        const madnessLevel = this.player.getMadnessLevel();
        this.chromaticAberration.intensity = madnessLevel * 0.01;
        this.chromaticAberration.offset.set(
            Math.sin(this.gameTime * 2) * this.chromaticAberration.intensity,
            Math.cos(this.gameTime * 2) * this.chromaticAberration.intensity
        );

        // Update screen distortion
        this.screenDistortion.intensity = madnessLevel * 0.1;
        this.screenDistortion.time += this.deltaTime;
    }

    checkGameState() {
        // Check if player is dead
        if (this.player.isDead) {
            this.gameOver('death');
            return;
        }

        // Check if player has completed objectives
        if (this.storyManager.isStoryComplete()) {
            this.gameOver('completion');
            return;
        }

        // Check if player has gone insane
        if (this.player.getMadnessLevel() >= 1.0) {
            this.gameOver('insanity');
            return;
        }
    }

    gameOver(reason) {
        console.log(`💀 Game Over: ${reason}`);
        this.isPlaying = false;

        // Show appropriate ending based on reason
        this.showEnding(reason);
    }

    showEnding(reason) {
        const endings = {
            death: {
                title: "MISSION FAILED",
                message: "You have been terminated. The signal continues...",
                stats: this.getGameStats()
            },
            completion: {
                title: "SIGNAL DESTROYED",
                message: "You have destroyed the source. But was it enough?",
                stats: this.getGameStats()
            },
            insanity: {
                title: "SIGNAL ACCEPTED",
                message: "The signal has consumed you. You are now part of it.",
                stats: this.getGameStats()
            }
        };

        const ending = endings[reason] || endings.death;
        this.uiManager.showGameOver(ending);
    }

    getGameStats() {
        return {
            timeSurvived: Math.floor(this.gameTime),
            enemiesKilled: this.enemyManager.getEnemiesKilled(),
            ammoUsed: this.player.getAmmoUsed(),
            areasExplored: this.worldManager.getAreasExplored(),
            madnessLevel: Math.floor(this.player.getMadnessLevel() * 100)
        };
    }

    pause() {
        this.isPaused = true;
        this.inputManager.onPause();
        console.log('⏸️ Game paused');
    }

    resume() {
        this.isPaused = false;
        this.inputManager.onResume();
        console.log('▶️ Game resumed');
    }

    restart() {
        console.log('🔄 Restarting game...');
        this.cleanup();
        this.startNewGame();
    }

    cleanup() {
        // Clean up resources
        this.enemyManager.cleanup();
        this.worldManager.cleanup();
        this.effectManager.cleanup();
        this.physicsManager.cleanup();

        // Reset game state
        this.gameTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
    }

    loadGame(slot = null) {
        console.log('📁 Loading saved game...');

        const saveData = this.saveManager.loadGame(slot);
        if (saveData) {
            // Restore game state
            this.gameTime = saveData.gameTime || 0;
            this.player.loadSaveData(saveData.playerState);
            this.worldManager.loadSaveData(saveData.worldState);
            this.enemyManager.loadSaveData(saveData.enemyState);
            this.storyManager.loadSaveData(saveData.storyState);

            this.isPlaying = true;
            this.isPaused = false;
            console.log('✅ Game loaded successfully');
        } else {
            console.log('⚠️ No save data found, starting new game');
            this.startNewGame();
        }
    }

    saveGame(slot = null) {
        console.log('💾 Saving game...');

        const saveData = {
            gameTime: this.gameTime,
            playerState: this.player.getSaveData(),
            worldState: this.worldManager.getSaveData(),
            enemyState: this.enemyManager.getSaveData(),
            storyState: this.storyManager.getSaveData()
        };

        const success = this.saveManager.saveGame(saveData, slot);
        if (success) {
            console.log('✅ Game saved successfully');
            this.uiManager.showNotification('Game saved!', 'success');
        } else {
            console.log('❌ Failed to save game');
            this.uiManager.showNotification('Failed to save game', 'error');
        }
    }

    // Getters for external access
    getPlayer() { return this.player; }
    getEnemies() { return this.enemyManager.getEnemies(); }
    getWorld() { return this.worldManager; }
    getPhysics() { return this.physicsManager; }
    getStory() { return this.storyManager; }
    getEffects() { return this.effectManager; }

    // Debug methods
    toggleDebugMode() {
        this.config.debugMode = !this.config.debugMode;
        console.log(`🐛 Debug mode: ${this.config.debugMode ? 'ON' : 'OFF'}`);
    }

    getDebugInfo() {
        return {
            fps: this.fps,
            gameTime: this.gameTime,
            playerPosition: this.player.getPosition(),
            enemyCount: this.enemyManager.getEnemyCount(),
            madnessLevel: this.player.getMadnessLevel(),
            batteryLevel: this.player.getBatteryLevel(),
            ammoCount: this.player.getAmmoCount()
        };
    }
}
