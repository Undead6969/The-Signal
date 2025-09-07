import * as THREE from 'three';

export class EnemyManager {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;

        // Enemy collections
        this.enemies = [];
        this.activeEnemies = [];
        this.inactiveEnemies = [];

        // Enemy types
        this.enemyTypes = {
            infected_scientist: {
                name: 'Infected Scientist',
                health: 80,
                speed: 3.0,
                detectionRange: 15,
                attackRange: 2,
                attackDamage: 15,
                model: 'scientist',
                sounds: {
                    idle: 'scientist_idle',
                    alert: 'scientist_alert',
                    attack: 'scientist_attack',
                    death: 'scientist_death'
                }
            },
            corrupted_soldier: {
                name: 'Corrupted Soldier',
                health: 120,
                speed: 4.0,
                detectionRange: 20,
                attackRange: 3,
                attackDamage: 25,
                model: 'soldier',
                sounds: {
                    idle: 'soldier_idle',
                    alert: 'soldier_alert',
                    attack: 'soldier_attack',
                    death: 'soldier_death'
                }
            },
            signal_entity: {
                name: 'Signal Entity',
                health: 60,
                speed: 2.5,
                detectionRange: 25,
                attackRange: 1.5,
                attackDamage: 20,
                model: 'entity',
                sounds: {
                    idle: 'entity_idle',
                    alert: 'entity_alert',
                    attack: 'entity_attack',
                    death: 'entity_death'
                }
            }
        };

        // AI behavior settings
        this.patrolRadius = 10;
        this.chaseDistance = 25;
        this.loseInterestDistance = 35;
        this.attackCooldown = 1.5;
        this.lastSoundTime = 0;
        this.soundMemoryDuration = 5.0; // How long enemies remember sounds

        // Sound-based AI
        this.soundEvents = [];
        this.soundPropagationSpeed = 20; // Units per second

        // Performance optimization
        this.maxActiveEnemies = 10;
        this.spawnDistance = 30;
        this.despawnDistance = 50;

        // Spawn points
        this.spawnPoints = [];

