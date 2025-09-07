import * as THREE from 'three';
import { GameEngine } from './core/GameEngine.js';
import { GameState } from './core/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { InputManager } from './input/InputManager.js';

// Global game instance
let gameEngine;
let uiManager;
let audioManager;
let inputManager;

// Game configuration
const CONFIG = {
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    clock: new THREE.Clock(),
    gameState: new GameState(),

    // Game settings
    mouseSensitivity: 1.0,
    soundVolume: 0.8,
    graphicsQuality: 'medium',

    // Performance settings
    targetFPS: 60,
    pixelRatio: Math.min(window.devicePixelRatio, 2),

    // Game world settings
    worldSize: 1000,
    fogNear: 10,
    fogFar: 500,
    ambientLight: 0x404040,
};

// Initialize the game
async function init() {
    try {
        console.log('🚀 Initializing The Signal...');

        // Get canvas element
        CONFIG.canvas = document.getElementById('game-canvas');
        if (!CONFIG.canvas) {
            throw new Error('Game canvas not found');
        }

        console.log('📱 Initializing UI Manager...');
        uiManager = new UIManager();

        console.log('🔊 Initializing Audio Manager...');
        audioManager = new AudioManager(CONFIG.soundVolume);

        console.log('🎮 Initializing Input Manager...');
        inputManager = new InputManager(CONFIG.mouseSensitivity);

        console.log('🎨 Initializing Three.js...');
        await initThreeJS();

        console.log('⚙️ Initializing Game Engine...');
        gameEngine = new GameEngine(CONFIG, uiManager, audioManager, inputManager);

        console.log('👂 Setting up event listeners...');
        setupEventListeners();

        console.log('📦 Loading game assets...');
        await loadAssets();

        console.log('🔄 Starting game loop...');
        startGameLoop();

        console.log('✅ The Signal initialized successfully!');
        console.log('🎮 Game is ready to play!');

    } catch (error) {
        console.error('❌ Failed to initialize The Signal:', error);
        console.error('📋 Error details:', error.stack);
        showErrorMessage(`Failed to initialize game: ${error.message}. Please refresh the page.`);
    }
}

// Initialize Three.js renderer, scene, and camera
async function initThreeJS() {
    // Renderer
    CONFIG.renderer = new THREE.WebGLRenderer({
        canvas: CONFIG.canvas,
        antialias: CONFIG.graphicsQuality !== 'low',
        powerPreference: 'high-performance',
        alpha: false
    });

    CONFIG.renderer.setSize(window.innerWidth, window.innerHeight);
    CONFIG.renderer.setPixelRatio(CONFIG.pixelRatio);
    CONFIG.renderer.shadowMap.enabled = true;
    CONFIG.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    CONFIG.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    CONFIG.renderer.toneMappingExposure = 1.0;

    // Scene
    CONFIG.scene = new THREE.Scene();
    CONFIG.scene.fog = new THREE.Fog(0x000011, CONFIG.fogNear, CONFIG.fogFar);

    // Camera
    CONFIG.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        CONFIG.worldSize
    );

    // Lighting
    const ambientLight = new THREE.AmbientLight(CONFIG.ambientLight, 0.3);
    CONFIG.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Load game assets
async function loadAssets() {
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, loaded, total) => {
        const progress = (loaded / total) * 100;
        uiManager.updateLoadingProgress(progress);
        console.log(`Loading: ${progress.toFixed(1)}% (${url})`);
    };

    loadingManager.onLoad = () => {
        console.log('🎯 All assets loaded!');
        uiManager.showMainMenu();
    };

    loadingManager.onError = (url) => {
        console.error(`❌ Failed to load asset: ${url}`);
    };

    // Load textures, models, audio files
    await Promise.all([
        loadTextures(loadingManager),
        loadModels(loadingManager),
        audioManager.loadAudioFiles(loadingManager)
    ]);
}

// Procedural texture generation functions
function createConcreteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base gray color
    context.fillStyle = '#666666';
    context.fillRect(0, 0, 256, 256);

    // Add concrete texture pattern
    context.fillStyle = '#555555';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 8 + 2;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    // Add lighter spots
    context.fillStyle = '#777777';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 4 + 1;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

function createMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base metal color
    context.fillStyle = '#888888';
    context.fillRect(0, 0, 256, 256);

    // Add metallic highlights
    context.fillStyle = '#aaaaaa';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const width = Math.random() * 40 + 10;
        const height = Math.random() * 4 + 2;
        context.fillRect(x, y, width, height);
    }

    // Add darker areas
    context.fillStyle = '#666666';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const width = Math.random() * 30 + 5;
        const height = Math.random() * 3 + 1;
        context.fillRect(x, y, width, height);
    }

    return new THREE.CanvasTexture(canvas);
}

function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base snow color
    context.fillStyle = '#f8f8ff';
    context.fillRect(0, 0, 256, 256);

    // Add snow texture
    context.fillStyle = '#ffffff';
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 3 + 1;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    // Add subtle shadows
    context.fillStyle = '#e8e8f8';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 8 + 3;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

function createIceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base ice color
    context.fillStyle = '#87ceeb';
    context.fillRect(0, 0, 256, 256);

    // Add ice crystals
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const length = Math.random() * 40 + 10;

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + length, y);
        context.stroke();

        // Add perpendicular lines for crystal effect
        for (let j = 0; j < 3; j++) {
            const offsetX = x + (length / 4) * j;
            const offsetY = y + (Math.random() - 0.5) * 20;
            context.beginPath();
            context.moveTo(offsetX, offsetY - 10);
            context.lineTo(offsetX, offsetY + 10);
            context.stroke();
        }
    }

    return new THREE.CanvasTexture(canvas);
}

function createRustTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base rust color
    context.fillStyle = '#8b4513';
    context.fillRect(0, 0, 256, 256);

    // Add rust spots
    context.fillStyle = '#a0522d';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 15 + 5;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    // Add lighter rust areas
    context.fillStyle = '#cd853f';
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 8 + 3;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

function createBloodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base dark background
    context.fillStyle = '#2a0000';
    context.fillRect(0, 0, 256, 256);

    // Add blood splatters
    context.fillStyle = '#880000';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 20 + 5;

        // Create irregular blood splatter shape
        context.beginPath();
        context.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        context.fill();
    }

    // Add brighter blood areas
    context.fillStyle = '#aa0000';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 10 + 3;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// Load texture assets
async function loadTextures(loadingManager) {
    console.log('🎨 Generating procedural textures...');

    // Environment textures - generate procedural textures
    CONFIG.textures = {};

    // Generate procedural textures instead of loading files
    const proceduralTextures = [
        { name: 'concrete', generator: () => createConcreteTexture() },
        { name: 'metal', generator: () => createMetalTexture() },
        { name: 'snow', generator: () => createSnowTexture() },
        { name: 'ice', generator: () => createIceTexture() },
        { name: 'rust', generator: () => createRustTexture() },
        { name: 'blood', generator: () => createBloodTexture() },
    ];

    proceduralTextures.forEach(({ name, generator }) => {
        CONFIG.textures[name] = generator();
        CONFIG.textures[name].wrapS = THREE.RepeatWrapping;
        CONFIG.textures[name].wrapT = THREE.RepeatWrapping;
        console.log(`✅ Generated procedural texture: ${name}`);
    });

    console.log('🎨 Procedural texture generation complete');

    // Signal completion to loading manager
    if (loadingManager && loadingManager.onLoad) {
        loadingManager.onLoad();
    }
}

// Load 3D models
async function loadModels(loadingManager) {
    console.log('🎭 Loading 3D models...');

    // For now, we'll create procedural geometry
    // In a full implementation, you'd load GLTF models here
    CONFIG.models = {
        player: createPlayerModel(),
        enemy: createEnemyModel(),
        weapon: createWeaponModel(),
        environment: createEnvironmentModels(),
    };

    console.log('✅ 3D models loaded (procedural geometry)');
}

// Create procedural models (fallback when GLTF models aren't available)
function createPlayerModel() {
    const geometry = new THREE.BoxGeometry(1, 2, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0x444444 });
    return new THREE.Mesh(geometry, material);
}

function createEnemyModel() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0x880000 });
    return new THREE.Mesh(geometry, material);
}

function createWeaponModel() {
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x222222 });
    return new THREE.Mesh(geometry, material);
}

function createEnvironmentModels() {
    return {
        wall: new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        ),
        floor: new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        ),
        door: new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.1),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        ),
    };
}

