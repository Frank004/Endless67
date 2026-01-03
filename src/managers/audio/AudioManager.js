import EventBus, { Events } from '../../core/EventBus.js';
import { ASSETS } from '../../config/AssetKeys.js';

export class AudioManager {
    static instance = null;

    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        AudioManager.instance = this;

        this.scene = null;
        this.bgMusic = null;
        this.lavaSound = null;
        this.soundEnabled = true;
        this.shoeBrakeInstance = null;
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

        // Resume audio context when user interacts with the page
        const resumeAudio = () => {
            if (scene.sound && scene.sound.context) {
                scene.sound.context.resume().catch(err => {
                    console.warn('Could not resume audio context:', err);
                });
            }
        };

        // Listen for user interactions
        scene.input.on('pointerdown', resumeAudio, this);
        // Nota: el listener de visibilitychange ahora se maneja en Game y se limpia en shutdown
    }

    setupEventListeners() {
        // Audio Triggers via EventBus
        EventBus.on(Events.PLAYER_JUMPED, this.playJumpSound, this);
        EventBus.on(Events.COIN_COLLECTED, this.playCoinSound, this);
        EventBus.on(Events.SOUND_TOGGLED, this.toggleSound, this);
        EventBus.on(Events.PLAYER_HIT, this.playDamageSound, this);
        EventBus.on(Events.POWERUP_COLLECTED, this.playCelebrationSound, this);
        EventBus.on(Events.ENEMY_DESTROYED, this.playDestroySound, this);
        // Add more listeners as needed
    }

    removeEventListeners() {
        EventBus.off(Events.PLAYER_JUMPED, this.playJumpSound, this);
        EventBus.off(Events.COIN_COLLECTED, this.playCoinSound, this);
        EventBus.off(Events.SOUND_TOGGLED, this.toggleSound, this);
        EventBus.off(Events.PLAYER_HIT, this.playDamageSound, this);
        EventBus.off(Events.POWERUP_COLLECTED, this.playCelebrationSound, this);
        EventBus.off(Events.ENEMY_DESTROYED, this.playDestroySound, this);
    }

    setupAudio() {
        const scene = this.scene;
        if (!scene) return;

        this.setupEventListeners();

        // Silently handle audio context issues
        try {
            // Check if audio context is suspended
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                // Don't try to play audio if context is suspended
                // It will be resumed on next user interaction via setupAudioContextResume
                return;
            }

            if (scene.sound && scene.cache.audio.exists(ASSETS.LAVA_AMBIENT)) {
                // Stop any existing lava sound to prevent duplicates
                if (this.lavaSound) {
                    this.lavaSound.stop();
                }

                this.lavaSound = scene.sound.add(ASSETS.LAVA_AMBIENT, { loop: true, volume: 0 });

                // Try to play silently - don't show errors to user
                try {
                    const playPromise = this.lavaSound.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {
                            // Silently fail - audio will resume on next interaction
                        });
                    }
                } catch (e) {
                    // Silently fail
                }
            }

            // Ensure audio stops when scene shuts down (e.g. on restart)
            scene.events.once('shutdown', this.stopAudio, this);
        } catch (error) {
            // Silently handle any audio errors - don't show to user
        }
    }

    stopAudio() {
        this.removeEventListeners();
        if (this.lavaSound) {
            this.lavaSound.stop();
            this.lavaSound = null;
        }
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic = null;
        }
    }

    startMusic() {
        const scene = this.scene;
        if (!scene) return;

        try {
            // Check if audio context is suspended
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                // Don't try to play if suspended - will resume on interaction
                return;
            }

            if (scene.sound && scene.cache.audio.exists(ASSETS.BG_MUSIC) && !this.bgMusic) {
                this.bgMusic = scene.sound.add(ASSETS.BG_MUSIC, { loop: true, volume: 0.80 });

                // Try to play silently
                try {
                    const playPromise = this.bgMusic.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {
                            // Silently fail - will resume on interaction
                        });
                    }
                } catch (e) {
                    // Silently fail
                }
            }
        } catch (error) {
            // Silently handle errors
        }
    }


    toggleSound() {
        if (!this.scene) return;

        const currentState = this.scene.registry.get('soundEnabled') !== false;
        const newState = !currentState;
        this.scene.registry.set('soundEnabled', newState);
        this.scene.sound.mute = !newState;
        this.soundEnabled = newState;

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

    updateAudio(playerY, lavaY) {
        const scene = this.scene;
        if (!scene) return;

        let distanceToLava = playerY - lavaY;

        // Update Lava Sound
        if (this.lavaSound && this.lavaSound.isPlaying) {
            const cameraBottom = scene.cameras.main.scrollY + scene.cameras.main.height;
            const lavaVisible = lavaY < cameraBottom + 200;

            let lavaTargetVolume = 0;
            if (lavaVisible) {
                if (distanceToLava < 100) {
                    lavaTargetVolume = 1.0;
                } else if (distanceToLava < 200) {
                    lavaTargetVolume = 1.0 * (1 - (distanceToLava - 100) / 100);
                }
            }
            const currentLavaVolume = this.lavaSound.volume;
            const newLavaVolume = Phaser.Math.Linear(currentLavaVolume, lavaTargetVolume, 0.05);
            this.lavaSound.setVolume(newLavaVolume);
        }

        // Update Music Ducking
        if (this.bgMusic && this.bgMusic.isPlaying) {
            let musicVolume = 0.80;
            if (distanceToLava < 100) {
                musicVolume = 0.50;
            } else if (distanceToLava < 200) {
                const fadeRatio = (distanceToLava - 100) / 100;
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
     * Play lava drop sound (player touches lava)
     */
    playLavaDropSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            if (scene.sound && scene.cache.audio.exists(ASSETS.LAVA_DROP)) {
                scene.sound.play(ASSETS.LAVA_DROP, { volume: 0.7 });
            }
        } catch (error) {
            console.warn('Error playing lava drop sound:', error);
        }
    }
}

// Export singleton instance
export default new AudioManager();
