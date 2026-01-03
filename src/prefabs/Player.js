import EventBus, { Events } from '../core/EventBus.js';
import { PlayerController } from '../player/PlayerController.js';
import { PLAYER_CONFIG } from '../config/PlayerConfig.js';
import { ASSETS } from '../config/AssetKeys.js';
import { REGISTRY_KEYS } from '../config/RegistryKeys.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Determinar qué textura usar: atlas de player (prioridad), PNG opcional o placeholder generado
        const hasAtlas = scene.textures.exists(ASSETS.PLAYER);
        const usePNG = scene.registry.get(REGISTRY_KEYS.USE_PLAYER_PNG) === true; // Debe ser explícitamente true
        const hasPNG = scene.textures.exists(ASSETS.PLAYER_PNG);
        const textureKey = hasAtlas ? ASSETS.PLAYER : (usePNG && hasPNG ? ASSETS.PLAYER_PNG : ASSETS.PLAYER_PLACEHOLDER);
        const frameKey = hasAtlas ? 'IDLE 1.png' : undefined;

        // Debug log para verificar qué textura se está usando
        if (hasAtlas) {
            console.log('🎨 Player: Usando atlas (player) -> frame IDLE 1.png');
        } else if (usePNG && hasPNG) {
            console.log('🎨 Player: Usando PNG (player_png)');
        } else {
            console.log('🎨 Player: Usando placeholder generado (player_placeholder)');
        }

        super(scene, x, y, textureKey, frameKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDisplaySize(32, 32);
        // Animación idle por defecto
        if (scene.anims.exists('player_idle')) {
            this.play('player_idle');
        }
        // Exponer EventBus en scene para que el contexto pueda emitir sin acoplarse
        if (!scene.eventBus) {
            scene.eventBus = EventBus;
        }

        // Event listeners storage for cleanup (must be initialized before setupEventListeners)
        this.eventListeners = [];

        // Setup event listeners
        this.setupEventListeners();

        // Player sprite size (actualizado para 32x32px)
        // El body de física se ajusta para evitar penetración en las paredes
        // IMPORTANTE: El body debe ser más pequeño que el sprite y estar correctamente centrado
        // para evitar que penetre las paredes cuando colisiona con los bounds del mundo
        if (this.body) {
            const spriteWidth = this.displayWidth || 32; // Ancho del sprite visual
            const spriteHeight = this.displayHeight || 32; // Alto del sprite visual

            // Ancho del body ajustado para que el sprite no se vea dentro de la pared
            const bodyWidth = PLAYER_CONFIG.BODY.WIDTH;
            // Altura del body: mantener proporción y pies definidos
            const bodyHeight = Math.max(PLAYER_CONFIG.BODY.MIN_HEIGHT, spriteHeight - PLAYER_CONFIG.BODY.OFFSET_Y_MARGIN);

            // Centrar horizontalmente y ajustar verticalmente (pies en la parte inferior)
            const offsetX = (spriteWidth - bodyWidth) / 2;
            const offsetY = spriteHeight - bodyHeight;

            this.body.setSize(bodyWidth, bodyHeight);
            this.body.setOffset(offsetX, offsetY);

            // Las paredes físicas manejarán las colisiones, no los world bounds
            this.body.setBounce(0, 0);
        }

        this.setGravityY(PLAYER_CONFIG.GRAVITY_Y);
        this.setMaxVelocity(PLAYER_CONFIG.MAX_VELOCITY.X, PLAYER_CONFIG.MAX_VELOCITY.Y);
        this.setDragX(PLAYER_CONFIG.DRAG_X);
        // IMPORTANTE: NO usar setCollideWorldBounds para permitir que el jugador
        // toque las paredes físicas y active los walljumps
        // Las paredes físicas (leftWall, rightWall) manejarán las colisiones
        this.setCollideWorldBounds(false);
        this.body.onWorldBounds = false;
        this.setDepth(20);

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
     */
    activateInvincibility() {
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

        const DURATION = 12000;
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

        // Start blinking 2 seconds before end
        this.startBlinkTimer = this.scene.time.delayedCall(BLINK_START_DELAY, () => {
            if (this.blinkTimer) this.blinkTimer.paused = false;
        });

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
            this.powerupOverlay.stop();
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
