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
        scene.scoreText.setText('SCORE: ' + scene.totalScore);
        let t = scene.add.text(player.x, player.y - 30, '+1', { fontSize: '18px', fontStyle: 'bold', color: '#ffff00' }).setDepth(101);
        scene.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 600, onComplete: () => t.destroy() });

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

        try {
            if (scene.sound && scene.cache.audio.exists('celebration_sfx')) {
                scene.sound.play('celebration_sfx', { volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing celebration sound:', error);
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
