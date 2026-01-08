import GameState from '../../core/GameState.js';
import ScoreManager from '../gameplay/ScoreManager.js';
import AudioManager from '../audio/AudioManager.js';
import { PLAYER_CONFIG } from '../../config/PlayerConfig.js';
import { launchItem } from '../../utils/physicsUtils.js';

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
        // CRÍTICO: No matar al jugador si el juego no ha comenzado
        if (!scene.gameStarted) return;
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

        // NOTIFICAR AL ESTADO GLOBAL PARA PARAR AUDIO Y BLOQUEAR PAUSA
        // NOTIFICAR AL ESTADO GLOBAL PARA PARAR AUDIO Y BLOQUEAR PAUSA
        GameState.gameOver();

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

        // Note: High score check and UI display is now handled by UIManager
        // through the GAME_OVER event (see UIManager.setupEventListeners)
        // This prevents duplicate calls to showNameInput()
    }

    /**
     * Handles collision with trashcan prop
     * Plays animation once, applies knockback, then disables collision
     */
    handleTrashcanCollision(player, trashcan) {
        const scene = this.scene;

        // Check if collision is still enabled
        if (trashcan.isCollisionEnabled && !trashcan.isCollisionEnabled()) {
            return;
        }
        if (trashcan.getData && !trashcan.getData('collisionEnabled')) {
            return;
        }

        // Disable collision immediately to prevent multiple triggers
        if (trashcan.enableCollision) {
            trashcan.enableCollision(false);
        } else {
            trashcan.setData('collisionEnabled', false);
        }

        // Increase depth to ensure trashcan stays above player during and after animation
        trashcan.setDepth(25); // Above player (depth 20)

        // Play animation once
        if (trashcan.playHit) {
            trashcan.playHit();
        } else if (scene.anims.exists('trashcan_hit')) {
            trashcan.play('trashcan_hit');
        }

        // Play SFX
        AudioManager.playTrashcanHit();

        // --- NEW LOGIC: Spawn Bouncing Item (Coin or Powerup) ---
        // Fix offset: Trashcan appears to offset coin to the right, adjusting spawnX left by 25px
        const spawnX = trashcan.x - 25;
        const spawnY = trashcan.y - 35; // Slightly higher to ensure it clears the can lid

        // 5% Chance for Powerup, 95% for Coin
        let item;
        let group;

        if (Math.random() < 0.05) {
            // Spawn Powerup
            item = scene.powerupPool.spawn(spawnX, spawnY);
            group = scene.powerups;
        } else {
            // Spawn Coin
            item = scene.coinPool.spawn(spawnX, spawnY);
            group = scene.coins;
        }

        if (item) {
            // Add to group IMMEDIATELY so physics/gravity works from start
            if (group && !group.contains(item)) {
                group.add(item, true);
            }

            // Set flag to ignore pickup initially (so animation can be seen)
            item.setData('ignoreCollection', true);

            // Launch item
            const obstacles = [scene.stageFloor, scene.leftWall, scene.rightWall];

            // SMART TARGETING: If player is standing on/near the trashcan, Launch towards center of screen
            // to avoid shooting the item into a nearby wall.
            let targetX = player.x;
            if (Math.abs(player.x - trashcan.x) < 50) {
                targetX = scene.scale.width / 2;
            }

            launchItem(scene, item, targetX, obstacles);

            // Enable pickup after delay
            scene.time.delayedCall(600, () => {
                if (item.active) {
                    item.setData('ignoreCollection', false);
                }
            });
        }

        // Apply knockback to player
        const playerVX = player.body?.velocity?.x || 0;
        const dir = playerVX >= 0 ? -1 : 1; // Knockback opposite to player direction
        const knockbackX = dir * Phaser.Math.Between(600, 700); // Stronger horizontal push
        const knockbackY = -250; // Lower vertical kick (more horizontal trajectory)
        player.setVelocity(knockbackX, knockbackY);

        // Enter hit state briefly
        const controller = player?.controller;
        if (controller?.enterHit) {
            controller.enterHit(200);
        }

        // Visual feedback
        player.setTint(0xff8800);
        scene.time.delayedCall(200, () => player.clearTint());
        scene.cameras.main.shake(100, 0.01);
    }

    /**
     * Bounce when landing on tires
     */
    handleTireBounce(player, tires) {
        const scene = this.scene;
        const now = scene.time.now;
        if (tires.canBounce && !tires.canBounce(now)) {
            return;
        }

        if (!player.body) {
            return;
        }

        // Snap player to top of tires before bounce
        if (tires.body && player.body) {
            const playerHalfHeight = player.body.height / 2;
            const targetY = tires.body.y - playerHalfHeight;
            player.setY(targetY);
            player.body.updateFromGameObject();
        }

        const bounceForce = PLAYER_CONFIG.FORCES.JUMP * 1.5;
        player.setVelocityY(-bounceForce);

        // Play SFX
        AudioManager.playTireBounce();

        const ctx = player.controller?.context;
        if (ctx) {
            ctx.coyoteTimer = 0;
            ctx.jumpBufferTimer = 0;
            ctx.jumpCount = 0;
        }

        if (tires.onBounce) {
            tires.onBounce(now);
        } else {
            tires.setTexture?.('props', 'tires.png');
        }
    }
}
