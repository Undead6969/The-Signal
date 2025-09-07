import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelManager {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.models = new Map();
        this.gltfLoader = new GLTFLoader();

        // Configure GLTF loader with loading manager
        if (this.loadingManager) {
            this.gltfLoader.manager = this.loadingManager;
        }

        console.log('🎮 Initializing 3D Model Manager...');
    }

    async loadModels() {
        console.log('🎮 Loading 3D model assets...');

        // Character models
        const characterModels = {
            'player': './assets/models/characters/player.glb',
            'scientist_infected': './assets/models/characters/scientist_infected.glb',
            'soldier_corrupted': './assets/models/characters/soldier_corrupted.glb',
            'signal_entity': './assets/models/characters/signal_entity.glb'
        };

        // Weapon models
        const weaponModels = {
            'pistol': './assets/models/weapons/pistol.glb',
            'rifle': './assets/models/weapons/rifle.glb',
            'shotgun': './assets/models/weapons/shotgun.glb'
        };

        // Environment models
        const environmentModels = {
            'door_frame': './assets/models/environment/door_frame.glb',
            'computer_terminal': './assets/models/environment/computer_terminal.glb',
            'research_equipment': './assets/models/environment/research_equipment.glb',
            'furniture_desk': './assets/models/environment/furniture_desk.glb',
            'furniture_chair': './assets/models/environment/furniture_chair.glb',
            'ventilation_system': './assets/models/environment/ventilation_system.glb',
            'security_camera': './assets/models/environment/security_camera.glb'
        };

        // Props models
        const propsModels = {
            'keycard': './assets/models/props/keycard.glb',
            'battery': './assets/models/props/battery.glb',
            'document': './assets/models/props/document.glb',
            'medical_supplies': './assets/models/props/medical_supplies.glb',
            'ammo_box': './assets/models/props/ammo_box.glb',
            'radio_transmitter': './assets/models/props/radio_transmitter.glb',
            'research_log': './assets/models/props/research_log.glb'
        };

        // Load all model categories
        const loadPromises = [
            this.loadModelCategory(characterModels, 'characters'),
            this.loadModelCategory(weaponModels, 'weapons'),
            this.loadModelCategory(environmentModels, 'environment'),
            this.loadModelCategory(propsModels, 'props')
        ];

        try {
            await Promise.all(loadPromises);
            console.log('✅ All 3D models loaded successfully');
        } catch (error) {
            console.warn('⚠️ Some 3D models failed to load:', error);
            console.log('🎮 Continuing with available models...');
        }
    }

    async loadModelCategory(modelList, category) {
        for (const [name, url] of Object.entries(modelList)) {
            try {
                const model = await this.loadModel(url);
                this.models.set(name, model);
                console.log(`✅ Loaded ${category} model: ${name}`);
            } catch (error) {
                console.warn(`⚠️ ${category} model not found: ${name} (${url})`);
                // Create placeholder entry for missing models
                this.models.set(name, null);
            }
        }
    }

    async loadModel(url) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    // Process the loaded model
                    const model = this.processModel(gltf);
                    resolve(model);
                },
                (progress) => {
                    // Optional: progress callback
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    processModel(gltf) {
        const model = gltf.scene;

        // Enable shadows for all meshes
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Ensure materials are properly configured
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => this.configureMaterial(mat));
                    } else {
                        this.configureMaterial(child.material);
                    }
                }
            }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        return {
            scene: model,
            animations: gltf.animations || [],
            originalBox: box,
            center: center
        };
    }

    configureMaterial(material) {
        // Ensure proper material settings for the horror game
        if (material.map) {
            material.map.encoding = THREE.sRGBEncoding;
        }

        if (material.emissiveMap) {
            material.emissiveMap.encoding = THREE.sRGBEncoding;
        }

        // Set appropriate material properties for the game
        material.needsUpdate = true;
    }

    getModel(name) {
        return this.models.get(name) || null;
    }

    hasModel(name) {
        const model = this.models.get(name);
        return model !== null && model !== undefined;
    }

    // Create instance of a model
    createModelInstance(name, options = {}) {
        const modelData = this.getModel(name);

        if (!modelData) {
            console.warn(`Model not found: ${name}`);
            return this.createPlaceholderModel(name);
        }

        // Clone the model scene
        const instance = modelData.scene.clone();

        // Apply transformations
        if (options.position) {
            instance.position.copy(options.position);
        }

        if (options.rotation) {
            instance.rotation.copy(options.rotation);
        }

        if (options.scale) {
            instance.scale.copy(options.scale);
        }

        // Store original model data
        instance.userData.originalModel = name;
        instance.userData.animations = modelData.animations;

        return instance;
    }

    // Create placeholder model when real model isn't available
    createPlaceholderModel(name) {
        console.log(`📦 Creating placeholder for: ${name}`);

        let geometry, material;

        // Create appropriate placeholder based on model type
        if (name.includes('player') || name.includes('scientist') || name.includes('soldier')) {
            // Character placeholder
            geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8);
            material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        } else if (name.includes('pistol') || name.includes('rifle') || name.includes('shotgun')) {
            // Weapon placeholder
            geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
            material = new THREE.MeshLambertMaterial({ color: 0x444444 });
        } else if (name.includes('door') || name.includes('computer') || name.includes('equipment')) {
            // Environment placeholder
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        } else {
            // Generic prop placeholder
            geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        }

        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.castShadow = true;
        placeholder.receiveShadow = true;
        placeholder.userData.isPlaceholder = true;
        placeholder.userData.originalModel = name;

        return placeholder;
    }

    // Get all available models
    getAvailableModels() {
        const available = [];
        for (const [name, model] of this.models) {
            if (model) {
                available.push(name);
            }
        }
        return available;
    }

    // Get loading status
    getLoadingStatus() {
        const total = this.models.size;
        let loaded = 0;

        for (const model of this.models.values()) {
            if (model) loaded++;
        }

        return {
            total,
            loaded,
            percentage: total > 0 ? (loaded / total) * 100 : 0
        };
    }

    // Play animation on model instance
    playAnimation(instance, animationName) {
        if (!instance.userData.animations || instance.userData.animations.length === 0) {
            return null;
        }

        // Find animation by name
        const animation = instance.userData.animations.find(anim =>
            anim.name.toLowerCase().includes(animationName.toLowerCase())
        );

        if (!animation) {
            console.warn(`Animation not found: ${animationName}`);
            return null;
        }

        // Create animation mixer
        const mixer = new THREE.AnimationMixer(instance);
        const action = mixer.clipAction(animation);
        action.play();

        return mixer;
    }

    // Cleanup models
    dispose() {
        for (const model of this.models.values()) {
            if (model && model.scene) {
                model.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
        }
        this.models.clear();
        console.log('🧹 Model Manager disposed');
    }
}
