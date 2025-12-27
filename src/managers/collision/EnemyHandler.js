import { handlePlatformRiderCollision } from '../../utils/platformRider.js';
import AudioManager from '../AudioManager.js';

export class EnemyHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handleEnemyPlatformCollision(enemy, platform) {
        // Use the platform rider system
        handlePlatformRiderCollision(enemy, platform);
    }

    hitEnemy(player, enemy) {
        const scene = this.scene;
        if (scene.isInvincible) {
            enemy.destroy();
            scene.sparkEmitter.emitParticleAt(enemy.x, enemy.y, 20);

            // Play destroy sound
            AudioManager.playDestroySound();
            return;
        }

        // Play damage sound
        AudioManager.playDamageSound();

        player.setTint(0xff0000);
        scene.cameras.main.shake(100, 0.01);
        scene.time.delayedCall(200, () => player.clearTint());
        const kickX = Phaser.Math.Between(-300, 300);
        player.setVelocity(kickX, 300);
    }
}
