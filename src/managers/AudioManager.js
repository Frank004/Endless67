export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.soundEnabled = !scene.sound.mute;
        this.bgMusic = null;
        this.lavaSound = null;
    }

    setupAudio() {
        const scene = this.scene;
        try {
            if (scene.sound && scene.cache.audio.exists('lava_ambient')) {
                // Stop any existing lava sound to prevent duplicates
                if (this.lavaSound) {
                    this.lavaSound.stop();
                }
                this.lavaSound = scene.sound.add('lava_ambient', { loop: true, volume: 0 });
                this.lavaSound.play();
            }

            // Ensure audio stops when scene shuts down (e.g. on restart)
            scene.events.once('shutdown', this.stopAudio, this);
        } catch (error) {
            console.warn('Error starting lava sound:', error);
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
        try {
            if (scene.sound && scene.cache.audio.exists('bg_music') && !this.bgMusic) {
                this.bgMusic = scene.sound.add('bg_music', { loop: true, volume: 0.80 });
                this.bgMusic.play();
            }
        } catch (error) {
            console.warn('Error starting background music:', error);
        }
    }

    toggleSound() {
        const scene = this.scene;
        this.soundEnabled = !this.soundEnabled;
        scene.sound.mute = !this.soundEnabled;

        // Update UI if button exists (accessing via scene reference or UIManager if possible, 
        // but UIManager manages the button text. Ideally UIManager should listen to this state or we update it here)
        // For simplicity, let's update the button text here if it exists in the scene
        if (scene.soundToggleButton) {
            scene.soundToggleButton.setText(this.soundEnabled ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF');
        }
    }

    updateAudio(playerY, lavaY) {
        const scene = this.scene;
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
}
