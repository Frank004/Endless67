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

            // Ancho del body: usar el ancho completo del sprite para evitar que se meta visualmente en la pared
            const bodyWidth = spriteWidth;
            // Altura del body: mantener proporción o usar altura del sprite menos margen
            const bodyHeight = Math.max(20, spriteHeight); // Usar altura completa

            // Centrar horizontalmente y ajustar verticalmente
            const offsetX = (spriteWidth - bodyWidth) / 2;
            const offsetY = (spriteHeight - bodyHeight) / 2;

            this.body.setSize(bodyWidth, bodyHeight);
            this.body.setOffset(offsetX, offsetY);

            // CRÍTICO: Asegurar que el body no pueda penetrar los bounds del mundo
            // Esto previene que el jugador se meta dentro de las paredes
            this.body.setCollideWorldBounds(true);
            // Asegurar que el body respete los bounds incluso con velocidades altas
            this.body.setBounce(0, 0);
        }

        this.setGravityY(1200);
        this.setMaxVelocity(300, 1000);
        this.setDragX(1200);
        this.setCollideWorldBounds(true); // Use Arcade Physics for bounds
        this.body.onWorldBounds = true;
        this.setDepth(20);

        // State
        this.jumps = 0;
        this.maxJumps = 3;
        this.lastWallTouched = null;
        this.wallJumpConsecutive = 0;
        this.currentPlatform = null;
        this.isInvincible = false;
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
        // World bounds now handled by Arcade Physics
        if (!this.body.touching.down) {
            this.currentPlatform = null;
        }

        // Check for wall interaction via World Bounds (blocked)
        if (this.body.blocked.left) {
            this.handleWallTouch('left');
        } else if (this.body.blocked.right) {
            this.handleWallTouch('right');
        }

        // Movement is now handled via EventBus events
        // This method only handles physics updates
    }

    move(direction) {
        const force = 900;
        this.setAccelerationX(direction * force);
    }

    stop() {
        this.setAccelerationX(0);
    }

    jump(boost = 1.0) {
        // Wall Jump Left (Touching wall on left or blocked by world bound on left)
        if (this.body.touching.left || this.body.blocked.left) {
            if (this.checkWallStamina('left')) {
                this.setVelocity(400 * boost, -600 * boost); // Increased Y
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x - 10, y: this.y };
            }
            return null;
        }

        // Wall Jump Right (Touching wall on right or blocked by world bound on right)
        if (this.body.touching.right || this.body.blocked.right) {
            if (this.checkWallStamina('right')) {
                this.setVelocity(-400 * boost, -600 * boost); // Increased Y
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x + 10, y: this.y };
            }
            return null;
        }

        // Normal / Double Jump
        if (this.jumps < this.maxJumps) {
            let type = this.jumps === 0 ? 'jump' : 'double_jump';
            if (this.jumps > 0) this.doFrontFlip();

            this.setVelocityY(-600 * boost); // Increased from -550 to reach 140px spacing
            this.jumps++;
            // Offset ajustado dinámicamente basado en el tamaño del sprite
            // Para 32x32px: offset de ~16px (mitad del sprite)
            // Para 24x24px: offset de ~12px (mitad del sprite)
            const jumpOffsetY = (this.height || 32) * 0.5;
            return { type: type, x: this.x, y: this.y + jumpOffsetY };
        }

        return null;
    }

    checkWallStamina(side) {
        if (this.lastWallTouched !== side) {
            this.wallJumpConsecutive = 0;
            this.clearTint();
        }
        if (this.wallJumpConsecutive >= 3) return false;
        this.lastWallTouched = side;
        this.wallJumpConsecutive++;
        return true;
    }

    handleWallTouch(wallSide) {
        // If we are moving up, don't apply wall slide friction yet, let momentum carry us
        // unless we want to limit upward velocity? No, usually wall slide affects downward movement.

        if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= 3) {
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
