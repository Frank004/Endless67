import EventBus, { Events } from '../../Core/EventBus.js';
import { PlayerController } from './PlayerController.js';
import { PlayerVisuals } from './PlayerVisuals.js';
import { PlayerPhysics } from './PlayerPhysics.js';
import { PLAYER_CONFIG } from '../../Config/PlayerConfig.js';
import { ASSETS } from '../../Config/AssetKeys.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y); // Texture is set by Visuals init

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set depth for proper layering (gameplay layer)
        this.setDepth(20); // Gameplay layer - in front of all background decorations

        // Components
        this.visuals = new PlayerVisuals(this);
        this.physics = new PlayerPhysics(this);

        // Initialize Components
        this.visuals.init();
        this.physics.init();

        // Exponer EventBus (context support)
        if (!scene.eventBus) {
            scene.eventBus = EventBus;
        }

        // Event listeners storage
        this.eventListeners = [];
        this.setupEventListeners();

        // Anims defaults (can be moved to Visuals later if needed)
        if (scene.anims.exists('player_idle')) {
            this.play('player_idle');
        }

        // FSM/Animation controller (control único de orquestación)
        this.controller = new PlayerController(this);

        // Estado visual/auxiliar
        this.currentPlatform = null;
        this.isInvincible = false;
        this.lastPlatformVelX = 0;  // Para rastrear la velocidad de la plataforma del frame anterior

        // Ajustes base de fuerzas (usadas vía context wrappers)
        this.baseJumpForce = PLAYER_CONFIG.FORCES.JUMP;
        this.baseWallJumpForceX = PLAYER_CONFIG.FORCES.WALL_JUMP_X;
        this.baseWallJumpForceY = PLAYER_CONFIG.FORCES.WALL_JUMP_Y;
        this.baseMoveForce = PLAYER_CONFIG.FORCES.MOVE;
    }

    getPowerupJumpMultiplier() {
        return this.isInvincible ? PLAYER_CONFIG.SPEED_MULTIPLIERS.INVINCIBLE_JUMP : 1.0;
    }

    /**
     * Setup EventBus listeners for input events
     * Player now listens to events from InputManager instead of receiving input directly
     */
    setupEventListeners() {
        // Listen to movement events
        const moveListener = (data) => {
            if (this.controller) {
                this.controller.context.intent.moveX = data.direction;
            }
        };
        EventBus.on(Events.PLAYER_MOVE, moveListener);
        this.eventListeners.push({ event: Events.PLAYER_MOVE, listener: moveListener });

        // Listen to stop events
        const stopListener = () => {
            if (this.controller) {
                this.controller.context.intent.moveX = 0;
            }
        };
        EventBus.on(Events.PLAYER_STOP, stopListener);
        this.eventListeners.push({ event: Events.PLAYER_STOP, listener: stopListener });

        // Listen to jump request events (from InputManager)
        const jumpListener = () => {
            if (this.controller) {
                this.controller.context.intent.jumpJustPressed = true;
            }
        };
        EventBus.on(Events.PLAYER_JUMP_REQUESTED, jumpListener);
        this.eventListeners.push({ event: Events.PLAYER_JUMP_REQUESTED, listener: jumpListener });
    }

    /**
     * Clean up event listeners when player is destroyed
     */
    /**
     * Activates invincibility powerup.
     * @param {number} customDuration - Optional custom duration in ms (default: 12000)
     */
    activateInvincibility(customDuration = null) {
        this.isInvincible = true;

        // Reset blinking/timers if re-acquired while active
        if (this.powerupTimer) this.powerupTimer.remove();
        if (this.blinkTimer) this.blinkTimer.remove();

        // Stop any running alpha tweens on player and reset alpha
        this.scene.tweens.killTweensOf(this, 'alpha');
        this.setAlpha(1);

        // Start Aura
        if (this.scene.particleManager) {
            this.scene.particleManager.startAura();
        }

        const DURATION = customDuration !== null ? customDuration : 12000;
        const BLINK_START_DELAY = DURATION - 2000; // Start blinking 2 seconds before end

        // Schedule blinking
        // Schedule blinking (Flash White)
        this.blinkTimer = this.scene.time.addEvent({
            delay: 150,
            startAt: 0,
            repeat: -1, // Infinite loop until manually stopped or destroyed
            paused: true, // Start paused
            callback: () => {
                if (this.active) {
                    if (this.isTinted) {
                        this.clearTint();
                    } else {
                        this.setTintFill(0xffffff);
                    }
                }
            }
        });

        // Start blinking 2 seconds before end (only if duration is long enough)
        if (BLINK_START_DELAY > 0) {
            this.startBlinkTimer = this.scene.time.delayedCall(BLINK_START_DELAY, () => {
                if (this.blinkTimer) this.blinkTimer.paused = false;
            });
        } else {
            // For short durations, start blinking immediately
            if (this.blinkTimer) this.blinkTimer.paused = false;
        }

        // Schedule deactivation
        this.powerupTimer = this.scene.time.delayedCall(DURATION, () => {
            this.deactivatePowerup();
        });
    }

    deactivatePowerup() {
        this.isInvincible = false;

        // Stop Aura
        if (this.scene.particleManager) {
            this.scene.particleManager.stopAura();
        }

        // Cleanup timers
        if (this.blinkTimer) {
            this.blinkTimer.remove();
            this.blinkTimer = null;
        }
        if (this.startBlinkTimer) {
            this.startBlinkTimer.remove();
            this.startBlinkTimer = null;
        }

        this.clearTint();

        if (this.powerupOverlay) {
            this.powerupOverlay = null;
        }
    }

    destroy() {
        if (this.powerupTimer) this.powerupTimer.remove();
        if (this.startBlinkTimer) this.startBlinkTimer.remove();
        if (this.blinkTimer) this.blinkTimer.remove();

        this.eventListeners.forEach(({ event, listener }) => {
            EventBus.off(event, listener);
        });
        this.eventListeners = [];
        super.destroy();
    }

    /**
     * Update method - now only handles physics and wall interactions
     * Input is handled via EventBus events from InputManager
     * 
     * @deprecated The cursors parameter is no longer used - Player listens to events
     * This method is kept for backward compatibility but will be removed in future
     */
    update(cursors = null, movePointer = null, splitX = null, isMobile = null) {
        // Reset platform reference when not touching ground
        if (!this.body.touching.down) {
            this.currentPlatform = null;
        }

        // Mantener overlay de powerup alineado al jugador si está visible
        if (this.powerupOverlay && this.powerupOverlay.visible) {
            this.powerupOverlay.updatePosition();
        }

        // FSM placeholder: actualizar sensores y animación sin alterar físicas
        if (this.controller) {
            this.controller.update();
        }

        // Update visuals (flipping, etc)
        if (this.visuals) {
            this.visuals.update();
        }

        // Move with moving platform (only if player is NOT moving with input)
        if (this.currentPlatform && this.currentPlatform.active && this.body.touching.down) {
            const platform = this.currentPlatform;

            // Check if platform is moving
            if (platform.getData('isMoving') && platform.body && platform.body.velocity) {
                // Get platform's horizontal velocity
                const platformVelX = platform.body.velocity.x;

                // Check if player is trying to move (has horizontal acceleration)
                const isPlayerMoving = Math.abs(this.body.acceleration.x) > 0 || (this.controller && Math.abs(this.controller.context.intent.moveX) > 0);

                // Store the offset from platform center (only on first contact)
                if (this.platformOffsetX === undefined) {
                    this.platformOffsetX = this.x - platform.x;
                }

                if (!isPlayerMoving) {
                    // Player is NOT moving with input → move with platform (offset fijo)
                    // Calculate new player position based on platform movement
                    let newX = platform.x + this.platformOffsetX;

                    // Clamp player position to prevent entering walls
                    // Player body width is 24px, so half is 12px
                    const playerHalfWidth = (this.width || 32) / 2;  // usar sprite completo para evitar que se meta en la pared
                    const wallWidth = 32;  // WALLS.WIDTH
                    const gameWidth = this.scene.cameras.main.width;  // 400px

                    // Ensure player doesn't enter left wall (0 to 32px)
                    const minPlayerX = wallWidth + playerHalfWidth;  // 32 + 12 = 44px
                    // Ensure player doesn't enter right wall (368 to 400px)
                    const maxPlayerX = gameWidth - wallWidth - playerHalfWidth;  // 400 - 32 - 12 = 356px

                    // Clamp position
                    newX = Phaser.Math.Clamp(newX, minPlayerX, maxPlayerX);

                    // Update player position to move with platform
                    this.x = newX;

                    // Match platform velocity so physics interactions work correctly
                    this.body.velocity.x = platformVelX;

                    // Guardar la velocidad de la plataforma para el siguiente frame
                    this.lastPlatformVelX = platformVelX;
                } else {
                    // Player IS moving with input → allow independent movement
                    // La física calcula la velocidad del jugador basada en la aceleración
                    // Pero esta velocidad puede incluir la velocidad de la plataforma del frame anterior
                    // Necesitamos calcular la velocidad relativa del jugador (sin plataforma)
                    // y luego sumar la velocidad de la plataforma actual

                    // Calcular velocidad relativa: restar la velocidad de la plataforma del frame anterior
                    const playerRelativeVelX = this.body.velocity.x - this.lastPlatformVelX;

                    // La velocidad absoluta = velocidad relativa + velocidad de plataforma actual
                    // Esto permite que el jugador se mueva en la dirección correcta del input
                    // mientras la plataforma también se mueve
                    this.body.velocity.x = playerRelativeVelX + platformVelX;

                    // Guardar la velocidad de la plataforma para el siguiente frame
                    this.lastPlatformVelX = platformVelX;

                    // Actualizar offset basado en la posición actual
                    // Esto asegura que cuando el jugador deje de moverse, esté en la nueva posición relativa
                    this.platformOffsetX = this.x - platform.x;
                }
            } else {
                // Not on moving platform, clear offset
                this.platformOffsetX = undefined;
                this.lastPlatformVelX = 0;
            }
        } else {
            // Not on platform, clear offset
            this.platformOffsetX = undefined;
            this.lastPlatformVelX = 0;
        }

        // Wall touches are handled by colliders; no need to check world bounds
    }


    // Helpers de física para el FSM/context
    move(direction) {
        const speedMult = this.isInvincible ? PLAYER_CONFIG.SPEED_MULTIPLIERS.INVINCIBLE_MOVE : 1.0;
        const force = this.baseMoveForce * speedMult;
        this.setAccelerationX(direction * force);
    }

    stop() {
        this.setAccelerationX(0);
    }

    jumpPhysics(vx, vy) {
        this.setVelocity(vx, vy);
    }

    setCurrentPlatform(platform) {
        this.currentPlatform = platform || null;
    }

    // Hooks para estados de daño/muerte (delegan en el controller/FSM)
    enterHitState(duration = 500) {
        this.controller?.enterHit(duration);
    }

    enterDeathState() {
        this.controller?.enterDeath();
    }

}
