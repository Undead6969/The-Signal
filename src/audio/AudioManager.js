export class AudioManager {
    constructor(volume = 0.8) {
        this.masterVolume = volume;
        this.audioContext = null;
        this.listener = null;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.ambientSounds = new Map();
        this.currentMusic = null;
        this.currentAmbient = null;

        // Audio settings
        this.musicVolume = 0.6;
        this.sfxVolume = 0.8;
        this.ambientVolume = 0.4;

        // 3D Audio settings
        this.dopplerEffect = true;
        this.distanceModel = 'inverse';
        this.maxDistance = 50;
        this.refDistance = 1;
        this.rolloffFactor = 1;

        // Signal audio effects
        this.signalInterference = {
            intensity: 0,
            frequency: 440,
            time: 0
        };

        // Audio pools for performance
        this.soundPools = new Map();

        this.init();
    }

    async init() {
        console.log('🔊 Initializing Audio Manager...');

        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create audio listener for 3D positioning
            this.listener = this.audioContext.listener;
            this.listener.positionX.value = 0;
            this.listener.positionY.value = 2;
            this.listener.positionZ.value = 0;

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);

            // Create effect chains
            this.createEffectChains();

            // Load audio assets (will be handled by main.js loading manager)
            console.log('🎵 Audio context ready for asset loading');

            console.log('✅ Audio Manager initialized');

        } catch (error) {
            console.error('❌ Failed to initialize Audio Manager:', error);
            this.fallbackMode = true;
        }
    }

    // Method called by main.js loading manager
    async loadAudioFiles(loadingManager) {
        console.log('🎵 Loading audio files via main loading manager...');

        try {
            // Load all audio assets with proper file paths
            await this.loadAudioAssets();

            console.log('✅ Audio files loaded successfully');

            // Signal completion to loading manager
            if (loadingManager && loadingManager.onLoad) {
                loadingManager.onLoad();
            }

        } catch (error) {
            console.error('❌ Failed to load audio files:', error);
            if (loadingManager && loadingManager.onError) {
                loadingManager.onError('audio_loading_failed');
            }
        }
    }

    createEffectChains() {
        // Reverb effect for facility ambiance
        this.reverbNode = this.audioContext.createConvolver();
        this.createReverbImpulse();

        // Filter for signal interference
        this.filterNode = this.audioContext.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 2000;
        this.filterNode.Q.value = 1;

        // Distortion for madness effects
        this.distortionNode = this.audioContext.createWaveShaper();
        this.createDistortionCurve();

        // Delay for echo effects
        this.delayNode = this.audioContext.createDelay();
        this.delayNode.delayTime.value = 0.3;

        // Compressor for dynamic range
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNode.threshold.value = -24;
        this.compressorNode.knee.value = 30;
        this.compressorNode.ratio.value = 12;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;

        // Chain effects
        this.reverbNode.connect(this.filterNode);
        this.filterNode.connect(this.distortionNode);
        this.distortionNode.connect(this.delayNode);
        this.delayNode.connect(this.compressorNode);
        this.compressorNode.connect(this.masterGain);
    }

    createReverbImpulse() {
        // Create a simple reverb impulse response for facility ambiance
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Simple decay envelope
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
            }
        }

        this.reverbNode.buffer = impulse;
    }

    createDistortionCurve() {
        const samples = 44100;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * 2); // Soft clipping distortion
        }

        this.distortionNode.curve = curve;
    }

    async loadAudioAssets() {
        console.log('🎵 Loading audio assets from organized directories...');

        // Sound effects with organized file paths
        const soundEffects = {
            // Combat sounds
            'gunshot': './assets/audio/sfx/gunshot.wav',
            'reload': './assets/audio/sfx/reload.wav',

            // Movement sounds
            'footstep_concrete': './assets/audio/sfx/footstep_concrete.wav',
            'footstep_metal': './assets/audio/sfx/footstep_metal.wav',
            'footstep_snow': './assets/audio/sfx/footstep_snow.wav',

            // Interaction sounds
            'door_open': './assets/audio/sfx/door_open.wav',
            'door_close': './assets/audio/sfx/door_close.wav',
            'pickup': './assets/audio/sfx/pickup.wav',
            'keycard_use': './assets/audio/sfx/keycard_use.wav',

            // Enemy sounds
            'enemy_growl': './assets/audio/sfx/enemy_growl.wav',
            'enemy_attack': './assets/audio/sfx/enemy_attack.wav',

            // Signal/Horror sounds
            'signal_pulse': './assets/audio/sfx/signal_pulse.wav',
            'heartbeat': './assets/audio/sfx/heartbeat.wav',
            'breathing_heavy': './assets/audio/sfx/breathing_heavy.wav',
            'whispers': './assets/audio/sfx/whispers.wav',
            'static': './assets/audio/sfx/static.wav',

            // Environmental sounds
            'glass_break': './assets/audio/sfx/glass_break.wav',
            'metal_impact': './assets/audio/sfx/metal_impact.wav',
            'alarm': './assets/audio/sfx/alarm.wav'
        };

        // Music tracks
        const musicTracks = {
            'main_theme': './assets/audio/music/main_theme.mp3',
            'facility_ambient': './assets/audio/music/facility_ambient.mp3',
            'combat_theme': './assets/audio/music/combat_theme.mp3',
            'signal_theme': './assets/audio/music/signal_theme.mp3',
            'ending_theme': './assets/audio/music/ending_theme.mp3',
            'tension_build': './assets/audio/music/tension_build.mp3'
        };

        // Ambient sounds
        const ambientSounds = {
            'facility_hum': './assets/audio/ambient/facility_hum.wav',
            'wind': './assets/audio/ambient/wind.wav',
            'distant_voices': './assets/audio/ambient/distant_voices.wav',
            'signal_interference': './assets/audio/ambient/signal_interference.wav',
            'ice_cracking': './assets/audio/ambient/ice_cracking.wav',
            'snow_storm': './assets/audio/ambient/snow_storm.wav'
        };

        // Load all audio files with error handling
        const loadPromises = [
            this.loadSounds(soundEffects),
            this.loadMusic(musicTracks),
            this.loadAmbient(ambientSounds)
        ];

        try {
            await Promise.all(loadPromises);
            console.log('✅ All audio assets loaded successfully');
        } catch (error) {
            console.warn('⚠️ Some audio assets failed to load:', error);
            console.log('🎵 Continuing with available audio assets...');
        }
    }

    async loadSounds(soundList) {
        for (const [name, url] of Object.entries(soundList)) {
            try {
                const buffer = await this.loadAudioBuffer(url);
                this.sounds.set(name, { buffer: buffer, loaded: true });

                // Create sound pool for frequently used sounds
                if (['footstep_concrete', 'footstep_metal', 'gunshot', 'enemy_growl', 'door_open'].includes(name)) {
                    this.createSoundPool(name, buffer, 5);
                }

                console.log(`✅ Loaded sound: ${name}`);
            } catch (error) {
                console.warn(`⚠️ Sound not found: ${name} (${url})`);
                // Create placeholder entry for missing sounds
                this.sounds.set(name, { buffer: null, loaded: false });
            }
        }
    }

    async loadMusic(musicList) {
        for (const [name, url] of Object.entries(musicList)) {
            try {
                const buffer = await this.loadAudioBuffer(url);
                this.musicTracks.set(name, { buffer: buffer, loaded: true });
                console.log(`✅ Loaded music: ${name}`);
            } catch (error) {
                console.warn(`⚠️ Music not found: ${name} (${url})`);
                this.musicTracks.set(name, { buffer: null, loaded: false });
            }
        }
    }

    async loadAmbient(ambientList) {
        for (const [name, url] of Object.entries(ambientList)) {
            try {
                const buffer = await this.loadAudioBuffer(url);
                this.ambientSounds.set(name, { buffer: buffer, loaded: true });
                console.log(`✅ Loaded ambient: ${name}`);
            } catch (error) {
                console.warn(`⚠️ Ambient sound not found: ${name} (${url})`);
                this.ambientSounds.set(name, { buffer: null, loaded: false });
            }
        }
    }

    async loadAudioBuffer(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }

    createSoundPool(soundName, buffer, poolSize) {
        const pool = [];
        for (let i = 0; i < poolSize; i++) {
            pool.push({
                source: null,
                isPlaying: false,
                lastUsed: 0
            });
        }
        this.soundPools.set(soundName, pool);
    }

    // Playback methods
    playSound(soundName, options = {}) {
        if (this.fallbackMode || !this.sounds.has(soundName)) {
            console.log(`🔊 Would play sound: ${soundName} (not loaded)`);
            return null;
        }

        const soundData = this.sounds.get(soundName);
        if (!soundData || !soundData.loaded || !soundData.buffer) {
            console.log(`🔊 Would play sound: ${soundName} (no audio file)`);
            return null;
        }

        const buffer = soundData.buffer;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.reverbNode);

        // Apply options
        const volume = (options.volume || 1) * this.sfxVolume;
        gainNode.gain.value = volume;

        if (options.loop) {
            source.loop = true;
        }

        if (options.position) {
            this.apply3DAudio(source, gainNode, options.position);
        }

        source.start(0);

        // Return audio object for control
        return {
            source,
            gainNode,
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    // Source already stopped
                }
            },
            setVolume: (newVolume) => {
                gainNode.gain.value = newVolume * this.sfxVolume;
            }
        };
    }

    playSoundFromPool(soundName, options = {}) {
        const pool = this.soundPools.get(soundName);
        if (!pool) {
            return this.playSound(soundName, options);
        }

        // Find available source in pool
        let poolSource = pool.find(p => !p.isPlaying);
        if (!poolSource) {
            // Use oldest source if all are playing
            poolSource = pool.reduce((oldest, current) =>
                current.lastUsed < oldest.lastUsed ? current : oldest
            );
        }

        // Stop previous source if still playing
        if (poolSource.source) {
            try {
                poolSource.source.stop();
            } catch (e) {
                // Source already stopped
            }
        }

        // Create new source
        const soundData = this.sounds.get(soundName);
        if (!soundData || !soundData.loaded || !soundData.buffer) {
            return null; // Can't pool unloaded sounds
        }
        const buffer = soundData.buffer;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.reverbNode);

        // Apply options
        const volume = (options.volume || 1) * this.sfxVolume;
        gainNode.gain.value = volume;

        if (options.position) {
            this.apply3DAudio(source, gainNode, options.position);
        }

        source.start(0);
        poolSource.source = source;
        poolSource.isPlaying = true;
        poolSource.lastUsed = performance.now();

        // Mark as available when done
        source.onended = () => {
            poolSource.isPlaying = false;
        };

        return {
            source,
            gainNode,
            stop: () => {
                poolSource.isPlaying = false;
                try {
                    source.stop();
                } catch (e) {
                    // Source already stopped
                }
            },
            setVolume: (newVolume) => {
                gainNode.gain.value = newVolume * this.sfxVolume;
            }
        };
    }

    playMusic(trackName, options = {}) {
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        if (!this.musicTracks.has(trackName)) {
            console.warn(`Music track not found: ${trackName}`);
            return;
        }

        const musicData = this.musicTracks.get(trackName);
        if (!musicData || !musicData.loaded || !musicData.buffer) {
            console.log(`🎵 Would play music: ${trackName} (no audio file)`);
            return;
        }

        const buffer = musicData.buffer;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.compressorNode);

        const volume = (options.volume || 1) * this.musicVolume;
        gainNode.gain.value = volume;

        if (options.loop !== false) {
            source.loop = true;
        }

        source.start(0);

        this.currentMusic = {
            source,
            gainNode,
            name: trackName,
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    // Source already stopped
                }
            },
            setVolume: (newVolume) => {
                gainNode.gain.value = newVolume * this.musicVolume;
            }
        };

        return this.currentMusic;
    }

    playAmbient(soundName, options = {}) {
        // Stop current ambient
        if (this.currentAmbient) {
            this.currentAmbient.stop();
        }

        if (!this.ambientSounds.has(soundName)) {
            console.warn(`Ambient sound not found: ${soundName}`);
            return;
        }

        const ambientData = this.ambientSounds.get(soundName);
        if (!ambientData || !ambientData.loaded || !ambientData.buffer) {
            console.log(`🌊 Would play ambient: ${soundName} (no audio file)`);
            return;
        }

        const buffer = ambientData.buffer;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.reverbNode);

        const volume = (options.volume || 1) * this.ambientVolume;
        gainNode.gain.value = volume;
        source.loop = true;

        source.start(0);

        this.currentAmbient = {
            source,
            gainNode,
            name: soundName,
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    // Source already stopped
                }
            },
            setVolume: (newVolume) => {
                gainNode.gain.value = newVolume * this.ambientVolume;
            }
        };

        return this.currentAmbient;
    }

    // Alias method for compatibility
    playAmbientSound(soundName, options = {}) {
        return this.playAmbient(soundName, options);
    }

    apply3DAudio(source, gainNode, position) {
        // Create panner node for 3D positioning
        const panner = this.audioContext.createPanner();
        panner.positionX.value = position.x;
        panner.positionY.value = position.y;
        panner.positionZ.value = position.z;

        panner.distanceModel = this.distanceModel;
        panner.maxDistance = this.maxDistance;
        panner.refDistance = this.refDistance;
        panner.rolloffFactor = this.rolloffFactor;

        if (this.dopplerEffect) {
            panner.dopplerFactor = 1.0;
            panner.speedOfSound = 343.3; // Speed of sound in air (m/s)
        }

        // Reconnect through panner
        source.disconnect(gainNode);
        source.connect(panner);
        panner.connect(gainNode);
    }

    // Signal interference effects
    updateSignalInterference(intensity, frequency) {
        this.signalInterference.intensity = intensity;
        this.signalInterference.frequency = frequency;

        // Apply filter changes
        const filterFreq = 2000 * (1 - intensity) + 200 * intensity;
        this.filterNode.frequency.value = filterFreq;

        // Apply distortion
        this.distortionNode.wet.value = intensity * 0.3;

        // Generate interference sound
        if (intensity > 0.1) {
            this.generateInterferenceSound(intensity);
        }
    }

    generateInterferenceSound(intensity) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.frequency.value = this.signalInterference.frequency;
        oscillator.type = 'sawtooth';

        gainNode.gain.value = intensity * 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(this.reverbNode);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // Madness audio effects
    triggerMadnessAudio() {
        // Play distorted voices
        this.playSound('whispers', { volume: 0.7 });

        // Add reverb and delay
        this.delayNode.delayTime.value = 0.5;
        this.reverbNode.wet.value = 0.8;

        // Reset after a few seconds
        setTimeout(() => {
            this.delayNode.delayTime.value = 0.3;
            this.reverbNode.wet.value = 0.3;
        }, 3000);
    }

    // Environmental audio
    updateListenerPosition(position, rotation) {
        if (!this.listener) return;

        this.listener.positionX.value = position.x;
        this.listener.positionY.value = position.y;
        this.listener.positionZ.value = position.z;

        // Update listener orientation
        if (rotation) {
            const forward = new THREE.Vector3(0, 0, -1);
            const up = new THREE.Vector3(0, 1, 0);

            forward.applyEuler(rotation);
            up.applyEuler(rotation);

            this.listener.forwardX.value = forward.x;
            this.listener.forwardY.value = forward.y;
            this.listener.forwardZ.value = forward.z;

            this.listener.upX.value = up.x;
            this.listener.upY.value = up.y;
            this.listener.upZ.value = up.z;
        }
    }

    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume);
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        if (this.currentAmbient) {
            this.currentAmbient.setVolume(volume);
        }
    }

    // Utility methods
    fadeOut(audioObject, duration = 1000) {
        if (!audioObject || !audioObject.gainNode) return;

        const startVolume = audioObject.gainNode.gain.value;
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;

        audioObject.gainNode.gain.setValueAtTime(startVolume, startTime);
        audioObject.gainNode.gain.linearRampToValueAtTime(0, endTime);

        setTimeout(() => {
            audioObject.stop();
        }, duration);
    }

    fadeIn(audioObject, targetVolume, duration = 1000) {
        if (!audioObject || !audioObject.gainNode) return;

        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;

        audioObject.gainNode.gain.setValueAtTime(0, startTime);
        audioObject.gainNode.gain.linearRampToValueAtTime(targetVolume, endTime);
    }

    // Update method (called each frame)
    update(deltaTime) {
        this.signalInterference.time += deltaTime;

        // Update listener position (would be called from game engine)
        // this.updateListenerPosition(playerPosition, playerRotation);
    }

    // Cleanup
    cleanup() {
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Stop all playing sounds
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        if (this.currentAmbient) {
            this.currentAmbient.stop();
        }

        console.log('🧹 Audio Manager cleaned up');
    }

    // Debug methods
    getDebugInfo() {
        return {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            ambientVolume: this.ambientVolume,
            currentMusic: this.currentMusic?.name || null,
            currentAmbient: this.currentAmbient?.name || null,
            signalInterference: this.signalInterference.intensity,
            fallbackMode: this.fallbackMode
        };
    }

    listAvailableSounds() {
        return {
            sounds: Array.from(this.sounds.keys()),
            music: Array.from(this.musicTracks.keys()),
            ambient: Array.from(this.ambientSounds.keys())
        };
    }
}