// Setup event listeners
function setupEventListeners() {
    // Menu buttons
    document.getElementById('new-game-btn').addEventListener('click', startNewGame);
    document.getElementById('continue-btn').addEventListener('click', continueGame);
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    document.getElementById('credits-btn').addEventListener('click', showCredits);

    // Settings
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('back-to-menu').addEventListener('click', returnToMainMenu);

    // Pause menu
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('main-menu-btn').addEventListener('click', returnToMainMenu);

    // Game over
    document.getElementById('retry-btn').addEventListener('click', retryGame);
    document.getElementById('main-menu-end-btn').addEventListener('click', returnToMainMenu);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// Game control functions
function startNewGame() {
    console.log('🎮 Starting new game...');
    uiManager.hideMainMenu();
    gameEngine.startNewGame();
    audioManager.playAmbientSound('facility_ambient');
}

function continueGame() {
    console.log('📁 Continuing saved game...');

    // Check if there's a save file
    if (gameEngine.saveManager.hasSave()) {
        uiManager.hideMainMenu();
        gameEngine.loadGame();
        audioManager.playAmbientSound('facility_ambient');
    } else {
        console.log('⚠️ No save data found');
        uiManager.showNotification('No saved game found. Starting new mission...', 'warning');
        // Start new game after a short delay
        setTimeout(() => {
            startNewGame();
        }, 2000);
    }
}

function showSettings() {
    uiManager.showSettings();
}

function showCredits() {
    uiManager.showCredits();
}

function saveSettings() {
    const mouseSensitivity = parseFloat(document.getElementById('mouse-sensitivity').value);
    const soundVolume = parseFloat(document.getElementById('sound-volume').value);
    const graphicsQuality = document.getElementById('graphics-quality').value;

    CONFIG.mouseSensitivity = mouseSensitivity;
    CONFIG.soundVolume = soundVolume;
    CONFIG.graphicsQuality = graphicsQuality;

    audioManager.setVolume(soundVolume);
    inputManager.setMouseSensitivity(mouseSensitivity);

    uiManager.hideSettings();
    uiManager.showNotification('Settings saved!');
}

function resumeGame() {
    uiManager.hidePauseMenu();
    gameEngine.resume();
}

function restartGame() {
    uiManager.hidePauseMenu();
    gameEngine.restart();
}

function returnToMainMenu() {
    gameEngine.pause();
    uiManager.hideGameOver();
    uiManager.hidePauseMenu();
    uiManager.showMainMenu();
}

function retryGame() {
    uiManager.hideGameOver();
    gameEngine.restart();
}

function handleKeyPress(event) {
    switch (event.code) {
        case 'Escape':
            if (gameEngine.isPlaying && !gameEngine.isPaused) {
                gameEngine.pause();
                uiManager.showPauseMenu();
            } else if (gameEngine.isPaused) {
                resumeGame();
            }
            break;
        case 'KeyP':
            if (gameEngine.isPlaying) {
                gameEngine.pause();
                uiManager.showPauseMenu();
            }
            break;
        case 'KeyI':
            uiManager.toggleInventory();
            break;
    }
}

// Window resize handler
function onWindowResize() {
    CONFIG.camera.aspect = window.innerWidth / window.innerHeight;
    CONFIG.camera.updateProjectionMatrix();
    CONFIG.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Game loop
function startGameLoop() {
    let lastTime = 0;
    const targetFrameTime = 1000 / CONFIG.targetFPS;

    function gameLoop(currentTime) {
        requestAnimationFrame(gameLoop);

        const deltaTime = currentTime - lastTime;

        if (deltaTime >= targetFrameTime) {
            lastTime = currentTime;

            if (gameEngine && gameEngine.isPlaying && !gameEngine.isPaused) {
                update(deltaTime);
                render();
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    gameEngine.update(deltaTime);
    inputManager.update();
    audioManager.update();
}

// Render the scene
function render() {
    CONFIG.renderer.render(CONFIG.scene, CONFIG.camera);
}

// Error handling
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        z-index: 10000;
        font-family: monospace;
    `;
    errorDiv.innerHTML = `
        <h2>🚨 SYSTEM ERROR</h2>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: white; color: red; border: none; border-radius: 4px; cursor: pointer;">RELOAD</button>
    `;
    document.body.appendChild(errorDiv);
}

// Export for debugging
window.CONFIG = CONFIG;
window.gameEngine = () => gameEngine;
window.uiManager = () => uiManager;
window.audioManager = () => audioManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
    console.error('🚨 Unhandled error:', event.error);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});
