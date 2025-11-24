export class PlayerHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handlePlatformCollision(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            player.handleLand(platform);
        }

        // Fix: If moving platform hits player horizontally, reverse platform to avoid crushing player
        if (platform.getData('isMoving')) {
            if ((player.body.touching.left && platform.body.touching.right) ||
                (player.body.touching.right && platform.body.touching.left)) {

                const currentVel = platform.body.velocity.x;
                // Only reverse if moving towards the player
                if ((player.body.touching.left && currentVel > 0) ||
                    (player.body.touching.right && currentVel < 0)) {
                    platform.setVelocityX(-currentVel);
                }
            }
        }
    }

    handleLand(player, floor) {
        player.handleLand(floor);
    }

    handleWallTouch(player, wall, side) {
        player.handleWallTouch(side);
    }

    touchLava(player, lava) {
        const scene = this.scene;
        if (scene.isGameOver) return;
        if (scene.isInvincible) {
            scene.deactivatePowerup();
            if (scene.powerupTimer) scene.powerupTimer.remove();
            player.setVelocityY(-900);
            let t = scene.uiText.scene.add.text(player.x, player.y - 50, 'LAVA JUMP!', { fontSize: '18px', color: '#fff', stroke: '#f00', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);
            scene.tweens.add({ targets: t, y: player.y - 150, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
            return;
        }

        try {
            if (scene.sound && scene.cache.audio.exists('lava_drop')) {
                scene.sound.play('lava_drop', { volume: 0.7 });
            }
        } catch (error) {
            console.warn('Error playing lava drop sound:', error);
        }

        scene.isGameOver = true;
        scene.burnEmitter.emitParticleAt(player.x, player.y, 50);
        player.setVelocity(0, 0);
        player.setTint(0x000000);
        scene.time.delayedCall(300, () => {
            player.setVisible(false);
            player.setActive(false);
        });

        scene.time.delayedCall(50, () => {
            scene.lavaManager.triggerRising();
        });

        scene.physics.pause();
        scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}\nTap or Space to Restart`);
        scene.uiText.setVisible(true);
        scene.uiText.setDepth(200);
        scene.scoreText.setDepth(200);

        scene.time.delayedCall(1000, () => {
            const restartFn = () => {
                scene.spaceKey.off('down', restartFn);
                scene.scene.restart();
            };
            scene.input.once('pointerdown', restartFn);
            scene.spaceKey.once('down', restartFn);
        });
    }
}
