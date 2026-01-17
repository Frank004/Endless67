import EventBus, { Events } from '../../core/EventBus.js';
import { ASSETS } from '../../config/AssetKeys.js';

export class AudioSystem {
    static instance = null;

    constructor() {
        if (AudioSystem.instance) {
            return AudioSystem.instance;
        }
        AudioSystem.instance = this;

        this.scene = null;
        this.bgMusic = null;
        this.lavaSound = null;
        this.soundEnabled = true;
        this.shoeBrakeInstance = null;
        this.wallSlideSound = null;
    }

    setScene(scene) {
        this.scene = scene;

        // Read sound state from registry (default true if not set)
        const soundEnabledFromRegistry = scene.registry.get('soundEnabled');
        this.soundEnabled = soundEnabledFromRegistry !== undefined ? soundEnabledFromRegistry : true;

        // Sync Phaser's sound mute state with registry
        if (scene.sound) {
            scene.sound.mute = !this.soundEnabled;
        }

        // Resume audio context on user interaction
        this.setupAudioContextResume();
    }

    setupAudioContextResume() {
        const scene = this.scene;
        if (!scene) return;

        const resumeAudio = () => {
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                scene.sound.context.resume().then(() => {
                    // Force restart music if it should be playing but isn't
                    if (this.soundEnabled && this.bgMusic && !this.bgMusic.isPlaying) {
                        console.log('🔊 Audio Context Resumed: Restarting Music');
                        this.bgMusic.play();
                    }
                    // Success! Remove the listener to avoid redundant calls
                    scene.input.off('pointerdown', resumeAudio, this);
                }).catch(err => {
                    // Silently fail if still blocked - browser will warn enough
                });
            } else if (scene.sound && scene.sound.context && scene.sound.context.state === 'running') {
                // Already running, detach listener
                scene.input.off('pointerdown', resumeAudio, this);
            }
        };

