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
            // Prefer devolver al pool para no reciclar objetos destruidos
            const pools = [
                scene.patrolEnemyPool,
                scene.shooterEnemyPool,
                scene.jumperShooterEnemyPool,
            ];
            const pooled = pools.find(pool => pool && pool.active?.includes(enemy));
            if (pooled) {
                pooled.despawn(enemy);
            } else if (enemy.despawn) {
                enemy.despawn();
            } else {
                enemy.destroy();
            }

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