        this.init();
    }

    init() {
        console.log('👾 Initializing Enemy Manager...');

        // Generate spawn points
        this.generateSpawnPoints();

        // Create initial enemy pool
        this.createEnemyPool(15);

        console.log('✅ Enemy Manager initialized');
    }

    generateSpawnPoints() {
        // Generate spawn points throughout the facility
        const facilitySize = 100;
        const numSpawnPoints = 20;

        for (let i = 0; i < numSpawnPoints; i++) {
            const angle = (i / numSpawnPoints) * Math.PI * 2;
            const radius = 10 + Math.random() * 30;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            this.spawnPoints.push({
                position: new THREE.Vector3(x, 1, z),
                type: this.getRandomEnemyType(),
                patrolCenter: new THREE.Vector3(x, 1, z)
            });
        }
    }

    getRandomEnemyType() {
        const types = Object.keys(this.enemyTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    createEnemyPool(poolSize) {
        for (let i = 0; i < poolSize; i++) {
            const enemy = this.createEnemy(this.getRandomEnemyType());
            this.inactiveEnemies.push(enemy);
        }
    }

    createEnemy(typeName) {
        const type = this.enemyTypes[typeName];
        if (!type) return null;

        const enemy = {
            id: THREE.MathUtils.generateUUID(),
            type: typeName,
            config: type,

            // State
            health: type.health,
            maxHealth: type.health,
            isAlive: true,
            isActive: false,
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            velocity: new THREE.Vector3(),

            // AI
            state: 'idle', // idle, patrol, investigate, chase, attack, flee
            stateTimer: 0,
            lastStateChange: 0,

            // Navigation
            patrolCenter: new THREE.Vector3(),
            patrolRadius: this.patrolRadius,
            currentTarget: null,
            path: [],
            waypointIndex: 0,

            // Combat
            lastAttackTime: 0,
            attackCooldown: this.attackCooldown,

            // Detection
            detectionLevel: 0, // 0-1, how aware the enemy is of the player
            lastPlayerSighting: 0,
            investigationPoint: null,

            // Sound memory
            rememberedSounds: [],

            // Visual representation
            mesh: null,
            model: null,
            healthBar: null,

            // Audio
            currentSound: null,

            // Methods
            update: (deltaTime) => this.updateEnemy(enemy, deltaTime),
            takeDamage: (amount) => this.enemyTakeDamage(enemy, amount),
            die: () => this.enemyDie(enemy),
            playSound: (soundType) => this.playEnemySound(enemy, soundType),
            canSeePlayer: () => this.canEnemySeePlayer(enemy),
            canHearPlayer: () => this.canEnemyHearPlayer(enemy)
        };

        // Create visual representation
        this.createEnemyMesh(enemy);

        return enemy;
    }

    createEnemyMesh(enemy) {
        const type = enemy.config;

        // Create simple geometric representation
        let geometry, material;

        switch (type.model) {
            case 'scientist':
                geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                break;
            case 'soldier':
                geometry = new THREE.BoxGeometry(0.6, 1.8, 0.4);
                material = new THREE.MeshLambertMaterial({ color: 0x444444 });
                break;
            case 'entity':
                geometry = new THREE.SphereGeometry(0.5);
                material = new THREE.MeshLambertMaterial({
                    color: 0x880000,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            default:
                geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8);
                material = new THREE.MeshLambertMaterial({ color: 0x880000 });
        }

        enemy.mesh = new THREE.Mesh(geometry, material);
        enemy.mesh.position.copy(enemy.position);
        enemy.mesh.castShadow = true;
        enemy.mesh.receiveShadow = true;

        // Add to physics world
        if (this.physicsManager) {
            this.physicsManager.addEnemyBody(enemy);
        }

        // Create health bar (only visible when damaged)
        enemy.healthBar = this.createHealthBar();
    }

    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 8;
        const context = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.25, 1);
        sprite.visible = false;

        return sprite;
    }

    updateHealthBar(enemy) {
        if (!enemy.healthBar) return;

        const canvas = enemy.healthBar.material.map.image;
        const context = canvas.getContext('2d');

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        context.fillStyle = '#333333';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        context.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        context.fillRect(1, 1, (canvas.width - 2) * healthPercent, canvas.height - 2);

        enemy.healthBar.material.map.needsUpdate = true;

        // Position above enemy
        enemy.healthBar.position.copy(enemy.position);
        enemy.healthBar.position.y += 2.5;
    }

    spawnEnemy(spawnPoint) {
        if (this.inactiveEnemies.length === 0) return null;

        const enemy = this.inactiveEnemies.pop();
        enemy.position.copy(spawnPoint.position);
        enemy.patrolCenter.copy(spawnPoint.patrolCenter);
        enemy.state = 'patrol';
        enemy.isActive = true;
        enemy.health = enemy.config.health;
        enemy.detectionLevel = 0;

        // Add to scene
        this.scene.add(enemy.mesh);
        if (enemy.healthBar) {
            this.scene.add(enemy.healthBar);
        }

        this.activeEnemies.push(enemy);

        console.log(`👾 Spawned ${enemy.config.name} at (${enemy.position.x.toFixed(1)}, ${enemy.position.z.toFixed(1)})`);

        return enemy;
    }

    despawnEnemy(enemy) {
        if (!enemy.isActive) return;

        enemy.isActive = false;
        enemy.state = 'idle';

        // Remove from scene
        this.scene.remove(enemy.mesh);
        if (enemy.healthBar) {
            this.scene.remove(enemy.healthBar);
        }

        // Move to inactive pool
        const activeIndex = this.activeEnemies.indexOf(enemy);
        if (activeIndex > -1) {
            this.activeEnemies.splice(activeIndex, 1);
        }

        this.inactiveEnemies.push(enemy);

        console.log(`💨 Despawned ${enemy.config.name}`);
    }

    update(deltaTime, player) {
        // Update sound events
        this.updateSoundEvents(deltaTime);

        // Update active enemies
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];
            this.updateEnemy(enemy, deltaTime, player);

            // Check despawn distance
            const distanceToPlayer = enemy.position.distanceTo(player.position);
            if (distanceToPlayer > this.despawnDistance) {
                this.despawnEnemy(enemy);
            }
        }

        // Spawn new enemies if needed
        this.updateSpawning(player);
    }

    updateEnemy(enemy, deltaTime, player) {
        if (!enemy.isAlive || !enemy.isActive) return;

        enemy.stateTimer += deltaTime;

        // Update AI state
        this.updateAIState(enemy, player);

        // Execute current state behavior
        this.executeStateBehavior(enemy, deltaTime, player);

        // Update visual representation
        enemy.mesh.position.copy(enemy.position);
        enemy.mesh.rotation.y = enemy.rotation.y;

        // Update health bar if visible
        if (enemy.healthBar && enemy.healthBar.visible) {
            this.updateHealthBar(enemy);
        }

        // Update physics
        if (this.physicsManager) {
            this.physicsManager.updateEnemy(enemy, deltaTime);
        }
    }

    updateAIState(enemy, player) {
        const distanceToPlayer = enemy.position.distanceTo(player.position);
        const canSeePlayer = this.canEnemySeePlayer(enemy, player);
        const canHearPlayer = this.canEnemyHearPlayer(enemy, player);

        // State transitions
        switch (enemy.state) {
            case 'idle':
                if (canSeePlayer || canHearPlayer) {
                    enemy.state = 'investigate';
                    enemy.investigationPoint = player.position.clone();
                    enemy.playSound('alert');
                } else if (Math.random() < 0.01) { // Random patrol chance
                    enemy.state = 'patrol';
                }
                break;

            case 'patrol':
                if (canSeePlayer) {
                    enemy.state = 'chase';
                    enemy.playSound('alert');
                } else if (canHearPlayer) {
                    enemy.state = 'investigate';
                    enemy.investigationPoint = player.position.clone();
                } else if (enemy.stateTimer > 10) { // Return to idle after patrol
                    enemy.state = 'idle';
                    enemy.stateTimer = 0;
                }
                break;

            case 'investigate':
                if (canSeePlayer) {
                    enemy.state = 'chase';
                } else if (distanceToPlayer < enemy.config.attackRange) {
                    enemy.state = 'attack';
                } else if (enemy.stateTimer > 5) { // Give up investigation
                    enemy.state = 'patrol';
                    enemy.stateTimer = 0;
                }
                break;

            case 'chase':
                if (!canSeePlayer && !canHearPlayer && distanceToPlayer > this.loseInterestDistance) {
                    enemy.state = 'investigate';
                    enemy.investigationPoint = player.position.clone();
                } else if (distanceToPlayer < enemy.config.attackRange) {
                    enemy.state = 'attack';
                }
                break;

            case 'attack':
                if (distanceToPlayer > enemy.config.attackRange * 1.5) {
                    enemy.state = 'chase';
                } else if (enemy.stateTimer - enemy.lastAttackTime > enemy.attackCooldown) {
                    this.performAttack(enemy, player);
                    enemy.lastAttackTime = enemy.stateTimer;
                }
                break;
        }

        enemy.lastStateChange = enemy.stateTimer;
    }

    executeStateBehavior(enemy, deltaTime, player) {
        switch (enemy.state) {
            case 'idle':
                // Stand still, maybe look around
                enemy.velocity.set(0, 0, 0);
                break;

            case 'patrol':
                this.patrolBehavior(enemy, deltaTime);
                break;

            case 'investigate':
                this.investigateBehavior(enemy, deltaTime);
                break;

            case 'chase':
                this.chaseBehavior(enemy, deltaTime, player);
                break;

            case 'attack':
                this.attackBehavior(enemy, deltaTime, player);
                break;
        }

        // Apply movement
        this.applyMovement(enemy, deltaTime);
    }

    patrolBehavior(enemy, deltaTime) {
        // Simple patrol around center point
        if (!enemy.currentTarget || enemy.position.distanceTo(enemy.currentTarget) < 1) {
            // Choose new patrol point
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * enemy.patrolRadius;
            enemy.currentTarget = enemy.patrolCenter.clone().add(
                new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance)
            );
        }

        // Move towards target
        this.moveTowards(enemy, enemy.currentTarget, enemy.config.speed * 0.5);
    }

    investigateBehavior(enemy, deltaTime) {
        if (enemy.investigationPoint) {
            this.moveTowards(enemy, enemy.investigationPoint, enemy.config.speed * 0.7);

            // Look around while investigating
            enemy.rotation.y += deltaTime * 2;
        }
    }

    chaseBehavior(enemy, deltaTime, player) {
        this.moveTowards(enemy, player.position, enemy.config.speed);
    }

    attackBehavior(enemy, deltaTime, player) {
        // Face player
        const direction = player.position.clone().sub(enemy.position).normalize();
        enemy.rotation.y = Math.atan2(direction.x, direction.z);

        // Stop moving
        enemy.velocity.set(0, 0, 0);
    }

    moveTowards(enemy, target, speed) {
        const direction = target.clone().sub(enemy.position).normalize();
        enemy.velocity.copy(direction.multiplyScalar(speed));

        // Face movement direction
        enemy.rotation.y = Math.atan2(direction.x, direction.z);
    }

    applyMovement(enemy, deltaTime) {
        // Apply velocity to position
        enemy.position.add(enemy.velocity.clone().multiplyScalar(deltaTime));

        // Clamp to ground
        enemy.position.y = 1;

        // Simple collision avoidance
        this.avoidObstacles(enemy);
    }

    avoidObstacles(enemy) {
        // Simple obstacle avoidance (would be more sophisticated with proper navigation mesh)
        const avoidanceDistance = 2;

        // Check distance to walls/doors (simplified)
        // In a full implementation, this would use raycasting or navigation mesh
    }

    canEnemySeePlayer(enemy, player) {
        const distance = enemy.position.distanceTo(player.position);

        if (distance > enemy.config.detectionRange) return false;

        // Check line of sight (simplified)
        const direction = player.position.clone().sub(enemy.position).normalize();
        const dotProduct = direction.dot(new THREE.Vector3(
            Math.sin(enemy.rotation.y),
            0,
            Math.cos(enemy.rotation.y)
        ));

        // Field of view check (120 degrees)
        return dotProduct > 0.5;
    }

    canEnemyHearPlayer(enemy, player) {
        // Check for recent sound events
        const recentSounds = this.soundEvents.filter(sound =>
            performance.now() - sound.timestamp < this.soundMemoryDuration * 1000 &&
            sound.position.distanceTo(enemy.position) < enemy.config.detectionRange
        );

        return recentSounds.length > 0;
    }

    performAttack(enemy, player) {
        // Deal damage to player
        const damage = enemy.config.attackDamage;
        player.takeDamage(damage);

        // Play attack sound
        enemy.playSound('attack');

        console.log(`👾 ${enemy.config.name} attacks player for ${damage} damage`);
    }

    enemyTakeDamage(enemy, amount) {
        enemy.health -= amount;

        // Show health bar
        if (enemy.healthBar) {
            enemy.healthBar.visible = true;
        }

        // Play damage sound
        enemy.playSound('damage');

        if (enemy.health <= 0) {
            enemy.die();
        } else {
            // Enter pain state briefly
            enemy.state = 'investigate'; // Could be expanded to a dedicated pain state
        }

        console.log(`👾 ${enemy.config.name} takes ${amount} damage (${enemy.health}/${enemy.maxHealth})`);
    }

    enemyDie(enemy) {
        enemy.isAlive = false;

        // Play death sound
        enemy.playSound('death');

        // Remove after delay
        setTimeout(() => {
            this.despawnEnemy(enemy);
        }, 2000);

        console.log(`💀 ${enemy.config.name} died`);
    }

    playEnemySound(enemy, soundType) {
        // Play appropriate sound based on enemy type and action
        const soundName = enemy.config.sounds[soundType];
        if (soundName) {
            // Play sound at enemy position
            this.emit('playSound', {
                sound: soundName,
                position: enemy.position.clone(),
                volume: 0.8
            });
        }
    }

    // Sound-based AI
    registerSoundEvent(position, volume = 1.0, type = 'unknown') {
        this.soundEvents.push({
            position: position.clone(),
            volume,
            type,
            timestamp: performance.now()
        });

        // Limit sound memory
        if (this.soundEvents.length > 10) {
            this.soundEvents.shift();
        }

        // Alert nearby enemies
        this.alertNearbyEnemies(position, volume * 20); // Convert volume to range
    }

    alertNearbyEnemies(position, range) {
        this.activeEnemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(position);
            if (distance < range) {
                enemy.detectionLevel = Math.min(1, enemy.detectionLevel + (range - distance) / range * 0.5);
                if (enemy.state === 'idle') {
                    enemy.state = 'investigate';
                    enemy.investigationPoint = position.clone();
                }
            }
        });
    }

    updateSoundEvents(deltaTime) {
        // Remove old sound events
        const currentTime = performance.now();
        this.soundEvents = this.soundEvents.filter(sound =>
            currentTime - sound.timestamp < this.soundMemoryDuration * 1000
        );
    }

    updateSpawning(player) {
        // Spawn enemies near player if below maximum
        if (this.activeEnemies.length >= this.maxActiveEnemies) return;

        // Find nearby spawn points
        const nearbySpawnPoints = this.spawnPoints.filter(spawnPoint =>
            spawnPoint.position.distanceTo(player.position) < this.spawnDistance &&
            spawnPoint.position.distanceTo(player.position) > 10 // Don't spawn too close
        );

        if (nearbySpawnPoints.length > 0) {
            const spawnPoint = nearbySpawnPoints[Math.floor(Math.random() * nearbySpawnPoints.length)];
            this.spawnEnemy(spawnPoint);
        }
    }

    // Event system
    emit(eventType, data) {
        const event = new CustomEvent('enemyEvent', {
            detail: { type: eventType, data }
        });
        document.dispatchEvent(event);
    }

    // Utility methods
    getEnemiesInRange(position, range) {
        return this.activeEnemies.filter(enemy =>
            enemy.position.distanceTo(position) < range
        );
    }

    getNearestEnemy(position) {
        let nearest = null;
        let nearestDistance = Infinity;

        this.activeEnemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(position);
            if (distance < nearestDistance) {
                nearest = enemy;
                nearestDistance = distance;
            }
        });

        return nearest;
    }

    // Save/Load
    getSaveData() {
        return {
            activeEnemies: this.activeEnemies.map(enemy => ({
                id: enemy.id,
                type: enemy.type,
                position: enemy.position.toArray(),
                health: enemy.health,
                state: enemy.state
            })),
            enemiesKilled: this.getEnemiesKilled()
        };
    }

    loadSaveData(saveData) {
        // Clear current enemies
        this.activeEnemies.forEach(enemy => this.despawnEnemy(enemy));

        // Restore enemies
        saveData.activeEnemies.forEach(enemyData => {
            const enemy = this.createEnemy(enemyData.type);
            if (enemy) {
                enemy.position.fromArray(enemyData.position);
                enemy.health = enemyData.health;
                enemy.state = enemyData.state;
                this.spawnEnemy({ position: enemy.position, type: enemy.type });
            }
        });
    }

    // Stats
    getEnemiesKilled() {
        // Would track this in a real implementation
        return 0;
    }

    getEnemyCount() {
        return this.activeEnemies.length;
    }

    // Debug methods
    getDebugInfo() {
        return {
            activeEnemies: this.activeEnemies.length,
            inactiveEnemies: this.inactiveEnemies.length,
            totalEnemies: this.enemies.length,
            spawnPoints: this.spawnPoints.length,
            soundEvents: this.soundEvents.length
        };
    }

    spawnDebugEnemy(position) {
        const spawnPoint = {
            position: position || new THREE.Vector3(0, 1, 0),
            type: 'infected_scientist'
        };
        return this.spawnEnemy(spawnPoint);
    }

    killAllEnemies() {
        this.activeEnemies.forEach(enemy => {
            enemy.health = 0;
            enemy.die();
        });
    }

    // Reset for new game
    reset() {
        console.log('🔄 Resetting Enemy Manager...');

        // Remove all active enemies
        this.activeEnemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
            if (enemy.healthBar) {
                this.scene.remove(enemy.healthBar);
            }
        });

        // Clear all collections
        this.activeEnemies = [];
        this.inactiveEnemies = [];
        this.enemies = [];

        // Clear sound events
        this.soundEvents = [];

        // Recreate enemy pool
        this.createEnemyPool(15);

        console.log('✅ Enemy Manager reset');
    }

    // Cleanup
    cleanup() {
        // Remove all enemies from scene
        this.activeEnemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
            if (enemy.healthBar) {
                this.scene.remove(enemy.healthBar);
            }
        });

        this.activeEnemies = [];
        this.inactiveEnemies = [];
        this.enemies = [];

        console.log('🧹 Enemy Manager cleaned up');
    }
}
