import { handlePlatformRiderCollision, updatePlatformRider } from '../../utils/platformRider.js';
import EventBus, { Events } from '../../core/EventBus.js';

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
        if (!coin || !coin.active) return;
        if (coin.getData && coin.getData('ignoreCollection')) return;

        // Deshabilitar colisión de inmediato para evitar múltiples triggers en el mismo coin
        if (coin.body) {
            coin.body.setEnable(false);
        }
        coin.setActive(false);
        coin.setVisible(false);

        if (scene.coinPool) {
            scene.coinPool.despawn(coin);
        } else {
            coin.destroy();
        }
        scene.totalScore += 1;

        // Update score UI - delegate to UIManager
        if (scene.uiManager) {
            scene.uiManager.updateScore(scene.totalScore);
        }

        let t = scene.add.text(player.x, player.y - 30, '+1', { fontSize: '18px', fontStyle: 'bold', color: '#ffff00' }).setDepth(101);
        scene.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 600, onComplete: () => t.destroy() });

        // Emit coin collected event
        EventBus.emit(Events.COIN_COLLECTED);

        let strScore = scene.totalScore.toString();
        if (strScore === '67' || strScore.endsWith('67')) {
            scene.trigger67Celebration();
        }
    }

    collectPowerup(player, powerup) {
        const scene = this.scene;
        if (!powerup || !powerup.active) return;
        if (powerup.getData && powerup.getData('ignoreCollection')) return;

        // Deshabilitar colisión de inmediato para evitar múltiples triggers
        if (powerup.body) {
            powerup.body.setEnable(false);
        }
        powerup.setActive(false);
        powerup.setVisible(false);

        if (scene.powerupPool) {
            scene.powerupPool.despawn(powerup);
        } else {
            powerup.destroy();
        }
        scene.isPausedEvent = true;
        scene.physics.pause();
        // Asegurar que el jugador se vea (sin animación de reemplazo)
        player.setVisible(true);
        // Animación de powerup en el player
        if (player.controller?.anim) {
            // Asegurar que la anim de powerup no se espejea (frames contienen números)
            player.setFlipX(false);
            player.controller.anim.play('player_powerup');
        }

        // Emit powerup collected event (which might play sound)
        EventBus.emit(Events.POWERUP_COLLECTED);

        let t = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.scrollY + 200, 'POWERUP 67', {
            fontSize: '32px', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);

        scene.cameras.main.shake(500, 0.005);
        // Mantener pausa el tiempo suficiente para que la anim de powerup (≈1.8s) termine
        scene.time.delayedCall(2000, () => {
            t.destroy();
            scene.physics.resume();
            scene.isPausedEvent = false;
            if (player && player.activateInvincibility) {
                player.activateInvincibility();
            } else if (scene.activateInvincibility) { // Fallback if player method missing (should not happen)
                scene.activateInvincibility();
            }
        });
    }
}
