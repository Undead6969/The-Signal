import * as THREE from 'three';

export class TextureManager {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.textures = new Map();
        this.textureLoader = new THREE.TextureLoader();

        // Configure texture loader with loading manager
        if (this.loadingManager) {
            this.textureLoader.manager = this.loadingManager;
        }

        console.log('🎨 Initializing Texture Manager...');
    }

    async loadTextures() {
        console.log('🎨 Loading texture assets...');

        // Wall textures
        const wallTextures = {
            'concrete_wall': './assets/textures/walls/concrete_wall.jpg',
            'concrete_wall_normal': './assets/textures/walls/concrete_wall_normal.jpg',
            'metal_wall': './assets/textures/walls/metal_wall.jpg',
            'metal_wall_normal': './assets/textures/walls/metal_wall_normal.jpg',
            'rusted_metal': './assets/textures/walls/rusted_metal.jpg',
            'facility_panel': './assets/textures/walls/facility_panel.jpg'
        };

        // Floor textures
        const floorTextures = {
            'concrete_floor': './assets/textures/floors/concrete_floor.jpg',
            'concrete_floor_normal': './assets/textures/floors/concrete_floor_normal.jpg',
            'metal_grate': './assets/textures/floors/metal_grate.jpg',
            'snow_covered': './assets/textures/floors/snow_covered.jpg',
            'ice_floor': './assets/textures/floors/ice_floor.jpg'
        };

        // Detail textures
        const detailTextures = {
            'blood_stains': './assets/textures/details/blood_stains.jpg',
            'rust_overlay': './assets/textures/details/rust_overlay.jpg',
            'corrosion': './assets/textures/details/corrosion.jpg',
            'warning_signs': './assets/textures/details/warning_signs.jpg',
            'graffiti': './assets/textures/details/graffiti.jpg'
        };

        // Environment textures
        const environmentTextures = {
            'snow': './assets/textures/environment/snow.jpg',
            'snow_normal': './assets/textures/environment/snow_normal.jpg',
            'ice_formations': './assets/textures/environment/ice_formations.jpg',
            'facility_details': './assets/textures/environment/facility_details.jpg'
        };

        // Load all texture categories
        const loadPromises = [
            this.loadTextureCategory(wallTextures, 'walls'),
            this.loadTextureCategory(floorTextures, 'floors'),
            this.loadTextureCategory(detailTextures, 'details'),
            this.loadTextureCategory(environmentTextures, 'environment')
        ];

        try {
            await Promise.all(loadPromises);
            console.log('✅ All textures loaded successfully');
        } catch (error) {
            console.warn('⚠️ Some textures failed to load:', error);
            console.log('🎨 Continuing with available textures...');
        }
    }

    async loadTextureCategory(textureList, category) {
        for (const [name, url] of Object.entries(textureList)) {
            try {
                const texture = await this.loadTexture(url);
                this.textures.set(name, texture);
                console.log(`✅ Loaded ${category} texture: ${name}`);
            } catch (error) {
                console.warn(`⚠️ ${category} texture not found: ${name} (${url})`);
                // Create placeholder entry for missing textures
                this.textures.set(name, null);
            }
        }
    }

    async loadTexture(url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // Configure texture properties
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.encoding = THREE.sRGBEncoding;

                    // Generate mipmaps for better quality
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;

                    resolve(texture);
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

    getTexture(name) {
        return this.textures.get(name) || null;
    }

    hasTexture(name) {
        const texture = this.textures.get(name);
        return texture !== null && texture !== undefined;
    }

    // Get texture with fallback
    getTextureWithFallback(name, fallbackName = null) {
        let texture = this.getTexture(name);

        if (!texture && fallbackName) {
            texture = this.getTexture(fallbackName);
        }

        return texture;
    }

    // Create material with texture
    createMaterial(name, options = {}) {
        const texture = this.getTexture(name);

        if (!texture) {
            // Fallback to basic material
            return new THREE.MeshLambertMaterial({
                color: options.fallbackColor || 0x666666,
                ...options
            });
        }

        return new THREE.MeshLambertMaterial({
            map: texture,
            ...options
        });
    }

    // Create normal material (for bump mapping)
    createNormalMaterial(diffuseName, normalName, options = {}) {
        const diffuseTexture = this.getTexture(diffuseName);
        const normalTexture = this.getTexture(normalName);

        const materialOptions = { ...options };

        if (diffuseTexture) {
            materialOptions.map = diffuseTexture;
        }

        if (normalTexture) {
            materialOptions.normalMap = normalTexture;
            materialOptions.normalScale = new THREE.Vector2(1, 1);
        }

        return new THREE.MeshLambertMaterial(materialOptions);
    }

    // Get all available textures
    getAvailableTextures() {
        const available = [];
        for (const [name, texture] of this.textures) {
            if (texture) {
                available.push(name);
            }
        }
        return available;
    }

    // Get loading status
    getLoadingStatus() {
        const total = this.textures.size;
        let loaded = 0;

        for (const texture of this.textures.values()) {
            if (texture) loaded++;
        }

        return {
            total,
            loaded,
            percentage: total > 0 ? (loaded / total) * 100 : 0
        };
    }

    // Cleanup textures
    dispose() {
        for (const texture of this.textures.values()) {
            if (texture) {
                texture.dispose();
            }
        }
        this.textures.clear();
        console.log('🧹 Texture Manager disposed');
    }
}
