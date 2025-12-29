import EventBus, { Events } from '../core/EventBus.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Determinar qué textura usar: PNG o placeholder generado
        // Si existe 'player_png' y el toggle está activo, usarlo; sino usar 'player'
        const usePNG = scene.registry.get('usePlayerPNG') === true; // Debe ser explícitamente true
        const textureKey = (usePNG && scene.textures.exists('player_png')) ? 'player_png' : 'player';

        // Debug log para verificar qué textura se está usando
        if (usePNG && scene.textures.exists('player_png')) {
            console.log('🎨 Player: Usando PNG (player_png)');
        } else {
            console.log('🎨 Player: Usando placeholder generado (player)');
        }

        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Event listeners storage for cleanup (must be initialized before setupEventListeners)
        this.eventListeners = [];

        // Setup event listeners
        this.setupEventListeners();

        // Player sprite size (actualizado para 32x32px)
        // El body de física se ajusta para evitar penetración en las paredes
        // IMPORTANTE: El body debe ser más pequeño que el sprite y estar correctamente centrado
        // para evitar que penetre las paredes cuando colisiona con los bounds del mundo
        if (this.body) {
            const spriteWidth = this.width || 32; // Ancho del sprite visual
            const spriteHeight = this.height || 32; // Alto del sprite visual

            // Ancho del body más cercano al sprite para colisiones precisas
            const bodyWidth = 24;
            // Altura del body: mantener proporción y pies definidos
            const bodyHeight = Math.max(24, spriteHeight - 8); // Mínimo 24px de altura

            // Centrar horizontalmente y ajustar verticalmente (pies en la parte inferior)
            // El offsetX centra el body más pequeño dentro del sprite más grande
            // Esto asegura que el centro del body coincida con el centro del sprite
            const offsetX = (spriteWidth - bodyWidth) / 2;
            const offsetY = spriteHeight - bodyHeight; // Offset Y en la parte inferior (pies)

            this.body.setSize(bodyWidth, bodyHeight);
            this.body.setOffset(offsetX, offsetY);

            // Las paredes físicas manejarán las colisiones, no los world bounds
            this.body.setBounce(0, 0);
        }

        this.setGravityY(1200);
        this.setMaxVelocity(300, 1000);
        this.setDragX(1200);
        // IMPORTANTE: NO usar setCollideWorldBounds para permitir que el jugador
        // toque las paredes físicas y active los walljumps
        // Las paredes físicas (leftWall, rightWall) manejarán las colisiones
        this.setCollideWorldBounds(false);
        this.body.onWorldBounds = false;
        this.setDepth(20);

        // State
        this.jumps = 0;
        this.maxJumps = 2; // Player can jump twice (normal + double jump)
        this.lastWallTouched = null;
        this.wallJumpConsecutive = 0;
        this.maxWallJumps = 3; // Maximum 3 consecutive jumps on same wall
        this.currentPlatform = null;
        this.isInvincible = false;
        this.lastPlatformVelX = 0;  // Para rastrear la velocidad de la plataforma del frame anterior
    }

    // ... (omitted setupEventListeners and other methods) ...

    jump(boost = 1.0) {
        const now = this.scene.time.now;

        // Check cooldown (unless it's a wall jump, which typically feels instant)
        // But preventing rapid double tap is good even for wall interaction mix
        // Let's only apply cooldown for air jumps to prevent instant double jump

        // Wall Jump Left (Touching wall via collider)
        if (this.body.touching.left) {
            if (this.checkWallStamina('left')) {
                this.setVelocity(400 * boost, -600 * boost);
                this.jumps = 0;
                this.lastJumpTime = now;
                console.log('🧱 Wall Jump Left');
                return { type: 'wall_jump', x: this.x - 10, y: this.y };
            }
            return null;
        }

        // Wall Jump Right (Touching wall via collider)
        if (this.body.touching.right) {
            if (this.checkWallStamina('right')) {
                this.setVelocity(-400 * boost, -600 * boost);
                this.jumps = 0;
                this.lastJumpTime = now;
                console.log('🧱 Wall Jump Right');
                return { type: 'wall_jump', x: this.x + 10, y: this.y };
            }
            return null;
        }

        // Normal / Double Jump
        if (this.jumps < this.maxJumps) {
            let type = this.jumps === 0 ? 'jump' : 'double_jump';

            if (this.jumps > 0) {
                this.doFrontFlip();
                console.log('🔄 Double Jump');
            } else {
                console.log('⬆️ Normal Jump');
            }

            this.setVelocityY(-600 * boost);
            this.jumps++;

            const jumpOffsetY = (this.height || 32) * 0.5;
            return { type: type, x: this.x, y: this.y + jumpOffsetY };
        }

        return null;
    }

    /**
     * Setup EventBus listeners for input events
     * Player now listens to events from InputManager instead of receiving input directly
     */
    setupEventListeners() {
        // Listen to movement events
        const moveListener = (data) => {
            this.move(data.direction);
        };
        EventBus.on(Events.PLAYER_MOVE, moveListener);
        this.eventListeners.push({ event: Events.PLAYER_MOVE, listener: moveListener });

        // Listen to stop events
        const stopListener = () => {
            this.stop();
        };
        EventBus.on(Events.PLAYER_STOP, stopListener);
        this.eventListeners.push({ event: Events.PLAYER_STOP, listener: stopListener });

        // Listen to jump request events (from InputManager)
        const jumpListener = (data) => {
            const boost = data.boost || 1.0;
            const result = this.jump(boost);

            // Emit event after successful jump (for particle effects, etc.)
            if (result) {
                EventBus.emit(Events.PLAYER_JUMPED, {
                    type: result.type,
                    x: result.x,
                    y: result.y
                });
            }
        };
        EventBus.on(Events.PLAYER_JUMP_REQUESTED, jumpListener);
        this.eventListeners.push({ event: Events.PLAYER_JUMP_REQUESTED, listener: jumpListener });
    }

    /**
     * Clean up event listeners when player is destroyed
     */
    destroy() {
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

        // Move with moving platform (only if player is NOT moving with input)
        if (this.currentPlatform && this.currentPlatform.active && this.body.touching.down) {
            const platform = this.currentPlatform;
            
            // Check if platform is moving
            if (platform.getData('isMoving') && platform.body && platform.body.velocity) {
                // Get platform's horizontal velocity
                const platformVelX = platform.body.velocity.x;
                
                // Check if player is trying to move (has horizontal acceleration)
                const isPlayerMoving = Math.abs(this.body.acceleration.x) > 0;
                
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
                    const playerHalfWidth = this.body.width / 2;  // 12px
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

        // Wall touches are now handled by colliders in CollisionManager
        // No need to check body.blocked since we're not using world bounds
    }

    move(direction) {
        const force = 900;
        this.setAccelerationX(direction * force);
    }

    stop() {
        this.setAccelerationX(0);
    }



    checkWallStamina(side) {
        if (this.lastWallTouched !== side) {
            this.wallJumpConsecutive = 0;
            this.clearTint();
        }
        if (this.wallJumpConsecutive >= this.maxWallJumps) return false;
        this.lastWallTouched = side;
        this.wallJumpConsecutive++;
        return true;
    }

    handleWallTouch(wallSide) {
        // If we are moving up, don't apply wall slide friction yet, let momentum carry us
        // unless we want to limit upward velocity? No, usually wall slide affects downward movement.

        if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= this.maxWallJumps) {
            // Stamina depleted, slide down fast? Or just normal gravity?
            // If we want to punish, maybe no friction.
            // But let's keep the existing logic: if stamina depleted, maybe we slip?
            // The original code applied friction even if stamina depleted?
            // "if (this.body.velocity.y > 0) this.setVelocityY(400);" -> This limits falling speed (friction)

            // Wait, the original code said:
            // if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= 5) {
            //    if (this.body.velocity.y > 0) this.setVelocityY(400); 
            //    this.setTint(0x555555);
            //    return;
            // }
            // This means even with depleted stamina, we still slide but maybe faster (400 vs 80)?

            if (this.body.velocity.y > 0) this.setVelocityY(400); // Faster slide (less friction)
            this.setTint(0x555555);
            return;
        }

        // Normal Wall Slide Friction
        if (this.body.velocity.y > 0) this.setVelocityY(80); // Slow slide (high friction)

        if (this.lastWallTouched !== wallSide) {
            this.jumps = 0;
            this.clearTint();
            this.scene.tweens.killTweensOf(this);
            this.angle = 0;
        }
    }

    doFrontFlip() {
        this.scene.tweens.killTweensOf(this);
        this.angle = 0;
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 400,
            ease: 'Cubic.easeOut'
        });
    }

    handleLand(floor) {
        if (this.body.touching.down) {
            this.jumps = 0;
            this.lastWallTouched = null;
            this.wallJumpConsecutive = 0;
            this.clearTint();
            this.angle = 0;
            this.currentPlatform = floor;
        }
    }
}
