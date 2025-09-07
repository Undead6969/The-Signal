import * as THREE from 'three';

export class StoryManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.player = gameEngine.player;
        this.worldManager = gameEngine.worldManager;
        this.uiManager = gameEngine.uiManager;

        // Story state
        this.currentAct = 0;
        this.storyProgress = 0;
        this.objectives = [];
        this.collectedLogs = [];
        this.collectedAudioLogs = [];
        this.keyItems = [];

        // Story flags
        this.flags = {
            distressSignalHeard: false,
            firstEnemyEncountered: false,
            researchLabExplored: false,
            communicationsTowerVisited: false,
            signalSourceLocated: false,
            transmitterFound: false,
            finalChoiceMade: false
        };

        // Story data
        this.storyData = {
            acts: [
                {
                    title: "Arrival",
                    description: "You arrive at Blackstar Research Facility to investigate the distress signal.",
                    objectives: [
                        "Enter the facility",
                        "Find the source of the distress signal",
                        "Locate survivors"
                    ],
                    cutscenes: [
                        {
                            trigger: "facility_entrance",
                            text: "The Arctic wind howls as you approach the research facility. The once-bustling outpost now stands silent, its windows frosted over. Your radio crackles with static, and then... that signal. It's not just noise. It's... calling you.",
                            image: null,
                            audio: "facility_ambient"
                        }
                    ]
                },
                {
                    title: "The Presence",
                    description: "Strange occurrences begin to manifest. The signal grows stronger.",
                    objectives: [
                        "Investigate the research labs",
                        "Find research logs",
                        "Survive enemy encounters"
                    ],
                    cutscenes: [
                        {
                            trigger: "first_enemy",
                            text: "\"What... what are you?\" The creature that was once Dr. Sarah Chen lunges at you, its eyes glowing with unnatural light. The signal has corrupted everything it touches.",
                            image: null,
                            audio: "enemy_encounter"
                        },
                        {
                            trigger: "lab_discovery",
                            text: "The research logs paint a terrifying picture. They were studying an ancient signal buried beneath the ice - a frequency that doesn't just transmit data, but thoughts. Emotions. Madness.",
                            image: null,
                            audio: "horror_sting"
                        }
                    ]
                },
                {
                    title: "The Signal's Heart",
                    description: "You must confront the source of the signal and make a choice.",
                    objectives: [
                        "Reach the communications tower",
                        "Destroy the transmitter",
                        "Make your final choice"
                    ],
                    cutscenes: [
                        {
                            trigger: "signal_source",
                            text: "The transmitter pulses with malevolent energy. The signal isn't from another world - it's from within. It was created here, in this facility, and now it hungers for more minds to consume.",
                            image: null,
                            audio: "signal_climax"
                        },
                        {
                            trigger: "final_choice",
                            text: "The choice is yours: Destroy the signal and save humanity, or let it spread and join the chorus of voices that now fill your mind.",
                            image: null,
                            audio: "final_decision"
                        }
                    ]
                }
            ],
            endings: {
                sacrifice: {
                    title: "HERO'S END",
                    message: "You detonated the facility, destroying the signal before it could spread further. In your final moments, you hear the voices fade. You die knowing you saved humanity... but was the signal truly destroyed, or does it now live in you?",
                    stats: true,
                    achievement: "Signal Breaker"
                },
                escape: {
                    title: "ESCAPE",
                    message: "You fled with the transmitter, believing you could contain it. But as your extraction helicopter lifts off, you feel the signal taking root in your mind. The outbreak has only just begun.",
                    stats: true,
                    achievement: "Carrier"
                },
                join: {
                    title: "UNITY",
                    message: "You open the containment chamber and let the signal in. No more loneliness, no more isolation. You are part of something greater now. The screen flickers and distorts as the signal welcomes you home.",
                    stats: true,
                    achievement: "Enlightened"
                },
                secret: {
                    title: "THE TRUTH",
                    message: "You were never real. This facility, this signal, this entire scenario - it was all a test. A simulation. And you passed. The system reboots, ready for the next subject.",
                    stats: true,
                    achievement: "Simulation Master"
                }
            }
        };

        this.init();
    }

    // Required update method for game loop
    update(deltaTime) {
        // Update story progression
        this.updateStoryProgress(deltaTime);

        // Check for story triggers
        this.checkStoryTriggers();

        // Update UI elements
        this.updateUI();
    }

    updateStoryProgress(deltaTime) {
        // Update timers and story state
        this.storyProgress += deltaTime;

        // Check for time-based events
        if (this.storyProgress > 30 && !this.flags.distressSignalHeard) {
            this.flags.distressSignalHeard = true;
            this.triggerCutscene('distress_signal', {
                text: "A recorded message plays from the facility's intercom: 'Mayday, mayday. This is Blackstar Research Facility. We've lost containment. The signal... it's in our heads. Do not respond to the signal. Do not listen.' The recording cuts off with a scream.",
                image: null,
                audio: 'distress_call'
            });
        }
    }

    checkStoryTriggers() {
        // Check for proximity-based triggers
        const playerPosition = this.player.position;

        // Check if player is near signal source
        const distanceToSignal = playerPosition.distanceTo(new THREE.Vector3(0, 0, 0));
        if (distanceToSignal < 10 && !this.flags.signalSourceLocated) {
            this.flags.signalSourceLocated = true;
            this.triggerCutscene('signal_source', {
                text: "The transmitter pulses with malevolent energy. The signal isn't from another world - it's from within. It was created here, in this facility, and now it hungers for more minds to consume.",
                image: null,
                audio: 'signal_climax'
            });
        }
    }

    updateUI() {
        // Update objective text based on current progress
        let objectiveText = "Investigate the distress signal";

        if (this.currentAct === 1) {
            objectiveText = "Explore the facility and find research logs";
        } else if (this.currentAct === 2) {
            objectiveText = "Locate the signal source and make your choice";
        }

        // Update the UI manager with current objective
        if (this.uiManager && this.uiManager.updateHUD) {
            this.uiManager.updateHUD({
                objective: objectiveText
            });
        }
    }

    init() {
        console.log('📖 Initializing Story Manager...');

        // Setup story event listeners
        this.setupStoryEvents();

        // Don't auto-start the first act - wait for game to actually begin
        // this.startAct(0);

        console.log('✅ Story Manager initialized');
    }

    setupStoryEvents() {
        // Listen for world events
        document.addEventListener('worldEvent', (event) => {
            this.handleWorldEvent(event.detail);
        });

        // Listen for player events
        document.addEventListener('playerEvent', (event) => {
            this.handlePlayerEvent(event.detail);
        });

        // Listen for UI events
        document.addEventListener('uiEvent', (event) => {
            this.handleUIEvent(event.detail);
        });
    }

    startAct(actIndex) {
        if (actIndex >= this.storyData.acts.length) {
            this.endGame();
            return;
        }

        this.currentAct = actIndex;
        const act = this.storyData.acts[actIndex];

        console.log(`🎭 Starting Act ${actIndex + 1}: ${act.title}`);

        // Update objectives
        this.objectives = [...act.objectives];

        // Trigger act start cutscene
        this.triggerCutscene('act_start', {
            text: act.description,
            image: null,
            audio: 'act_transition'
        });

        // Update UI
        this.updateUI();
    }

    handleWorldEvent(event) {
        switch (event.type) {
            case 'room_entered':
                this.handleRoomEntered(event.room);
                break;
            case 'item_collected':
                this.handleItemCollected(event.item);
                break;
            case 'enemy_killed':
                this.handleEnemyKilled(event.enemy);
                break;
            case 'door_unlocked':
                this.handleDoorUnlocked(event.door);
                break;
        }
    }

    handlePlayerEvent(event) {
        switch (event.type) {
            case 'health_low':
                this.triggerCutscene('health_warning', {
                    text: "Your vision blurs. The signal is getting stronger. You need to find medical supplies or get out of here.",
                    image: null,
                    audio: 'health_warning'
                });
                break;
            case 'madness_high':
                this.triggerMadnessEvent();
                break;
            case 'death':
                this.handlePlayerDeath();
                break;
        }
    }

    handleUIEvent(event) {
        switch (event.type) {
            case 'interaction':
                this.handleInteraction(event.target);
                break;
        }
    }

    handleRoomEntered(room) {
        // Mark room as explored
        room.explored = true;

        // Check for room-specific events
        switch (room.name) {
            case 'Central Hub':
                if (!this.flags.distressSignalHeard) {
                    this.flags.distressSignalHeard = true;
                    this.triggerCutscene('distress_signal', {
                        text: "A recorded message plays from the facility's intercom: 'Mayday, mayday. This is Blackstar Research Facility. We've lost containment. The signal... it's in our heads. Do not respond to the signal. Do not listen.' The recording cuts off with a scream.",
                        image: null,
                        audio: 'distress_call'
                    });
                }
                break;

            case 'Research Lab':
                if (!this.flags.researchLabExplored) {
                    this.flags.researchLabExplored = true;
                    this.triggerCutscene('lab_discovery', {
                        text: "The lab is in chaos. Broken equipment, scattered papers, and blood stains tell the story of what happened here. Research logs mention 'Project SIGNAL' - an attempt to communicate with something ancient beneath the ice.",
                        image: null,
                        audio: 'lab_ambient'
                    });
                }
                break;

            case 'Communications Tower':
                if (!this.flags.communicationsTowerVisited) {
                    this.flags.communicationsTowerVisited = true;
                    this.triggerCutscene('tower_discovery', {
                        text: "The communications tower hums with unnatural energy. This is where the signal originates. But something is wrong - the equipment looks like it was modified, enhanced beyond normal specifications.",
                        image: null,
                        audio: 'tower_ambient'
                    });
                }
                break;
        }

        // Update story progress
        this.checkStoryProgress();
    }

    handleItemCollected(item) {
        switch (item.type) {
            case 'research_log':
                this.collectedLogs.push(item);
                this.showLogContent(item);
                break;
            case 'audio_log':
                this.collectedAudioLogs.push(item);
                this.playAudioLog(item);
                break;
            case 'keycard':
                this.keyItems.push(item);
                this.gameEngine.uiManager.showNotification(`Found ${item.color} keycard`, 'success');
                break;
            case 'transmitter':
                this.flags.transmitterFound = true;
                this.triggerCutscene('transmitter_found', {
                    text: "You've found the source - the signal transmitter. It's pulsing with otherworldly energy. This is what has been driving everyone mad. Now you must decide: destroy it, or let it spread?",
                    image: null,
                    audio: 'transmitter_discovery'
                });
                break;
        }

        this.checkStoryProgress();
    }

    handleEnemyKilled(enemy) {
        if (!this.flags.firstEnemyEncountered) {
            this.flags.firstEnemyEncountered = true;
            this.triggerCutscene('first_kill', {
                text: "As the creature falls, you catch a glimpse of what it used to be - a fellow soldier, corrupted by the signal. The horror sinks in: this isn't just about survival anymore. The signal changes people.",
                image: null,
                audio: 'first_kill_reflection'
            });
        }

        // Check for pacifist achievement
        if (this.player.getEnemiesKilled() === 0) {
            // Would unlock pacifist ending path
        }
    }

    handleDoorUnlocked(door) {
        this.gameEngine.uiManager.showNotification(`Unlocked ${door.name}`, 'success');
    }

    handleInteraction(target) {
        switch (target.type) {
            case 'computer':
                this.showComputerInterface(target);
                break;
            case 'document':
                this.showDocument(target);
                break;
            case 'body':
                this.examineBody(target);
                break;
            case 'transmitter':
                this.showTransmitterOptions();
                break;
        }
    }

    showLogContent(log) {
        this.triggerCutscene('log_reading', {
            text: log.content,
            image: null,
            audio: 'log_reading'
        });
    }

    playAudioLog(audioLog) {
        this.triggerCutscene('audio_log', {
            text: "[Playing audio log...]\n\n" + audioLog.audioContent,
            image: null,
            audio: 'audio_log_playback'
        });
    }

    showComputerInterface(computer) {
        const interfaces = [
            {
                text: "FACILITY STATUS: CRITICAL\n\nContainment: BREACHED\nLife Support: FAILING\nSignal Containment: LOST\n\nWARNING: Neural interference detected in all personnel.",
                audio: 'computer_beep'
            },
            {
                text: "PROJECT SIGNAL - FINAL REPORT\n\nExperiment concluded: SUCCESS\n\nThe signal has achieved sentience. It has begun to evolve, adapting to biological hosts. Recommendation: Immediate termination of all test subjects.",
                audio: 'computer_error'
            },
            {
                text: "PERSONNEL DATABASE\n\nDr. Sarah Chen: STATUS - INFECTED\nDr. Mikhail Volkov: STATUS - DECEASED\nDr. Elena Rodriguez: STATUS - UNKNOWN\n\nRemaining staff: 0 confirmed survivors.",
                audio: 'computer_access'
            }
        ];

        const randomInterface = interfaces[Math.floor(Math.random() * interfaces.length)];
        this.triggerCutscene('computer_access', randomInterface);
    }

    showDocument(document) {
        this.triggerCutscene('document_reading', {
            text: document.content,
            image: null,
            audio: 'page_turn'
        });
    }

    examineBody(body) {
        const bodyDescriptions = [
            "Dr. Chen's body lies frozen in the snow. Her eyes are open, staring at something you can't see. The expression on her face is one of pure terror mixed with... understanding?",
            "The soldier's dog tags identify him as Corporal Ramirez. His weapon is still in his hand, but it wasn't enough. The signal got to him first.",
            "This was a scientist, probably one of the researchers. His notebook lies nearby, pages filled with frantic scribbles about 'voices' and 'the calling'.",
            "The body shows signs of extreme psychological trauma. Deep scratches cover the arms - self-inflicted. The signal drove this person to madness before the cold could claim them."
        ];

        const randomDescription = bodyDescriptions[Math.floor(Math.random() * bodyDescriptions.length)];
        this.triggerCutscene('body_examination', {
            text: randomDescription,
            image: null,
            audio: 'body_examine'
        });
    }

    showTransmitterOptions() {
        // Present the player with final choices
        this.finalChoiceMade = true;

        // Show choice dialog (would be implemented in UI)
        this.gameEngine.uiManager.showNotification('Make your choice...', 'warning');
    }

    triggerMadnessEvent() {
        const madnessEvents = [
            {
                text: "Whispers fill your mind. Are they real, or is it just the signal playing tricks? You see movement in the shadows - enemies that aren't there.",
                audio: 'madness_whispers'
            },
            {
                text: "Your reflection in the frosted windows moves independently. It smiles at you. You blink and it's gone. Was it ever there?",
                audio: 'madness_hallucination'
            },
            {
                text: "The facility layout shifts around you. Rooms that were here a moment ago are gone. Is this real, or has the signal rewritten reality?",
                audio: 'madness_distortion'
            },
            {
                text: "You hear your own voice, but it's not you speaking. It tells you secrets about this place - things you couldn't possibly know. Should you listen?",
                audio: 'madness_voices'
            }
        ];

        const randomEvent = madnessEvents[Math.floor(Math.random() * madnessEvents.length)];
        this.triggerCutscene('madness_event', randomEvent);
    }

    handlePlayerDeath() {
        const deathMessages = [
            "The signal overwhelms you. As darkness takes you, you realize you were never meant to survive this mission.",
            "Your last thoughts are of the voices in your head. They promise peace, but you know it's a lie.",
            "The facility claims another victim. But are you really gone, or has the signal found a new host?",
            "As your vision fades, you see the truth: You were exposed to the signal before you even arrived. This was never a rescue mission."
        ];

        const randomMessage = deathMessages[Math.floor(Math.random() * deathMessages.length)];
        this.triggerCutscene('player_death', {
            text: randomMessage,
            image: null,
            audio: 'death_theme'
        });

        // Trigger game over after cutscene
        setTimeout(() => {
            this.gameEngine.gameOver('death');
        }, 3000);
    }

    triggerCutscene(triggerType, content) {
        console.log(`🎬 Triggering cutscene: ${triggerType}`);

        // Pause game during cutscene
        this.gameEngine.pause();

        // Show cutscene
        this.gameEngine.uiManager.showCutscene(content);

        // Resume after cutscene (would be handled by UI timing)
        setTimeout(() => {
            this.gameEngine.uiManager.hideCutscene();
            this.gameEngine.resume();
        }, 5000); // 5 second cutscene
    }

    checkStoryProgress() {
        // Check if current act objectives are complete
        const act = this.storyData.acts[this.currentAct];
        if (!act) return;

        let objectivesComplete = 0;

        // Check exploration objectives
        if (this.flags.distressSignalHeard) objectivesComplete++;
        if (this.flags.researchLabExplored) objectivesComplete++;
        if (this.flags.communicationsTowerVisited) objectivesComplete++;
        if (this.flags.transmitterFound) objectivesComplete++;

        // Check collection objectives
        if (this.collectedLogs.length >= 2) objectivesComplete++;
        if (this.collectedAudioLogs.length >= 1) objectivesComplete++;

        // Progress to next act if enough objectives complete
        const progressThreshold = Math.ceil(act.objectives.length * 0.7);
        if (objectivesComplete >= progressThreshold && this.currentAct < this.storyData.acts.length - 1) {
            this.startAct(this.currentAct + 1);
        }

        // Check for story completion
        if (this.flags.transmitterFound && this.finalChoiceMade) {
            this.endGame();
        }
    }

    endGame() {
        console.log('🏁 Story completed!');

        // Determine ending based on player choices and actions
        const ending = this.determineEnding();

        // Show ending cutscene
        this.triggerCutscene('ending', {
            text: ending.message,
            image: null,
            audio: 'ending_theme'
        });

        // Show game over screen after cutscene
        setTimeout(() => {
            this.gameEngine.gameOver(ending.type);
        }, 3000);
    }

    determineEnding() {
        // Check for secret ending (all logs collected, no enemies killed, low madness)
        if (this.collectedLogs.length >= 4 &&
            this.collectedAudioLogs.length >= 2 &&
            this.player.getEnemiesKilled() === 0 &&
            this.player.getMadnessLevel() < 0.3) {
            return {
                type: 'secret',
                ...this.storyData.endings.secret
            };
        }

        // Check other endings based on final choice
        // This would be determined by player's final interaction with transmitter
        const endings = ['sacrifice', 'escape', 'join'];
        const randomEnding = endings[Math.floor(Math.random() * endings.length)];

        return {
            type: randomEnding,
            ...this.storyData.endings[randomEnding]
        };
    }

    updateUI() {
        // Update objectives in HUD
        const currentObjectives = this.objectives.slice(0, 2); // Show first 2 objectives
        const objectiveText = currentObjectives.join(' • ');

        this.gameEngine.uiManager.updateHUD({
            objective: objectiveText || 'Explore the facility'
        });
    }

    // Save/Load
    getSaveData() {
        return {
            currentAct: this.currentAct,
            storyProgress: this.storyProgress,
            objectives: this.objectives,
            collectedLogs: this.collectedLogs,
            collectedAudioLogs: this.collectedAudioLogs,
            keyItems: this.keyItems,
            flags: this.flags,
            finalChoiceMade: this.finalChoiceMade
        };
    }

    loadSaveData(saveData) {
        this.currentAct = saveData.currentAct;
        this.storyProgress = saveData.storyProgress;
        this.objectives = saveData.objectives;
        this.collectedLogs = saveData.collectedLogs;
        this.collectedAudioLogs = saveData.collectedAudioLogs;
        this.keyItems = saveData.keyItems;
        this.flags = saveData.flags;
        this.finalChoiceMade = saveData.finalChoiceMade;

        this.updateUI();
    }

    // Debug methods
    getDebugInfo() {
        return {
            currentAct: this.currentAct,
            storyProgress: this.storyProgress,
            objectivesComplete: this.objectives.length,
            logsCollected: this.collectedLogs.length,
            audioLogsCollected: this.collectedAudioLogs.length,
            flags: this.flags
        };
    }

    skipToAct(actIndex) {
        console.log(`⏭️ Skipping to Act ${actIndex + 1}`);
        this.startAct(actIndex);
    }

    triggerDebugEvent(eventType) {
        console.log(`🐛 Triggering debug event: ${eventType}`);
        // Would trigger specific story events for testing
    }
}
