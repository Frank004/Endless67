export class NotificationsUI {
    constructor(scene) {
        this.scene = scene;
    }

    trigger67Celebration() {
        const scene = this.scene;
        try {
            // Use a temporary pause flag for this special event
            scene.isPausedEvent = true;
            // Pause physics temporarily (this is a special case, not regular pause)
            scene.physics.pause();
            scene.cameras.main.flash(500, 255, 255, 255);

            if (scene.confettiEmitter) {
                scene.confettiEmitter.setPosition(scene.cameras.main.centerX, scene.cameras.main.scrollY - 50);
                scene.confettiEmitter.explode(80);
            }

            // Play celebration sound - delegate to AudioManager
            if (scene.audioManager) {
                scene.audioManager.playCelebrationSound();
            }

            let t = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.scrollY + 300, '67!', {
                fontFamily: '"Courier New", monospace', fontSize: '100px', color: '#ffd700', fontStyle: 'bold', stroke: '#8B4500', strokeThickness: 10,
                shadow: { offsetX: 6, offsetY: 6, color: '#000000', blur: 0, stroke: true, fill: true }
            }).setOrigin(0.5).setDepth(200);

            scene.tweens.add({ targets: t, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });

            scene.time.delayedCall(1500, () => {
                if (t && t.destroy) t.destroy();
                scene.physics.resume();
                scene.isPausedEvent = false;
            });
        } catch (e) {
            console.error('Error in trigger67Celebration:', e);
            scene.physics.resume();
            scene.isPausedEvent = false;
        }
    }
}
