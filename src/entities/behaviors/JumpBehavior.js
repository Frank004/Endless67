/**
 * JumpBehavior - Strategy Pattern para comportamiento de salto
 * 
 * Maneja la lógica de salto de enemigos.
 * Se puede aplicar a cualquier enemigo que necesite saltar.
 */
export class JumpBehavior {
    constructor(enemy, jumpForce = -400) {
        this.enemy = enemy;
        this.jumpEvent = null;
        this.jumpForce = jumpForce;
        this.minDelay = 1000;
        this.maxDelay = 2000;
    }

    /**
     * Iniciar comportamiento de salto
     * @param {number} minDelay - Delay mínimo entre saltos (ms)
     * @param {number} maxDelay - Delay máximo entre saltos (ms)
     */
    startJumping(minDelay = 1000, maxDelay = 2000) {
        this.stopJumping();
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.scheduleNextJump();
    }

    /**
     * Programar próximo salto
     */
    scheduleNextJump() {
        if (this.jumpEvent) {
            this.jumpEvent.remove();
        }

        const delay = Phaser.Math.Between(this.minDelay, this.maxDelay);
        this.jumpEvent = this.enemy.scene.time.addEvent({
            delay: delay,
            callback: () => {
                try {
                    if (!this.enemy.active || !this.enemy.scene) {
                        this.stopJumping();
                        return;
                    }

                    this.jump();

                    // Programar siguiente salto
                    this.scheduleNextJump();
                } catch (e) {
                    console.warn('Error in jump behavior callback:', e);
                    this.stopJumping();
                }
            },
            loop: false // No loop, programamos manualmente
        });
    }

    /**
     * Ejecutar salto
     */
    jump() {
        if (!this.enemy.body) {
            return;
        }

        // Solo saltar si está tocando el suelo
        const isOnGround = this.enemy.body.touching.down || this.enemy.body.blocked.down;

        if (isOnGround) {
            // Efecto de anticipación: comprimir al momento de saltar
            this.enemy.setScale(1.15, 0.85);

            // Saltar inmediatamente
            this.enemy.setVelocityY(this.jumpForce);
        }
    }

    /**
     * Detener comportamiento de salto
     */
    stopJumping() {
        try {
            if (this.jumpEvent) {
                this.jumpEvent.remove();
                this.jumpEvent = null;
            }
        } catch (e) {
            console.warn('Error stopping jump behavior:', e);
            this.jumpEvent = null;
        }
    }

    /**
     * Limpiar comportamiento
     */
    destroy() {
        this.stopJumping();
    }
}