        // Listen for user interactions
        scene.input.on('pointerdown', resumeAudio, this);
    }

    setupEventListeners() {
        // Audio Triggers via EventBus
        EventBus.on(Events.PLAYER_JUMPED, this.playJumpSound, this);
        EventBus.on(Events.COIN_COLLECTED, this.playCoinSound, this);
        EventBus.on(Events.SOUND_TOGGLED, this.toggleSound, this);
        EventBus.on(Events.PLAYER_HIT, this.playDamageSound, this);
        EventBus.on(Events.POWERUP_COLLECTED, this.playCelebrationSound, this);
        EventBus.on(Events.ENEMY_DESTROYED, this.playDestroySound, this);
        EventBus.on(Events.GAME_OVER, this.stopAudio, this);
        // Add more listeners as needed
    }

    removeEventListeners() {
        EventBus.off(Events.PLAYER_JUMPED, this.playJumpSound, this);
        EventBus.off(Events.COIN_COLLECTED, this.playCoinSound, this);
        EventBus.off(Events.SOUND_TOGGLED, this.toggleSound, this);
        EventBus.off(Events.PLAYER_HIT, this.playDamageSound, this);
        EventBus.off(Events.POWERUP_COLLECTED, this.playCelebrationSound, this);
        EventBus.off(Events.ENEMY_DESTROYED, this.playDestroySound, this);
        EventBus.off(Events.GAME_OVER, this.stopAudio, this);
    }

    setupAudio() {
        const scene = this.scene;
        if (!scene) return;

        this.setupEventListeners();

        // Silently handle audio context issues
        try {
            // Check if audio context is suspended
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                // Just log, don't return. We still need to instantiate sound objects.
                console.log('🔇 AudioContext suspended on init - creating sounds anyway but they may wait for interaction.');
            }

            // Init Wall Slide Sound
            if (scene.sound && scene.cache.audio.exists(ASSETS.WALL_SLIDE)) {
                // console.log('🔊 AudioManager: Wall slide asset found, creating sound instance.');
                this.wallSlideSound = scene.sound.add(ASSETS.WALL_SLIDE, { loop: true, volume: 0.5 });
            }

            // Ensure audio stops when scene shuts down (e.g. on restart)
            scene.events.once('shutdown', this.stopAudio, this);
            console.log('✅ AudioManager: setupAudio completed successfully');
        } catch (error) {
            // Silently handle any audio errors - don't show to user
        }
    }

    /**
     * Set up the specific ambient sound for the active riser type
     * @param {string} soundKey - The key of the audio asset
     */
    setupRiserSound(soundKey) {
        const scene = this.scene;
        if (!scene || !soundKey) return;

        try {
            if (this.riserAmbientSound) {
                this.riserAmbientSound.stop();
                this.riserAmbientSound.destroy();
                this.riserAmbientSound = null;
            }

            if (scene.sound && scene.cache.audio.exists(soundKey)) {
                this.riserAmbientSound = scene.sound.add(soundKey, { loop: true, volume: 0 });

                // Try to play ONLY if context is running
                if (scene.sound.context.state === 'running') {
                    try {
                        this.riserAmbientSound.play();
                    } catch (e) { console.warn('Riser sound play failed', e); }
                } else {
                    console.log(`🌋 Riser sound (${soundKey}) created but waiting for interaction`);
                }
            } else {
                console.warn(`⚠️ AudioManager: Riser sound key '${soundKey}' not found in cache.`);
            }
        } catch (e) {
            console.warn('Error setting up riser sound:', e);
        }
    }

    stopAudio() {
        this.removeEventListeners();
        if (this.riserAmbientSound) {
            this.riserAmbientSound.stop();
            this.riserAmbientSound = null;
        }
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic = null;
        }

        // Nuclear option: Stop all sounds in the scene manager to ensure silence
        if (this.scene && this.scene.sound) {
            this.scene.sound.stopAll();
        }
    }

    startMusic() {
        const scene = this.scene;
        if (!scene) return;

        try {
            // Check if audio context is suspended
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                console.log('🔇 AudioContext suspended - attempting to create/play music anyway (will wait for resume)');
                // Don't return, let it try to create the sound object so it's ready when resumed
            }

            // Check if music exists but stopped
            if (this.bgMusic) {
                if (!this.bgMusic.isPlaying) {
                    this.bgMusic.play();
                }
                return;
            }

            if (scene.sound && scene.cache.audio.exists(ASSETS.BG_MUSIC) && !this.bgMusic) {
                console.log('🎵 AudioManager: Creating new background music instance');
                this.bgMusic = scene.sound.add(ASSETS.BG_MUSIC, { loop: true, volume: 0.80 });

                // Try to play silently
                try {
                    const playPromise = this.bgMusic.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch((e) => {
                            console.warn('⚠️ Background music autoplay prevented by browser policy. Waiting for interaction.', e);
                        });
                    }
                } catch (e) {
                    console.warn('⚠️ Background music play failed:', e);
                }
            }
        } catch (error) {
            console.error('❌ AudioManager: startMusic fatal error:', error);
        }
    }


    toggleSound(data) {
        if (!this.scene) return;

        let newState;
        if (data && typeof data.enabled === 'boolean') {
            newState = data.enabled;
        } else {
            const currentState = this.scene.registry.get('soundEnabled') !== false;
            newState = !currentState;
        }

        this.scene.registry.set('soundEnabled', newState);
        this.scene.sound.mute = !newState;
        this.soundEnabled = newState;

        // Force restart music if enabling sound
        if (this.soundEnabled) {
            this.startMusic();
        }

        // Update button text and icon if they exist (in pause menu)
        if (this.scene.soundToggleText) {
            this.scene.soundToggleText.setText(newState ? 'SOUND: ON' : 'SOUND: OFF');
            this.scene.soundToggleIcon.setFrame(newState ? 'volume-up' : 'volume-mute');
        }
        // For Settings scene
        if (this.scene.soundText) {
            this.scene.soundText.setText(newState ? 'SOUND: ON' : 'SOUND: OFF');
            this.scene.soundIcon.setFrame(newState ? 'volume-up' : 'volume-mute');
        }

        // Log for debugging
        console.log('Sound toggled:', newState ? 'ON' : 'OFF');
    }

    updateAudio(playerY, riserY) {
        const scene = this.scene;
        if (!scene) return;

        let distanceToRiser = playerY - riserY;

        // Update Riser Sound
        if (this.riserAmbientSound && this.riserAmbientSound.isPlaying) {
            const cameraBottom = scene.cameras.main.scrollY + scene.cameras.main.height;
            const riserVisible = riserY < cameraBottom + 200;

            let riserTargetVolume = 0;
            if (riserVisible) {
                if (distanceToRiser < 100) {
                    riserTargetVolume = 0.55; // Reduced from 0.85 for more subtle sound
                } else if (distanceToRiser < 200) {
                    riserTargetVolume = 0.55 * (1 - (distanceToRiser - 100) / 100); // Reduced from 0.85
                }
            }
            const currentRiserVolume = this.riserAmbientSound.volume;
            const newRiserVolume = Phaser.Math.Linear(currentRiserVolume, riserTargetVolume, 0.05);
            this.riserAmbientSound.setVolume(newRiserVolume);
        }

        // Update Music Ducking
        if (this.bgMusic && this.bgMusic.isPlaying) {
            let musicVolume = 0.80;
            if (distanceToRiser < 100) {
                musicVolume = 0.50;
            } else if (distanceToRiser < 200) {
                const fadeRatio = (distanceToRiser - 100) / 100;
                musicVolume = 0.50 + (fadeRatio * 0.30);
            }
            this.bgMusic.setVolume(musicVolume);
        }
    }

    /**
     * Play jump sound with random pitch variation
     */
    playJumpSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.JUMP_SFX)) {
                const randomDetune = Phaser.Math.Between(-300, 300);
                scene.sound.play(ASSETS.JUMP_SFX, { detune: randomDetune, volume: 0.15 });
            }
        } catch (error) {
            console.warn('Error playing jump sound:', error);
        }
    }

    /**
     * Play shoe-brake with slight random pitch to keep it fresh
     */
    playShoeBrake() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.SHOE_BRAKE)) {
                // Stop any existing instance to avoid overlap
                this.stopShoeBrake();
                const detune = Phaser.Math.Between(-500, 500);
                const rate = Phaser.Math.FloatBetween(1.15, 1.35); // faster, snappier
                const pan = Phaser.Math.FloatBetween(-0.1, 0.1);
                this.shoeBrakeInstance = scene.sound.add(ASSETS.SHOE_BRAKE, {
                    detune,
                    rate,
                    pan,
                    volume: 0.28
                });
                this.shoeBrakeInstance.once('complete', () => {
                    this.shoeBrakeInstance?.destroy();
                    this.shoeBrakeInstance = null;
                });
                this.shoeBrakeInstance.play();
            }
        } catch (error) {
            console.warn('Error playing shoe brake sound:', error);
        }
    }

    stopShoeBrake() {
        if (this.shoeBrakeInstance) {
            this.shoeBrakeInstance.stop();
            this.shoeBrakeInstance.destroy();
            this.shoeBrakeInstance = null;
        }
    }

    /**
     * Play coin collection sound with random variation
     */
    playCoinSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            const soundKeys = [
                ASSETS.COIN_SFX_PREFIX + '1',
                ASSETS.COIN_SFX_PREFIX + '2',
                ASSETS.COIN_SFX_PREFIX + '3'
            ];
            const randomKey = Phaser.Utils.Array.GetRandom(soundKeys);
            if (scene.sound && scene.cache.audio.exists(randomKey)) {
                const randomDetune = Phaser.Math.Between(-200, 200);
                scene.sound.play(randomKey, { detune: randomDetune, volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing coin sound:', error);
        }
    }

    /**
     * Play damage sound with random variation
     */
    playDamageSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            const damageKeys = [
                ASSETS.DAMAGE_SFX_PREFIX + '1',
                ASSETS.DAMAGE_SFX_PREFIX + '2',
                ASSETS.DAMAGE_SFX_PREFIX + '3',
                ASSETS.DAMAGE_SFX_PREFIX + '4',
                ASSETS.DAMAGE_SFX_PREFIX + '5'
            ];
            const randomKey = Phaser.Utils.Array.GetRandom(damageKeys);
            if (scene.sound && scene.cache.audio.exists(randomKey)) {
                scene.sound.play(randomKey, { volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing damage sound:', error);
        }
    }

    /**
     * Play destroy sound (enemy destroyed by invincible player)
     */
    playDestroySound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.DESTROY_SFX)) {
                scene.sound.play(ASSETS.DESTROY_SFX, { volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing destroy sound:', error);
        }
    }

    /**
     * Play celebration sound
     */
    playCelebrationSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.CELEBRATION_SFX)) {
                scene.sound.play(ASSETS.CELEBRATION_SFX, { volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing celebration sound:', error);
        }
    }

    /**
     * Play trashcan hit sound with random pitch
     */
    playTrashcanHit() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.TRASHCAN_HIT)) {
                const randomDetune = Phaser.Math.Between(-300, 300);
                scene.sound.play(ASSETS.TRASHCAN_HIT, { detune: randomDetune, volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing trashcan sound:', error);
        }
    }

    /**
     * Play tire bounce sound with random pitch
     */
    playTireBounce() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.TIRE_BOUNCE)) {
                const randomDetune = Phaser.Math.Between(-200, 200);
                scene.sound.play(ASSETS.TIRE_BOUNCE, { detune: randomDetune, volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing tire sound:', error);
        }
    }

    /**
     * Play wall slide sound (looping)
     */
    playWallSlide() {
        if (this.wallSlideSound && !this.wallSlideSound.isPlaying) {
            // console.log('🔊 AudioManager: Playing wall slide sound');
            this.wallSlideSound.play();
        } else if (!this.wallSlideSound) {
            // console.warn('⚠️ AudioManager: Cannot play wall slide, sound instance is null');
        }
    }

    /**
     * Stop wall slide sound
     */
    stopWallSlide() {
        if (this.wallSlideSound && this.wallSlideSound.isPlaying) {
            this.wallSlideSound.stop();
        }
    }

    /**
     * Play the specific drop sound for the current riser type
     * @param {string} soundKey - The key of the drop audio asset
     */
    playRiserDrop(soundKey) {
        const scene = this.scene;
        if (!scene || !soundKey) return;
        try {
            if (scene.sound && scene.cache.audio.exists(soundKey)) {
                // Reduced volume by ~15% (from 0.7 to 0.6)
                scene.sound.play(soundKey, { volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing riser drop sound:', error);
        }
    }
}

// Export singleton instance
// Export singleton instance
export default new AudioSystem();
