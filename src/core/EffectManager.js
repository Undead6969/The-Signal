import * as THREE from 'three';

export class EffectManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Effect collections
        this.particles = [];
        this.lights = [];
        this.postProcessingEffects = [];
        this.activeEffects = new Map();

        // Effect pools for performance
        this.particlePool = [];
        this.lightPool = [];

        // Effect settings
        this.maxParticles = 1000;
        this.maxLights = 50;

        // Signal interference effect
        this.signalInterference = {
            intensity: 0,
            time: 0,
            frequency: 1.0
        };

        // Hallucination effects
        this.hallucinations = {
            active: false,
            intensity: 0,
            fakeEnemies: [],
            distortedGeometry: []
        };

        // Screen effects
        this.screenEffects = {
            chromaticAberration: 0,
            vignette: 0,
            scanlines: 0,
            noise: 0
        };

        this.init();
    }

    init() {
        console.log('✨ Initializing Effect Manager...');

        // Create particle pools
        this.createParticlePool(200);

        // Create light pools
        this.createLightPool(20);

        // Setup post-processing
        this.setupPostProcessing();

        console.log('✅ Effect Manager initialized');
    }

    createParticlePool(size) {
        for (let i = 0; i < size; i++) {
            const geometry = new THREE.SphereGeometry(0.02);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            this.particlePool.push(particle);
            this.scene.add(particle);
        }
    }

    createLightPool(size) {
        for (let i = 0; i < size; i++) {
            const light = new THREE.PointLight(0xffffff, 1, 10);
            light.visible = false;
            this.lightPool.push(light);
            this.scene.add(light);
        }
    }

    setupPostProcessing() {
        // Create render targets for effects
        this.renderTarget1 = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            }
        );

        this.renderTarget2 = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            }
        );

        // Signal interference shader
        this.signalShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                intensity: { value: 0 },
                frequency: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float intensity;
                uniform float frequency;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    vec4 color = texture2D(tDiffuse, uv);

                    // Add signal interference
                    float noise = sin(uv.y * frequency + time * 10.0) * intensity * 0.1;
                    uv.x += noise;

                    // Chromatic aberration
                    float aberration = intensity * 0.01;
                    vec4 r = texture2D(tDiffuse, uv + vec2(aberration, 0.0));
                    vec4 g = texture2D(tDiffuse, uv);
                    vec4 b = texture2D(tDiffuse, uv - vec2(aberration, 0.0));

                    gl_FragColor = vec4(r.r, g.g, b.b, color.a);
                }
            `
        };

        // Create shader materials
        this.signalMaterial = new THREE.ShaderMaterial(this.signalShader);

        // Create quad for post-processing
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.postQuad = new THREE.Mesh(geometry, this.signalMaterial);
        this.postQuad.visible = false;
        this.scene.add(this.postQuad);
    }

    update(deltaTime) {
        // Update particle effects
        this.updateParticles(deltaTime);

        // Update light effects
        this.updateLights(deltaTime);

        // Update signal interference
        this.updateSignalInterference(deltaTime);

        // Update hallucinations
        this.updateHallucinations(deltaTime);

        // Update post-processing effects
        this.updatePostProcessing(deltaTime);
    }

    updateParticles(deltaTime) {
        this.particles.forEach((particle, index) => {
            if (particle.active) {
                // Update particle position
                particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

                // Update particle lifetime
                particle.lifetime -= deltaTime;

                // Update particle appearance
                if (particle.material.opacity > 0) {
                    particle.material.opacity -= deltaTime * particle.fadeSpeed;
                }

                // Remove dead particles
                if (particle.lifetime <= 0 || particle.material.opacity <= 0) {
                    this.deactivateParticle(particle);
                }
            }
        });
    }

    updateLights(deltaTime) {
        this.lights.forEach((light, index) => {
            if (light.active) {
                // Update light flicker
                if (light.flicker) {
                    const flicker = Math.sin(this.signalInterference.time * light.flickerSpeed) * light.flickerIntensity + 1;
                    light.intensity = light.baseIntensity * flicker;
                }

                // Update light lifetime
                if (light.lifetime) {
                    light.lifetime -= deltaTime;
                    if (light.lifetime <= 0) {
                        this.deactivateLight(light);
                    }
                }
            }
        });
    }

    updateSignalInterference(deltaTime) {
        this.signalInterference.time += deltaTime;

        // Update shader uniforms
        if (this.signalMaterial) {
            this.signalMaterial.uniforms.time.value = this.signalInterference.time;
            this.signalMaterial.uniforms.intensity.value = this.signalInterference.intensity;
            this.signalMaterial.uniforms.frequency.value = this.signalInterference.frequency;
        }
    }

    updateHallucinations(deltaTime) {
        if (this.hallucinations.active) {
            // Update fake enemy positions (they should move erratically)
            this.hallucinations.fakeEnemies.forEach(fakeEnemy => {
                fakeEnemy.position.add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 0.1,
                        0,
                        (Math.random() - 0.5) * 0.1
                    )
                );
            });

            // Update distorted geometry
            this.hallucinations.distortedGeometry.forEach(geometry => {
                // Apply subtle distortions
                geometry.rotation.x += Math.sin(this.signalInterference.time * 2) * 0.01;
                geometry.rotation.z += Math.cos(this.signalInterference.time * 1.5) * 0.01;
            });
        }
    }

    updatePostProcessing(deltaTime) {
        // Update screen effects
        this.screenEffects.chromaticAberration = this.signalInterference.intensity * 0.02;
        this.screenEffects.vignette = 0.3 + this.signalInterference.intensity * 0.2;
        this.screenEffects.scanlines = this.signalInterference.intensity * 0.5;
        this.screenEffects.noise = this.signalInterference.intensity * 0.3;
    }

    // Particle effects
    createParticleEffect(position, options = {}) {
        const count = options.count || 10;
        const color = options.color || 0xffffff;
        const size = options.size || 0.02;
        const speed = options.speed || 5;
        const lifetime = options.lifetime || 2.0;

        for (let i = 0; i < count; i++) {
            const particle = this.getParticleFromPool();
            if (particle) {
                // Set particle properties
                particle.position.copy(position);
                particle.material.color.setHex(color);
                particle.scale.setScalar(size);
                particle.material.opacity = 1.0;

                // Random velocity
                particle.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed
                );

                particle.lifetime = lifetime;
                particle.fadeSpeed = 1.0 / lifetime;
                particle.active = true;
                particle.visible = true;
            }
        }
    }

    getParticleFromPool() {
        return this.particlePool.find(particle => !particle.active);
    }

    deactivateParticle(particle) {
        particle.active = false;
        particle.visible = false;
        particle.velocity.set(0, 0, 0);
    }

    // Light effects
    createLightEffect(position, options = {}) {
        const light = this.getLightFromPool();
        if (light) {
            light.position.copy(position);
            light.color.setHex(options.color || 0xffffff);
            light.intensity = options.intensity || 1.0;
            light.distance = options.distance || 10;
            light.baseIntensity = light.intensity;

            // Flicker settings
            if (options.flicker) {
                light.flicker = true;
                light.flickerSpeed = options.flickerSpeed || 5.0;
                light.flickerIntensity = options.flickerIntensity || 0.3;
            }

            light.lifetime = options.lifetime;
            light.active = true;
            light.visible = true;
        }
        return light;
    }

    getLightFromPool() {
        return this.lightPool.find(light => !light.active);
    }

    deactivateLight(light) {
        light.active = false;
        light.visible = false;
        light.flicker = false;
    }

    // Muzzle flash effect
    createMuzzleFlash(position, direction) {
        // Create bright light at muzzle
        const flashLight = this.createLightEffect(position, {
            color: 0xffff88,
            intensity: 2.0,
            distance: 5,
            lifetime: 0.1
        });

        // Create particle burst
        this.createParticleEffect(position, {
            count: 5,
            color: 0xffff88,
            size: 0.01,
            speed: 2,
            lifetime: 0.5
        });

        // Smoke particles
        this.createParticleEffect(position, {
            count: 3,
            color: 0x888888,
            size: 0.02,
            speed: 1,
            lifetime: 1.0
        });
    }

    // Impact effects
    createImpactEffect(position, normal) {
        // Spark particles
        this.createParticleEffect(position, {
            count: 8,
            color: 0xffaa00,
            size: 0.005,
            speed: 3,
            lifetime: 0.3
        });

        // Debris particles
        this.createParticleEffect(position, {
            count: 5,
            color: 0x666666,
            size: 0.01,
            speed: 2,
            lifetime: 0.8
        });
    }

    // Blood effects
    createBloodEffect(position, direction) {
        this.createParticleEffect(position, {
            count: 15,
            color: 0x880000,
            size: 0.005,
            speed: 4,
            lifetime: 1.0
        });
    }

    // Signal interference effects
    setSignalInterference(intensity, frequency = 1.0) {
        this.signalInterference.intensity = Math.max(0, Math.min(1, intensity));
        this.signalInterference.frequency = frequency;
    }

    // Hallucination effects
    activateHallucinations(intensity = 0.5) {
        if (!this.hallucinations.active) {
            this.hallucinations.active = true;
            this.hallucinations.intensity = intensity;

            // Create fake enemies
            for (let i = 0; i < 3; i++) {
                this.createFakeEnemy();
            }

            console.log('👁️ Hallucinations activated');
        }
    }

    deactivateHallucinations() {
        if (this.hallucinations.active) {
            this.hallucinations.active = false;

            // Remove fake enemies
            this.hallucinations.fakeEnemies.forEach(fakeEnemy => {
                this.scene.remove(fakeEnemy);
            });
            this.hallucinations.fakeEnemies = [];

            // Reset distorted geometry
            this.hallucinations.distortedGeometry.forEach(geometry => {
                geometry.rotation.set(0, 0, 0);
            });

            console.log('👁️ Hallucinations deactivated');
        }
    }

    createFakeEnemy() {
        // Create a ghostly enemy that appears and disappears
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8);
        const material = new THREE.MeshLambertMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });

        const fakeEnemy = new THREE.Mesh(geometry, material);
        fakeEnemy.position.set(
            (Math.random() - 0.5) * 20,
            1,
            (Math.random() - 0.5) * 20
        );

        this.scene.add(fakeEnemy);
        this.hallucinations.fakeEnemies.push(fakeEnemy);

        // Make it fade in and out
        let fadeDirection = 1;
        const fadeSpeed = 0.5;

        const fadeInterval = setInterval(() => {
            fakeEnemy.material.opacity += fadeDirection * fadeSpeed * 0.016; // Approximate deltaTime

            if (fakeEnemy.material.opacity >= 0.6) {
                fadeDirection = -1;
            } else if (fakeEnemy.material.opacity <= 0.1) {
                fadeDirection = 1;
            }
        }, 16);

        // Remove after some time
        setTimeout(() => {
            clearInterval(fadeInterval);
            this.scene.remove(fakeEnemy);
            const index = this.hallucinations.fakeEnemies.indexOf(fakeEnemy);
            if (index > -1) {
                this.hallucinations.fakeEnemies.splice(index, 1);
            }
        }, 10000); // 10 seconds
    }

    // Environmental effects
    createDistortionEffect(object) {
        if (!this.hallucinations.distortedGeometry.includes(object)) {
            this.hallucinations.distortedGeometry.push(object);
        }
    }

    removeDistortionEffect(object) {
        const index = this.hallucinations.distortedGeometry.indexOf(object);
        if (index > -1) {
            this.hallucinations.distortedGeometry.splice(index, 1);
            object.rotation.set(0, 0, 0);
        }
    }

    // Screen shake effect
    triggerScreenShake(intensity = 0.5, duration = 0.2) {
        const originalPosition = this.camera.position.clone();
        let shakeTime = 0;

        const shake = () => {
            shakeTime += 0.016;

            if (shakeTime < duration) {
                const shakeOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * intensity,
                    (Math.random() - 0.5) * intensity,
                    (Math.random() - 0.5) * intensity
                );

                this.camera.position.copy(originalPosition).add(shakeOffset);
                requestAnimationFrame(shake);
            } else {
                this.camera.position.copy(originalPosition);
            }
        };

        shake();
    }

    // Debug methods
    getDebugInfo() {
        return {
            activeParticles: this.particles.filter(p => p.active).length,
            activeLights: this.lights.filter(l => l.active).length,
            signalInterference: this.signalInterference.intensity,
            hallucinationsActive: this.hallucinations.active,
            fakeEnemiesCount: this.hallucinations.fakeEnemies.length
        };
    }

    toggleDebugMode() {
        // Toggle effect visualization
        console.log('✨ Effect debug mode toggled');
    }

    // Cleanup
    cleanup() {
        // Remove all particles
        this.particlePool.forEach(particle => {
            this.scene.remove(particle);
        });
        this.particles = [];

        // Remove all lights
        this.lightPool.forEach(light => {
            this.scene.remove(light);
        });
        this.lights = [];

        // Remove fake enemies
        this.hallucinations.fakeEnemies.forEach(fakeEnemy => {
            this.scene.remove(fakeEnemy);
        });
        this.hallucinations.fakeEnemies = [];

        // Clean up post-processing
        if (this.postQuad) {
            this.scene.remove(this.postQuad);
        }

        console.log('🧹 Effect Manager cleaned up');
    }
}
