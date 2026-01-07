import { handlePlatformRiderCollision } from '../../utils/platformRider.js';
import EventBus, { Events } from '../../core/EventBus.js';

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
        const controller = player?.controller;
        const ctx = controller?.context;
        // Pequeño cooldown para evitar múltiples golpes encadenados
        if (ctx?.hitTimer > 0 || ctx?.flags?.hit) {
            return;
        }
        if (scene.isInvincible || player.isInvincible) {
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

            if (scene.particleManager) {
                scene.particleManager.emitSpark(enemy.x, enemy.y);
            }

            // Emit destroy event
            EventBus.emit(Events.ENEMY_DESTROYED);
            return;
        }

        // Emit damage event
        EventBus.emit(Events.PLAYER_HIT);

        player.setTint(0xff0000);
        scene.cameras.main.shake(100, 0.01);
        scene.time.delayedCall(200, () => player.clearTint());
        const playerVX = player.body?.velocity?.x || 0;
        const dir = playerVX >= 0 ? -1 : 1;
        const knockbackX = dir * Phaser.Math.Between(520, 620);
        const knockbackY = 520;
        player.setVelocity(knockbackX, knockbackY);
        // Activar breve estado de golpe
        controller?.enterHit?.(300);
    }
}
