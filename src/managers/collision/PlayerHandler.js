import ScoreManager from '../gameplay/ScoreManager.js';
import AudioManager from '../audio/AudioManager.js';

export class PlayerHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handlePlatformCollision(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            // FSM/Context maneja el aterrizaje; sólo actualizamos plataforma y reseteos básicos
            if (player.setCurrentPlatform) {
                player.setCurrentPlatform(platform);
            }
            const ctx = player.controller?.context;
            if (ctx) {
                ctx.coyoteTimer = ctx.COYOTE_TIME;
                ctx.resetForLand();
                ctx.wallTouchSide = null;
                ctx.wallTouchCount = 0;
            }
            // Alinear posición si el cuerpo quedó dentro del top de la plataforma (seguridad)
            const bodyBottom = player.body.y + player.body.height;
            const platformTop = platform.body.y;
            if (bodyBottom > platformTop) {
                const diff = bodyBottom - platformTop;
                player.y -= diff;
                if (player.body) player.body.updateFromGameObject();
            }
        }

        // Fix: If moving platform hits player horizontally, reverse platform to avoid crushing player
        if (platform.getData('isMoving') && platform.body) {
            if ((player.body.touching.left && platform.body.touching.right) ||
                (player.body.touching.right && platform.body.touching.left)) {

                const currentVel = platform.body.velocity.x;
                // Only reverse if moving towards the player
                if ((player.body.touching.left && currentVel > 0) ||
                    (player.body.touching.right && currentVel < 0)) {
                    // TileSprite no tiene setVelocityX, usar body.velocity.x directamente
                    if (platform.body) {
                        platform.body.velocity.x = -currentVel;
                        // Actualizar dirección en data para que preUpdate() lo mantenga
                        const newDirection = -currentVel > 0 ? 1 : -1;
                        platform.setData('direction', newDirection);
                    }
                }
            }
        }
    }

    handleLand(player, floor) {
        // Solo considerar aterrizaje cuando el jugador toca con los pies y el piso con su lado superior
        if (!player.body?.touching?.down || !floor?.body?.touching?.up) {
            return;
        }
        if (player.setCurrentPlatform) {
            player.setCurrentPlatform(floor);
        }
        const ctx = player.controller?.context;
        if (ctx) {
            ctx.coyoteTimer = ctx.COYOTE_TIME;
            ctx.resetForLand();
            ctx.wallTouchSide = null;
            ctx.wallTouchCount = 0;
        }
    }

    handleWallTouch(player, wall, side) {
        const ctx = player.controller?.context;
        if (ctx) {
            ctx.wallTouchSide = side;
            ctx.wallTouchCount = Math.min(ctx.wallTouchCount + 1, ctx.maxWallTouches);
            ctx.prevTouchWall = true;
            ctx.prevTouchWallSide = side;
        }
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

        // No invencible: entrar a estado de muerte en FSM y luego ejecutar flujo de game over
        player.enterDeathState?.();
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
