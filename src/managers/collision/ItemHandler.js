import { handlePlatformRiderCollision, updatePlatformRider } from '../../utils/platformRider.js';

export class ItemHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handleItemPlatformCollision(item, platform) {
        // Use platformRider to keep items on moving platforms
        handlePlatformRiderCollision(item, platform);
    }

    collectCoin(player, coin) {
        const scene = this.scene;
        coin.destroy();
        scene.totalScore += 1;
        
        // Update score UI - delegate to UIManager
        if (scene.uiManager) {
            scene.uiManager.updateScore(scene.totalScore);
        }
        
        let t = scene.add.text(player.x, player.y - 30, '+1', { fontSize: '18px', fontStyle: 'bold', color: '#ffff00' }).setDepth(101);
        scene.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 600, onComplete: () => t.destroy() });

        // Play coin sound - delegate to AudioManager
        if (scene.audioManager) {
            scene.audioManager.playCoinSound();
        }

        let strScore = scene.totalScore.toString();
        if (strScore === '67' || strScore.endsWith('67')) {
            scene.trigger67Celebration();
        }
    }

    collectPowerup(player, powerup) {
        const scene = this.scene;
        powerup.destroy();
        scene.isPausedEvent = true;
        scene.physics.pause();
        player.setTint(0xffff00);
        scene.auraEmitter.start();

        // Play celebration sound - delegate to AudioManager
        if (scene.audioManager) {
            scene.audioManager.playCelebrationSound();
        }

        let t = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.scrollY + 200, 'POWERUP 67', {
            fontSize: '40px', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(200);

        scene.cameras.main.shake(500, 0.005);
        scene.time.delayedCall(2000, () => {
            t.destroy();
            scene.physics.resume();
            scene.isPausedEvent = false;
            scene.activateInvincibility();
        });
    }
}
