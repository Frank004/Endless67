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

    setupAudio() {
        const scene = this.scene;
        if (!scene) return;

        // Silently handle audio context issues
        try {
            // Check if audio context is suspended
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                // Don't try to play audio if context is suspended
                // It will be resumed on next user interaction via setupAudioContextResume
                return;
            }

            if (scene.sound && scene.cache.audio.exists('lava_ambient')) {
                // Stop any existing lava sound to prevent duplicates
                if (this.lavaSound) {
                    this.lavaSound.stop();
                }

                this.lavaSound = scene.sound.add('lava_ambient', { loop: true, volume: 0 });

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

            if (scene.sound && scene.cache.audio.exists('bg_music') && !this.bgMusic) {
                this.bgMusic = scene.sound.add('bg_music', { loop: true, volume: 0.80 });

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
            if (scene.sound && scene.cache.audio.exists('jump_sfx')) {
                const randomDetune = Phaser.Math.Between(-300, 300);
                scene.sound.play('jump_sfx', { detune: randomDetune, volume: 0.15 });
            }
        } catch (error) {
            console.warn('Error playing jump sound:', error);
        }
    }

    /**
     * Play coin collection sound with random variation
     */
    playCoinSound() {
        const scene = this.scene;
        if (!scene) return;
        try {
            const soundKeys = ['coin_sfx_1', 'coin_sfx_2', 'coin_sfx_3'];
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
            const damageKeys = ['damage_sfx_1', 'damage_sfx_2', 'damage_sfx_3', 'damage_sfx_4', 'damage_sfx_5'];
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
            if (scene.sound && scene.cache.audio.exists('destroy_sfx')) {
                scene.sound.play('destroy_sfx', { volume: 0.5 });
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
            if (scene.sound && scene.cache.audio.exists('celebration_sfx')) {
                scene.sound.play('celebration_sfx', { volume: 0.6 });
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
            if (scene.sound && scene.cache.audio.exists('lava_drop')) {
                scene.sound.play('lava_drop', { volume: 0.7 });
            }
        } catch (error) {
            console.warn('Error playing lava drop sound:', error);
        }
    }
}

// Export singleton instance
export default new AudioManager();
