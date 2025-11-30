/**
 * ShootBehavior - Strategy Pattern para comportamiento de disparo
 * 
 * Maneja la lógica de disparo de proyectiles.
 * Se puede aplicar a cualquier enemigo que necesite disparar.
 */
export class ShootBehavior {
    constructor(enemy) {
        this.enemy = enemy;
        this.shootEvent = null;
        this.recoilTween = null;
        this.projectilesGroup = null;
        this.currentHeight = 0;
        this.minDelay = 1500;
        this.maxDelay = 3000;
    }

    /**
     * Iniciar comportamiento de disparo
     * @param {Phaser.Physics.Arcade.Group} projectilesGroup - Grupo de proyectiles
     * @param {number} currentHeight - Altura actual del juego (para dificultad)
     */
    startShooting(projectilesGroup, currentHeight = 0) {
        this.stopShooting();
        this.projectilesGroup = projectilesGroup;
        this.currentHeight = currentHeight;

        // Ajustar dificultad según altura
        this.updateDifficulty(currentHeight);

        // Programar primer disparo
        this.scheduleNextShot();
    }

    /**
     * Actualizar dificultad según altura
     */
    updateDifficulty(currentHeight) {
        this.currentHeight = currentHeight;
        
        if (currentHeight > 6000) {
            this.minDelay = 800;
            this.maxDelay = 1500;
        } else if (currentHeight > 4000) {
            this.minDelay = 1000;
            this.maxDelay = 2000;
        } else {
            this.minDelay = 1500;
            this.maxDelay = 3000;
        }
    }

    /**
     * Programar próximo disparo
     */
    scheduleNextShot() {
        if (this.shootEvent) {
            this.shootEvent.remove();
        }

        // Actualizar dificultad antes de programar
        if (this.enemy.scene && this.enemy.scene.currentHeight) {
            this.updateDifficulty(this.enemy.scene.currentHeight);
        }

        const delay = Phaser.Math.Between(this.minDelay, this.maxDelay);
        this.shootEvent = this.enemy.scene.time.addEvent({
            delay: delay,
            callback: () => {
                try {
                    if (!this.enemy.active || !this.enemy.scene) {
                        this.stopShooting();
                        return;
                    }
                    
                    this.shoot();

                    // Programar siguiente disparo
                    this.scheduleNextShot();
                } catch (e) {
                    console.warn('Error in shoot behavior callback:', e);
                    this.stopShooting();
                }
            },
            loop: false // No loop, programamos manualmente
        });
    }

    /**
     * Disparar proyectil
     */
    shoot() {
        if (!this.enemy.scene || !this.enemy.scene.player || !this.enemy.scene.player.active || !this.enemy.active) {
            return;
        }

        if (!this.projectilesGroup) {
            return;
        }

        try {
            const direction = (this.enemy.scene.player.x < this.enemy.x) ? -1 : 1;

            // Determinar cantidad de disparos según altura
            let shotCount = 1;
            if (this.currentHeight > 5000) shotCount = 3;
            else if (this.currentHeight > 4000) shotCount = 2;

            const fireShot = (offsetY = 0) => {
                const x = this.enemy.x + (15 * direction);
                const y = this.enemy.y + offsetY;
                
                let proj;
                // Si projectilesGroup es un PoolManager, usar spawn()
                if (this.projectilesGroup && typeof this.projectilesGroup.spawn === 'function') {
                    proj = this.projectilesGroup.spawn(x, y, direction);
                    // Agregar al grupo legacy si existe
                    if (this.enemy.scene && this.enemy.scene.projectiles) {
                        this.enemy.scene.projectiles.add(proj, true);
                    }
                } else if (this.projectilesGroup && typeof this.projectilesGroup.get === 'function') {
                    // Método legacy: usar get() de Phaser Group
                    proj = this.projectilesGroup.get(x, y);
                    if (proj) {
                        proj.fire(x, y, direction);
                    }
                }
            };

            // Disparar
            fireShot(0);

            // Disparos adicionales con delay
            if (shotCount >= 2) {
                this.enemy.scene.time.delayedCall(150, () => {
                    if (this.enemy.active) fireShot(0);
                });
            }

            if (shotCount >= 3) {
                this.enemy.scene.time.delayedCall(300, () => {
                    if (this.enemy.active) fireShot(0);
                });
            }

            // Efecto de retroceso
            this.playRecoilEffect();
        } catch (error) {
            console.warn('Error shooting projectile:', error);
        }
    }

    /**
     * Reproducir efecto de retroceso
     */
    playRecoilEffect() {
        if (this.recoilTween) {
            this.recoilTween.remove();
        }

        this.recoilTween = this.enemy.scene.tweens.add({
            targets: this.enemy,
            scaleX: 0.9,
            duration: 50,
            yoyo: true,
            onComplete: () => {
                if (this.enemy && this.enemy.setScale) {
                    this.enemy.setScale(1);
                }
            }
        });
    }

    /**
     * Detener comportamiento de disparo
     */
    stopShooting() {
        try {
            if (this.shootEvent) {
                this.shootEvent.remove();
                this.shootEvent = null;
            }
            if (this.recoilTween) {
                this.recoilTween.remove();
                this.recoilTween = null;
            }
        } catch (e) {
            console.warn('Error stopping shoot behavior:', e);
            this.shootEvent = null;
            this.recoilTween = null;
        }
    }

    /**
     * Limpiar comportamiento
     */
    destroy() {
        this.stopShooting();
        this.projectilesGroup = null;
    }
}

