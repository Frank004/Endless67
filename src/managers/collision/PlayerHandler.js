import ScoreManager from '../ScoreManager.js';
import AudioManager from '../AudioManager.js';

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

    touchRiser(player, riser) {
        const scene = this.scene;
        if (scene.isGameOver) return;
        if (scene.isInvincible) {
            scene.deactivatePowerup();
            if (scene.powerupTimer) scene.powerupTimer.remove();
            player.setVelocityY(-900);

            // Get riser configuration for display name and color
            const riserConfig = scene.riserManager.config;
            const jumpText = `${riserConfig.displayName} JUMP!`;
            const textColor = riserConfig.color;

            let t = scene.uiText.scene.add.text(
                player.x,
                player.y - 50,
                jumpText,
                {
                    fontSize: '18px',
                    color: '#fff',
                    stroke: textColor,
                    strokeThickness: 4
                }
            ).setOrigin(0.5).setDepth(100);

            scene.tweens.add({
                targets: t,
                y: player.y - 150,
                alpha: 0,
                duration: 1000,
                onComplete: () => t.destroy()
            });
            return;
        }

        // Play riser drop sound
        AudioManager.playLavaDropSound();

        scene.isGameOver = true;
        scene.burnEmitter.emitParticleAt(player.x, player.y, 50);
        player.setVelocity(0, 0);
        player.setTint(0x000000);
        scene.time.delayedCall(300, () => {
            player.setVisible(false);
            player.setActive(false);
        });

        scene.time.delayedCall(50, () => {
            scene.riserManager.triggerRising();
        });

        scene.physics.pause();
        scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}`);
        scene.uiText.setVisible(true);
        scene.uiText.setDepth(200);
        scene.scoreText.setDepth(200);

        scene.time.delayedCall(1000, () => {
            // Check for high score - only show name input if score qualifies for top 10
            if (ScoreManager.isHighScore(scene.currentHeight, scene.totalScore)) {
                // Show Input for Name - this score will enter the leaderboard
                scene.uiManager.showNameInput(ScoreManager);
            } else {
                // Score doesn't qualify for top 10 - show options directly
                scene.uiManager.showPostGameOptions();
            }
        });
    }
}
