import * as THREE from 'three';

export class WorldManager {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;

        // World state
        this.rooms = [];
        this.doors = [];
        this.interactiveObjects = [];
        this.lights = [];
        this.areasExplored = 0;

        // Environment settings
        this.roomSize = 20;
        this.corridorWidth = 4;
        this.wallHeight = 3;
        this.floorThickness = 0.2;

        // Materials
        this.materials = {
            wall: null,
            floor: null,
            ceiling: null,
            door: null,
            metal: null,
            glass: null
        };

        // Textures
        this.textures = config.textures || {};

        this.init();
    }

    async init() {
        console.log('🏗️ Initializing World Manager...');

        // Create materials
        this.createMaterials();

        // Generate initial facility layout
        await this.generateFacility();

        console.log('✅ World Manager initialized');
    }

    createMaterials() {
        // Wall material
        this.materials.wall = new THREE.MeshLambertMaterial({
            color: 0x666666,
            map: this.textures.concrete || null
        });

        // Floor material
        this.materials.floor = new THREE.MeshLambertMaterial({
            color: 0x333333,
            map: this.textures.concrete || null
        });

        // Ceiling material
        this.materials.ceiling = new THREE.MeshLambertMaterial({
            color: 0x444444
        });

        // Door material
        this.materials.door = new THREE.MeshLambertMaterial({
            color: 0x444444
        });

        // Metal material
        this.materials.metal = new THREE.MeshLambertMaterial({
            color: 0x888888,
            map: this.textures.metal || null
        });

        // Glass material
        this.materials.glass = new THREE.MeshLambertMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        // Set texture repeats
        Object.values(this.textures).forEach(texture => {
            if (texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
            }
        });
    }

    async generateFacility() {
        console.log('🏗️ Generating Arctic Research Facility...');

        // Clear existing world
        this.clearWorld();

        // Generate main facility layout
        await this.generateMainFacility();

        // Add environmental details
        this.addEnvironmentalDetails();

        // Add interactive objects
        this.addInteractiveObjects();

        // Add lighting
        this.setupFacilityLighting();

        console.log('✅ Facility generated');
    }

    async generateMainFacility() {
        // Create central hub
        this.createRoom(0, 0, this.roomSize * 2, this.roomSize * 2, 'Central Hub');

        // Create main corridors
        this.createCorridor(0, this.roomSize, this.roomSize * 4, this.corridorWidth, 'North Corridor');
        this.createCorridor(0, -this.roomSize, this.roomSize * 4, this.corridorWidth, 'South Corridor');
        this.createCorridor(this.roomSize, 0, this.corridorWidth, this.roomSize * 4, 'East Corridor');
        this.createCorridor(-this.roomSize, 0, this.corridorWidth, this.roomSize * 4, 'West Corridor');

        // Create key rooms
        this.createRoom(this.roomSize * 2, 0, this.roomSize, this.roomSize, 'Communications Tower');
        this.createRoom(-this.roomSize * 2, 0, this.roomSize, this.roomSize, 'Research Lab');
        this.createRoom(0, this.roomSize * 2, this.roomSize, this.roomSize, 'Living Quarters');
        this.createRoom(0, -this.roomSize * 2, this.roomSize, this.roomSize, 'Storage Facility');

        // Create underground test chamber
        this.createRoom(0, 0, this.roomSize, this.roomSize, 'Test Chamber', -this.wallHeight);

        // Create frozen exterior areas
        this.createExteriorArea();

        // Add doors between rooms
        this.addDoors();
    }

    createRoom(x, z, width, depth, name, y = 0) {
        const room = {
            name,
            bounds: new THREE.Box3(
                new THREE.Vector3(x - width/2, y, z - depth/2),
                new THREE.Vector3(x + width/2, y + this.wallHeight, z + depth/2)
            ),
            objects: [],
            explored: false
        };

        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(width, depth);
        const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, y, z);
        floor.receiveShadow = true;
        this.scene.add(floor);
        room.objects.push(floor);

        // Create ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
        const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(x, y + this.wallHeight, z);
        this.scene.add(ceiling);
        room.objects.push(ceiling);

        // Create walls
        this.createWalls(x, z, width, depth, y);

        this.rooms.push(room);
        return room;
    }

    createWalls(centerX, centerZ, width, depth, y) {
        const wallThickness = 0.2;
        const wallHeight = this.wallHeight;

        // North wall
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(width + wallThickness * 2, wallHeight, wallThickness),
            this.materials.wall
        );
        northWall.position.set(centerX, y + wallHeight/2, centerZ - depth/2 - wallThickness/2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);

        // South wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(width + wallThickness * 2, wallHeight, wallThickness),
            this.materials.wall
        );
        southWall.position.set(centerX, y + wallHeight/2, centerZ + depth/2 + wallThickness/2);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.scene.add(southWall);

        // East wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, depth),
            this.materials.wall
        );
        eastWall.position.set(centerX + width/2 + wallThickness/2, y + wallHeight/2, centerZ);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);

        // West wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, depth),
            this.materials.wall
        );
        westWall.position.set(centerX - width/2 - wallThickness/2, y + wallHeight/2, centerZ);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.scene.add(westWall);
    }

    createCorridor(centerX, centerZ, length, width, name) {
        // Create corridor as a long, narrow room
        return this.createRoom(centerX, centerZ, length, width, name);
    }

    createExteriorArea() {
        // Create frozen exterior with snow and ice
        const exteriorSize = this.roomSize * 6;
        const exteriorGeometry = new THREE.PlaneGeometry(exteriorSize, exteriorSize);
        const exteriorMaterial = new THREE.MeshLambertMaterial({
            color: 0xe6f3ff,
            map: this.textures.snow || null
        });

        const exterior = new THREE.Mesh(exteriorGeometry, exteriorMaterial);
        exterior.rotation.x = -Math.PI / 2;
        exterior.position.set(0, -0.1, 0);
        exterior.receiveShadow = true;
        this.scene.add(exterior);

        // Add some scattered debris and equipment
        this.addExteriorDetails();
    }

    addDoors() {
        // Add doors between key areas
        const doorPositions = [
            { x: this.roomSize, z: 0, rotation: 0 }, // Central hub to east corridor
            { x: -this.roomSize, z: 0, rotation: 0 }, // Central hub to west corridor
            { x: 0, z: this.roomSize, rotation: Math.PI / 2 }, // Central hub to north corridor
            { x: 0, z: -this.roomSize, rotation: Math.PI / 2 }, // Central hub to south corridor
            { x: this.roomSize * 2.5, z: 0, rotation: 0 }, // East corridor to communications
            { x: -this.roomSize * 2.5, z: 0, rotation: 0 }, // West corridor to research lab
            { x: 0, z: this.roomSize * 2.5, rotation: Math.PI / 2 }, // North corridor to living quarters
            { x: 0, z: -this.roomSize * 2.5, rotation: Math.PI / 2 } // South corridor to storage
        ];

        doorPositions.forEach((pos, index) => {
            this.createDoor(pos.x, pos.z, pos.rotation, `Door ${index + 1}`);
        });
    }

    createDoor(x, z, rotation, name) {
        const doorWidth = 2;
        const doorHeight = this.wallHeight;
        const doorThickness = 0.1;

        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
        const door = new THREE.Mesh(doorGeometry, this.materials.door);

        door.position.set(x, doorHeight / 2, z);
        door.rotation.y = rotation;
        door.castShadow = true;
        door.receiveShadow = true;

        // Add door frame
        const frameGeometry = new THREE.BoxGeometry(doorWidth + 0.4, doorHeight + 0.4, doorThickness + 0.2);
        const frame = new THREE.Mesh(frameGeometry, this.materials.metal);
        frame.position.copy(door.position);
        frame.rotation.copy(door.rotation);
        this.scene.add(frame);

        // Add door handle
        const handleGeometry = new THREE.SphereGeometry(0.05);
        const handle = new THREE.Mesh(handleGeometry, this.materials.metal);
        handle.position.set(
            x + (rotation === 0 ? doorWidth/2 - 0.1 : 0),
            doorHeight / 2,
            z + (rotation === Math.PI / 2 ? doorWidth/2 - 0.1 : 0)
        );
        this.scene.add(handle);

        this.scene.add(door);

        const doorObject = {
            name,
            mesh: door,
            frame: frame,
            handle: handle,
            position: new THREE.Vector3(x, 0, z),
            isOpen: false,
            isLocked: false,
            requiredKey: null
        };

        this.doors.push(doorObject);
        return doorObject;
    }

    addEnvironmentalDetails() {
        // Add computers and equipment
        this.addComputers();

        // Add furniture
        this.addFurniture();

        // Add hazard signs and warnings
        this.addSigns();

        // Add scattered papers and documents
        this.addDocuments();

        // Add frozen bodies (environmental storytelling)
        this.addFrozenBodies();
    }

    addComputers() {
        const computerPositions = [
            { x: 5, z: 5, room: 'Central Hub' },
            { x: -5, z: -5, room: 'Central Hub' },
            { x: this.roomSize * 2 - 3, z: 2, room: 'Communications Tower' },
            { x: -this.roomSize * 2 + 3, z: -2, room: 'Research Lab' }
        ];

        computerPositions.forEach(pos => {
            this.createComputer(pos.x, pos.z);
        });
    }

    createComputer(x, z) {
        // Computer base
        const baseGeometry = new THREE.BoxGeometry(1, 0.5, 0.8);
        const base = new THREE.Mesh(baseGeometry, this.materials.metal);
        base.position.set(x, 0.25, z);
        base.castShadow = true;
        this.scene.add(base);

        // Monitor
        const monitorGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
        const monitor = new THREE.Mesh(monitorGeometry, this.materials.metal);
        monitor.position.set(x, 0.8, z);
        monitor.castShadow = true;
        this.scene.add(monitor);

        // Screen (with subtle glow)
        const screenGeometry = new THREE.PlaneGeometry(0.7, 0.5);
        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(x, 0.8, z + 0.06);
        this.scene.add(screen);

        const computer = {
            base, monitor, screen,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'computer'
        };

        this.interactiveObjects.push(computer);
    }

    addFurniture() {
        // Add chairs, tables, etc.
        const furniturePositions = [
            { x: 3, z: 3, type: 'chair' },
            { x: -3, z: 3, type: 'table' },
            { x: 8, z: 8, type: 'chair' },
            { x: -8, z: -8, type: 'table' }
        ];

        furniturePositions.forEach(pos => {
            this.createFurniture(pos.x, pos.z, pos.type);
        });
    }

    createFurniture(x, z, type) {
        let geometry, material;

        switch (type) {
            case 'chair':
                geometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
                material = this.materials.metal;
                break;
            case 'table':
                geometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
                material = this.materials.metal;
                break;
            default:
                return;
        }

        const furniture = new THREE.Mesh(geometry, material);
        furniture.position.set(x, type === 'chair' ? 0.4 : 0.8, z);
        furniture.castShadow = true;
        this.scene.add(furniture);

        this.interactiveObjects.push({
            mesh: furniture,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: false,
            type: 'furniture'
        });
    }

    addSigns() {
        const signs = [
            { text: 'AUTHORIZED PERSONNEL ONLY', x: 0, z: 10, rotation: 0 },
            { text: 'RADIATION HAZARD', x: -10, z: 0, rotation: Math.PI / 2 },
            { text: 'EMERGENCY EXIT', x: 10, z: 0, rotation: -Math.PI / 2 },
            { text: 'TEST CHAMBER - DO NOT ENTER', x: 0, z: -10, rotation: Math.PI }
        ];

        signs.forEach(sign => {
            this.createSign(sign.text, sign.x, sign.z, sign.rotation);
        });
    }

    createSign(text, x, z, rotation) {
        // Sign board
        const boardGeometry = new THREE.PlaneGeometry(2, 0.5);
        const board = new THREE.Mesh(boardGeometry, this.materials.metal);
        board.position.set(x, 2.5, z);
        board.rotation.y = rotation;
        this.scene.add(board);

        // Sign text would be implemented with a text rendering system
        // For now, we'll just create the physical sign
        const sign = {
            board,
            position: new THREE.Vector3(x, 2.5, z),
            text,
            isInteractive: true,
            type: 'sign'
        };

        this.interactiveObjects.push(sign);
    }

    addDocuments() {
        // Scattered papers and research documents
        const documentPositions = [
            { x: 2, z: 2 },
            { x: -4, z: 6 },
            { x: 7, z: -3 },
            { x: -6, z: -7 }
        ];

        documentPositions.forEach(pos => {
            this.createDocument(pos.x, pos.z);
        });
    }

    createDocument(x, z) {
        const docGeometry = new THREE.PlaneGeometry(0.3, 0.4);
        const docMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const document = new THREE.Mesh(docGeometry, docMaterial);
        document.position.set(x, 0.05, z);
        document.rotation.x = -Math.PI / 2;
        this.scene.add(document);

        const docObject = {
            mesh: document,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'document',
            content: this.generateDocumentContent()
        };

        this.interactiveObjects.push(docObject);
    }

    generateDocumentContent() {
        const documents = [
            "RESEARCH LOG #47\n\nThe signal grows stronger each day. Dr. Chen reports hearing voices in the comms. We've isolated the frequency but cannot determine its origin.",
            "PERSONNEL MEMO\n\nAll staff must undergo psychological evaluation. Three researchers have gone missing in the past week. Security protocols upgraded to Level 4.",
            "TECHNICAL SPEC\n\nSignal Frequency: 47.83 MHz\nAmplitude: Variable\nSource: Unknown (possibly extraterrestrial)\nEffect: Neural interference detected in 87% of test subjects.",
            "DR. KOVACS' NOTES\n\nThe signal isn't just communication. It's alive. It adapts. It learns. We may have awakened something we cannot control."
        ];

        return documents[Math.floor(Math.random() * documents.length)];
    }

    addFrozenBodies() {
        const bodyPositions = [
            { x: 12, z: 3, pose: 'frozen_run' },
            { x: -9, z: -5, pose: 'frozen_crawl' },
            { x: 4, z: -12, pose: 'frozen_pray' }
        ];

        bodyPositions.forEach(pos => {
            this.createFrozenBody(pos.x, pos.z, pos.pose);
        });
    }

    createFrozenBody(x, z, pose) {
        // Simple body representation
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(x, 0.9, z);
        body.castShadow = true;
        this.scene.add(body);

        // Add ice effect
        const iceGeometry = new THREE.SphereGeometry(0.5);
        const iceMaterial = new THREE.MeshLambertMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3
        });
        const ice = new THREE.Mesh(iceGeometry, iceMaterial);
        ice.position.copy(body.position);
        ice.scale.set(1.5, 2.2, 1.5);
        this.scene.add(ice);

        const frozenBody = {
            body, ice,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'body',
            pose
        };

        this.interactiveObjects.push(frozenBody);
    }

    addExteriorDetails() {
        // Add crashed helicopter or vehicle
        this.createCrashedHelicopter(25, 25);

        // Add satellite dishes and antennas
        this.createAntenna(30, 20);
        this.createAntenna(20, 30);

        // Add fuel tanks and equipment
        this.createFuelTank(35, 15);
    }

    createCrashedHelicopter(x, z) {
        // Simple helicopter representation
        const bodyGeometry = new THREE.BoxGeometry(8, 2, 3);
        const body = new THREE.Mesh(bodyGeometry, this.materials.metal);
        body.position.set(x, 1, z);
        body.rotation.z = Math.PI / 6;
        body.castShadow = true;
        this.scene.add(body);

        // Rotor
        const rotorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10);
        const rotor = new THREE.Mesh(rotorGeometry, this.materials.metal);
        rotor.position.set(x, 3, z);
        rotor.rotation.z = Math.PI / 4;
        this.scene.add(rotor);

        const helicopter = {
            body, rotor,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'helicopter'
        };

        this.interactiveObjects.push(helicopter);
    }

    createAntenna(x, z) {
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8);
        const pole = new THREE.Mesh(poleGeometry, this.materials.metal);
        pole.position.set(x, 4, z);
        pole.castShadow = true;
        this.scene.add(pole);

        // Dish
        const dishGeometry = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI);
        const dish = new THREE.Mesh(dishGeometry, this.materials.metal);
        dish.position.set(x, 7, z);
        dish.rotation.x = Math.PI / 2;
        this.scene.add(dish);

        const antenna = {
            pole, dish,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: false,
            type: 'antenna'
        };

        this.interactiveObjects.push(antenna);
    }

    createFuelTank(x, z) {
        const tankGeometry = new THREE.CylinderGeometry(1, 1, 3);
        const tank = new THREE.Mesh(tankGeometry, this.materials.metal);
        tank.position.set(x, 1.5, z);
        tank.castShadow = true;
        this.scene.add(tank);

        const fuelTank = {
            tank,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'fuel_tank'
        };

        this.interactiveObjects.push(fuelTank);
    }

    addInteractiveObjects() {
        // Add key items and objectives
        this.addKeyItems();
        this.addObjectives();
    }

    addKeyItems() {
        // Distress signal transmitter
        this.createTransmitter(0, 0, -this.wallHeight);

        // Key cards
        this.createKeyCard(15, 5);
        this.createKeyCard(-12, 8);

        // Batteries
        for (let i = 0; i < 5; i++) {
            this.createBattery(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );
        }

        // Ammo
        for (let i = 0; i < 8; i++) {
            this.createAmmoPickup(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30
            );
        }
    }

    createTransmitter(x, z, y) {
        // Main transmitter unit
        const unitGeometry = new THREE.BoxGeometry(2, 1, 2);
        const unit = new THREE.Mesh(unitGeometry, this.materials.metal);
        unit.position.set(x, y + 0.5, z);
        unit.castShadow = true;
        this.scene.add(unit);

        // Antenna array
        for (let i = 0; i < 3; i++) {
            const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3);
            const antenna = new THREE.Mesh(antennaGeometry, this.materials.metal);
            antenna.position.set(x - 1 + i, y + 2.5, z);
            this.scene.add(antenna);
        }

        // Signal effect (glowing orb)
        const signalGeometry = new THREE.SphereGeometry(0.3);
        const signalMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.6
        });
        const signal = new THREE.Mesh(signalGeometry, signalMaterial);
        signal.position.set(x, y + 1.5, z);
        this.scene.add(signal);

        const transmitter = {
            unit, signal,
            position: new THREE.Vector3(x, y, z),
            isInteractive: true,
            type: 'transmitter',
            isObjective: true
        };

        this.interactiveObjects.push(transmitter);
    }

    createKeyCard(x, z) {
        const cardGeometry = new THREE.BoxGeometry(0.1, 0.06, 0.02);
        const card = new THREE.Mesh(cardGeometry, this.materials.metal);
        card.position.set(x, 0.03, z);
        card.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(card);

        const keyCard = {
            card,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'keycard',
            color: ['red', 'blue', 'green'][Math.floor(Math.random() * 3)]
        };

        this.interactiveObjects.push(keyCard);
    }

    createBattery(x, z) {
        const batteryGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.05);
        const battery = new THREE.Mesh(batteryGeometry, this.materials.metal);
        battery.position.set(x, 0.04, z);
        this.scene.add(battery);

        const batteryPickup = {
            battery,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'battery'
        };

        this.interactiveObjects.push(batteryPickup);
    }

    createAmmoPickup(x, z) {
        const ammoGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1);
        const ammo = new THREE.Mesh(ammoGeometry, this.materials.metal);
        ammo.position.set(x, 0.05, z);
        ammo.rotation.z = Math.PI / 2;
        this.scene.add(ammo);

        const ammoPickup = {
            ammo,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'ammo',
            amount: 10
        };

        this.interactiveObjects.push(ammoPickup);
    }

    addObjectives() {
        // Research logs
        this.createResearchLog(-this.roomSize * 2 + 2, 2);
        this.createResearchLog(this.roomSize * 2 - 2, -2);

        // Audio logs
        this.createAudioLog(2, this.roomSize * 2 - 2);
        this.createAudioLog(-2, -this.roomSize * 2 + 2);
    }

    createResearchLog(x, z) {
        const logGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.4);
        const log = new THREE.Mesh(logGeometry, this.materials.metal);
        log.position.set(x, 0.025, z);
        this.scene.add(log);

        const researchLog = {
            log,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'research_log',
            isObjective: true,
            content: this.generateResearchLogContent()
        };

        this.interactiveObjects.push(researchLog);
    }

    generateResearchLogContent() {
        const logs = [
            "FINAL LOG - DR. SARAH CHEN\n\nThe signal has breached containment. It started as a simple radio frequency, but now it exists in our minds. The test subjects... they're not themselves anymore. God help us all.",
            "SECURITY BREACH REPORT\n\nMultiple containment failures detected. Signal has adapted to our security measures. Recommend immediate evacuation and facility destruction. This is not a drill.",
            "PERSONAL LOG - DR. MIKHAIL VOLKOV\n\nI can hear it calling to me. It's not just noise - it's words, promises. It offers knowledge beyond human comprehension. I think... I think I want to listen.",
            "EMERGENCY PROTOCOL ALPHA\n\nIf you're reading this, the signal has taken control. The only way to stop it is to destroy the transmitter. Do not hesitate. Do not listen to the voices."
        ];

        return logs[Math.floor(Math.random() * logs.length)];
    }

    createAudioLog(x, z) {
        const recorderGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.15);
        const recorder = new THREE.Mesh(recorderGeometry, this.materials.metal);
        recorder.position.set(x, 0.05, z);
        this.scene.add(recorder);

        const audioLog = {
            recorder,
            position: new THREE.Vector3(x, 0, z),
            isInteractive: true,
            type: 'audio_log',
            isObjective: true,
            audioContent: this.generateAudioLogContent()
        };

        this.interactiveObjects.push(audioLog);
    }

    generateAudioLogContent() {
        return "🎵 [Distorted audio] ...breached containment... voices... cannot stop listening... it's in our heads...";
    }

    setupFacilityLighting() {
        // Emergency lighting setup is handled by the GameEngine
        // This method would configure room-specific lighting
    }

    update(deltaTime) {
        // Update dynamic world elements
        this.updateInteractiveObjects(deltaTime);

        // Check for room exploration
        this.checkRoomExploration();
    }

    updateInteractiveObjects(deltaTime) {
        // Update glowing effects, animations, etc.
        this.interactiveObjects.forEach(obj => {
            if (obj.type === 'transmitter' && obj.signal) {
                // Pulsing signal effect
                const intensity = 0.6 + Math.sin(performance.now() * 0.005) * 0.2;
                obj.signal.material.opacity = intensity;
            }
        });
    }

    checkRoomExploration() {
        // Mark rooms as explored when player enters them
        // This would be implemented with player position tracking
    }

    // Utility methods
    getInteractiveObjectsInRange(position, range) {
        return this.interactiveObjects.filter(obj => {
            const distance = position.distanceTo(obj.position);
            return distance <= range;
        });
    }

    getRoomAtPosition(position) {
        return this.rooms.find(room => room.bounds.containsPoint(position));
    }

    unlockDoor(doorName, keyType) {
        const door = this.doors.find(d => d.name === doorName);
        if (door && door.requiredKey === keyType) {
            door.isLocked = false;
            // Animate door opening
            return true;
        }
        return false;
    }

    // Save/Load
    getSaveData() {
        return {
            rooms: this.rooms.map(room => ({
                name: room.name,
                explored: room.explored
            })),
            doors: this.doors.map(door => ({
                name: door.name,
                isOpen: door.isOpen,
                isLocked: door.isLocked
            })),
            areasExplored: this.areasExplored
        };
    }

    loadSaveData(saveData) {
        // Restore world state
        saveData.rooms.forEach(savedRoom => {
            const room = this.rooms.find(r => r.name === savedRoom.name);
            if (room) {
                room.explored = savedRoom.explored;
            }
        });

        saveData.doors.forEach(savedDoor => {
            const door = this.doors.find(d => d.name === savedDoor.name);
            if (door) {
                door.isOpen = savedDoor.isOpen;
                door.isLocked = savedDoor.isLocked;
            }
        });

        this.areasExplored = saveData.areasExplored;
    }

    clearWorld() {
        // Remove all world objects
        this.rooms.forEach(room => {
            room.objects.forEach(obj => {
                this.scene.remove(obj);
            });
        });

        this.doors.forEach(door => {
            this.scene.remove(door.mesh);
            this.scene.remove(door.frame);
            this.scene.remove(door.handle);
        });

        this.interactiveObjects.forEach(obj => {
            Object.values(obj).forEach(mesh => {
                if (mesh && mesh.isMesh) {
                    this.scene.remove(mesh);
                }
            });
        });

        // Clear arrays
        this.rooms = [];
        this.doors = [];
        this.interactiveObjects = [];
        this.lights = [];
    }

    reset() {
        this.clearWorld();
        this.generateFacility();
        this.areasExplored = 0;
    }

    cleanup() {
        this.clearWorld();
    }

    // Getters
    getAreasExplored() { return this.areasExplored; }
    getRooms() { return this.rooms; }
    getDoors() { return this.doors; }
    getInteractiveObjects() { return this.interactiveObjects; }
}
