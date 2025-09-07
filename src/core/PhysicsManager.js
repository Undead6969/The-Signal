import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsManager {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.meshes = new Map();
        this.tempVec3 = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();

        // Physics settings
        this.gravity = -30;
        this.timeStep = 1 / 60; // 60 FPS physics
        this.maxSubSteps = 3;
        this.fixedTimeStep = 1 / 60;

        // Collision groups
        this.PLAYER_GROUP = 1;
        this.ENEMY_GROUP = 2;
        this.WORLD_GROUP = 4;
        this.PICKUP_GROUP = 8;
        this.PROJECTILE_GROUP = 16;

        this.init();
    }

    init() {
        console.log('⚛️ Initializing Physics Manager...');

        // Create physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, this.gravity, 0),
            broadphase: new CANNON.SAPBroadphase(),
            allowSleep: true
        });

        // Configure collision detection
        this.world.defaultContactMaterial.friction = 0.3;
        this.world.defaultContactMaterial.restitution = 0.3;

        // Add ground plane
        this.addGroundPlane();

        // Setup collision materials
        this.setupCollisionMaterials();

        console.log('✅ Physics Manager initialized');
    }

    addGroundPlane() {
        const groundShape = new CANNON.Box(new CANNON.Vec3(500, 0.5, 500));
        const groundBody = new CANNON.Body({
            mass: 0, // Static body
            shape: groundShape,
            material: new CANNON.Material({ friction: 0.8, restitution: 0.1 })
        });

        groundBody.position.set(0, -0.5, 0);
        this.world.addBody(groundBody);
        this.bodies.set('ground', groundBody);
    }

    setupCollisionMaterials() {
        // Player material
        const playerMaterial = new CANNON.Material({ friction: 0.1, restitution: 0.0 });
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            playerMaterial,
            this.world.defaultMaterial,
            { friction: 0.1, restitution: 0.0 }
        ));

        // Enemy material
        const enemyMaterial = new CANNON.Material({ friction: 0.2, restitution: 0.1 });
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            enemyMaterial,
            this.world.defaultMaterial,
            { friction: 0.2, restitution: 0.1 }
        ));

        // Projectile material
        const projectileMaterial = new CANNON.Material({ friction: 0.0, restitution: 0.8 });
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            projectileMaterial,
            this.world.defaultMaterial,
            { friction: 0.0, restitution: 0.8 }
        ));
    }

    update(deltaTime) {
        // Step physics simulation
        this.world.step(this.timeStep, deltaTime, this.maxSubSteps);

        // Sync Three.js meshes with physics bodies
        this.syncMeshes();
    }

    syncMeshes() {
        for (const [id, body] of this.bodies) {
            const mesh = this.meshes.get(id);
            if (mesh && body) {
                // Update mesh position
                mesh.position.copy(body.position);

                // Update mesh rotation
                mesh.quaternion.copy(body.quaternion);
            }
        }
    }

    // Player physics
    addPlayerBody(player) {
        const playerShape = new CANNON.Box(new CANNON.Vec3(0.4, 1.0, 0.4));
        const playerBody = new CANNON.Body({
            mass: 80, // kg
            shape: playerShape,
            material: new CANNON.Material({ friction: 0.1, restitution: 0.0 }),
            collisionFilterGroup: this.PLAYER_GROUP,
            collisionFilterMask: this.WORLD_GROUP | this.ENEMY_GROUP | this.PICKUP_GROUP
        });

        playerBody.position.set(player.position.x, player.position.y, player.position.z);
        playerBody.fixedRotation = true; // Prevent player from tipping over
        playerBody.updateMassProperties();

        this.world.addBody(playerBody);
        this.bodies.set('player', playerBody);

        return playerBody;
    }

    updatePlayer(player, inputManager) {
        const playerBody = this.bodies.get('player');
        if (!playerBody) return;

        // Apply movement forces
        const moveForce = 800; // Force strength
        const maxSpeed = 5.0; // Maximum movement speed

        // Get movement input
        const moveVector = new THREE.Vector3();

        if (inputManager.isHeld('moveForward')) moveVector.z -= 1;
        if (inputManager.isHeld('moveBackward')) moveVector.z += 1;
        if (inputManager.isHeld('moveLeft')) moveVector.x -= 1;
        if (inputManager.isHeld('moveRight')) moveVector.x += 1;

        // Normalize and apply camera rotation
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.applyEuler(new THREE.Euler(0, player.yaw, 0));
            moveVector.multiplyScalar(moveForce);

            // Apply force
            playerBody.applyForce(
                new CANNON.Vec3(moveVector.x, 0, moveVector.z),
                playerBody.position
            );
        }

        // Limit horizontal velocity
        const horizontalVelocity = new CANNON.Vec3(
            playerBody.velocity.x,
            0,
            playerBody.velocity.z
        );

        if (horizontalVelocity.length() > maxSpeed) {
            horizontalVelocity.normalize();
            horizontalVelocity.scale(maxSpeed);
            playerBody.velocity.x = horizontalVelocity.x;
            playerBody.velocity.z = horizontalVelocity.z;
        }

        // Apply friction when not moving
        if (moveVector.length() === 0) {
            playerBody.velocity.x *= 0.8;
            playerBody.velocity.z *= 0.8;
        }

        // Handle jumping
        if (inputManager.isPressed('jump') && this.isPlayerGrounded()) {
            playerBody.applyImpulse(
                new CANNON.Vec3(0, 300, 0),
                playerBody.position
            );
        }

        // Update player position
        player.position.set(
            playerBody.position.x,
            playerBody.position.y,
            playerBody.position.z
        );
    }

    isPlayerGrounded() {
        const playerBody = this.bodies.get('player');
        if (!playerBody) return false;

        // Simple ground check - check if player is near ground level
        return playerBody.position.y <= 2.1 && playerBody.velocity.y <= 0.1;
    }

    // Enemy physics
    addEnemyBody(enemy) {
        const enemyShape = new CANNON.Cylinder(0.4, 0.4, 1.8);
        const enemyBody = new CANNON.Body({
            mass: 70,
            shape: enemyShape,
            material: new CANNON.Material({ friction: 0.2, restitution: 0.1 }),
            collisionFilterGroup: this.ENEMY_GROUP,
            collisionFilterMask: this.WORLD_GROUP | this.PLAYER_GROUP | this.PROJECTILE_GROUP
        });

        enemyBody.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        enemyBody.fixedRotation = true;

        this.world.addBody(enemyBody);
        this.bodies.set(`enemy_${enemy.id}`, enemyBody);

        return enemyBody;
    }

    updateEnemy(enemy, deltaTime) {
        const enemyBody = this.bodies.get(`enemy_${enemy.id}`);
        if (!enemyBody) return;

        // Apply enemy movement
        if (enemy.velocity.length() > 0) {
            const force = enemy.velocity.clone().multiplyScalar(400);
            enemyBody.applyForce(
                new CANNON.Vec3(force.x, 0, force.z),
                enemyBody.position
            );
        }

        // Apply friction
        enemyBody.velocity.x *= 0.9;
        enemyBody.velocity.z *= 0.9;

        // Sync position back to enemy
        enemy.position.set(
            enemyBody.position.x,
            enemyBody.position.y,
            enemyBody.position.z
        );
    }

    // Projectile physics
    addProjectile(position, direction, speed = 50, damage = 25) {
        const projectileShape = new CANNON.Sphere(0.05);
        const projectileBody = new CANNON.Body({
            mass: 0.1,
            shape: projectileShape,
            material: new CANNON.Material({ friction: 0.0, restitution: 0.8 }),
            collisionFilterGroup: this.PROJECTILE_GROUP,
            collisionFilterMask: this.WORLD_GROUP | this.ENEMY_GROUP
        });

        projectileBody.position.set(position.x, position.y, position.z);
        projectileBody.velocity.set(
            direction.x * speed,
            direction.y * speed,
            direction.z * speed
        );

        // Add lifetime to projectile
        projectileBody.userData = {
            lifetime: 5.0, // seconds
            damage: damage,
            isProjectile: true
        };

        this.world.addBody(projectileBody);
        this.bodies.set(`projectile_${Date.now()}`, projectileBody);

        return projectileBody;
    }

    updateProjectiles(deltaTime) {
        const projectilesToRemove = [];

        for (const [id, body] of this.bodies) {
            if (id.startsWith('projectile_') && body.userData.isProjectile) {
                // Update lifetime
                body.userData.lifetime -= deltaTime;

                // Remove if lifetime expired
                if (body.userData.lifetime <= 0) {
                    projectilesToRemove.push(id);
                }
            }
        }

        // Remove expired projectiles
        projectilesToRemove.forEach(id => {
            const body = this.bodies.get(id);
            if (body) {
                this.world.removeBody(body);
                this.bodies.delete(id);
            }
        });
    }

    // World geometry
    addStaticBody(mesh, shape) {
        if (!shape) {
            // Auto-generate shape from mesh geometry
            shape = this.createShapeFromMesh(mesh);
        }

        const body = new CANNON.Body({
            mass: 0, // Static
            shape: shape,
            collisionFilterGroup: this.WORLD_GROUP,
            collisionFilterMask: this.PLAYER_GROUP | this.ENEMY_GROUP | this.PROJECTILE_GROUP
        });

        // Copy position and rotation from mesh
        body.position.copy(mesh.position);
        body.quaternion.copy(mesh.quaternion);

        this.world.addBody(body);
        this.bodies.set(`static_${Date.now()}`, body);
        this.meshes.set(`static_${Date.now()}`, mesh);

        return body;
    }

    createShapeFromMesh(mesh) {
        // Simple box shape for now
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = bbox.getSize(new THREE.Vector3());
        const shape = new CANNON.Box(new CANNON.Vec3(
            size.x / 2,
            size.y / 2,
            size.z / 2
        ));

        return shape;
    }

    // Pickup items
    addPickupBody(mesh, pickupType) {
        const shape = new CANNON.Sphere(0.2);
        const body = new CANNON.Body({
            mass: 0, // Static pickup
            shape: shape,
            collisionFilterGroup: this.PICKUP_GROUP,
            collisionFilterMask: this.PLAYER_GROUP,
            isTrigger: true // Doesn't affect physics, only triggers events
        });

        body.position.copy(mesh.position);
        body.userData = {
            pickupType: pickupType,
            collected: false
        };

        this.world.addBody(body);
        this.bodies.set(`pickup_${Date.now()}`, body);
        this.meshes.set(`pickup_${Date.now()}`, mesh);

        return body;
    }

    // Raycasting
    raycast(from, to, options = {}) {
        const rayOptions = {
            from: new CANNON.Vec3(from.x, from.y, from.z),
            to: new CANNON.Vec3(to.x, to.y, to.z),
            skipBackfaces: true,
            collisionFilterMask: options.collisionMask || -1,
            ...options
        };

        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(rayOptions.from, rayOptions.to, rayOptions, result);

        return result;
    }

    // Collision detection
    checkCollisions() {
        const collisions = [];

        for (const [id, body] of this.bodies) {
            if (body.userData && body.userData.isProjectile) {
                // Check projectile collisions
                const collisions = this.world.contacts.filter(contact =>
                    contact.bi === body || contact.bj === body
                );

                collisions.forEach(collision => {
                    const otherBody = collision.bi === body ? collision.bj : collision.bi;
                    this.handleProjectileCollision(body, otherBody);
                });
            }
        }

        return collisions;
    }

    handleProjectileCollision(projectile, target) {
        // Remove projectile
        this.world.removeBody(projectile);
        this.bodies.delete(Array.from(this.bodies.entries()).find(([id, body]) => body === projectile)?.[0]);

        // Apply damage if target is enemy
        if (target.userData && target.userData.isEnemy) {
            const damage = projectile.userData.damage;
            // Emit damage event
            this.emit('projectileHit', {
                target: target.userData.enemyId,
                damage: damage,
                position: projectile.position
            });
        }
    }

    // Event system
    emit(eventType, data) {
        const event = new CustomEvent('physicsEvent', {
            detail: { type: eventType, data }
        });
        document.dispatchEvent(event);
    }

    on(eventType, callback) {
        document.addEventListener('physicsEvent', (event) => {
            if (event.detail.type === eventType) {
                callback(event.detail.data);
            }
        });
    }

    // Debug methods
    getDebugInfo() {
        return {
            bodiesCount: this.bodies.size,
            meshesCount: this.meshes.size,
            gravity: this.gravity,
            timeStep: this.timeStep,
            contactsCount: this.world.contacts.length
        };
    }

    toggleDebugMode() {
        // Toggle physics debug visualization
        console.log('⚛️ Physics debug mode toggled');
    }

    // Cleanup
    removeBody(id) {
        const body = this.bodies.get(id);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(id);
        }

        const mesh = this.meshes.get(id);
        if (mesh) {
            this.meshes.delete(id);
        }
    }

    cleanup() {
        // Remove all bodies
        for (const [id, body] of this.bodies) {
            this.world.removeBody(body);
        }

        this.bodies.clear();
        this.meshes.clear();

        console.log('🧹 Physics Manager cleaned up');
    }
}
