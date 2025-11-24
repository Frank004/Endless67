import { handlePlatformRiderCollision } from '../../utils/platformRider.js';

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

            try {
                if (scene.sound && scene.cache.audio.exists('destroy_sfx')) {
                    scene.sound.play('destroy_sfx', { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Error playing destroy sound:', error);
            }
            return;
        }

        try {
            const damageKeys = ['damage_sfx_1', 'damage_sfx_2', 'damage_sfx_3', 'damage_sfx_4', 'damage_sfx_5'];
            const randomKey = Phaser.Utils.Array.GetRandom(damageKeys);
            if (scene.sound && scene.cache.audio.exists(randomKey)) {
                scene.sound.play(randomKey, { volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing damage sound:', error);
        }

        player.setTint(0xff0000);
        scene.cameras.main.shake(100, 0.01);
        scene.time.delayedCall(200, () => player.clearTint());
        const kickX = Phaser.Math.Between(-300, 300);
        player.setVelocity(kickX, 300);
    }
}
