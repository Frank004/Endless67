import { enablePlatformRider, updatePlatformRider } from '../utils/platformRider.js';
import { PatrolBehavior } from './behaviors/PatrolBehavior.js';
import { ShootBehavior } from './behaviors/ShootBehavior.js';
import { JumpBehavior } from './behaviors/JumpBehavior.js';

export class PatrolEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 0) {
        // Constructor puede recibir x, y o no (para pooling)
        super(scene, x, y, 'enemy_spike');
        this.setDepth(20);

        // Use 'bound' mode: platformRider only provides bounds, we handle movement
        enablePlatformRider(this, { mode: 'bound', marginX: 5 });

        // Strategy Pattern: Usar PatrolBehavior
        this.patrolBehavior = new PatrolBehavior(this, 60);
        this.patrolConfig = null; // Bounds pendientes para arrancar patrulla
    }

    setPatrolBounds(minX, maxX, speed = 60) {
        this.patrolConfig = { minX, maxX, speed };
    }

    spawn(x, y) {
        if (!this.scene || !this.scene.physics) {
            console.error('❌ PatrolEnemy.spawn: scene o physics indefinido');
            return;
        }
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }
        
        // Establecer posición PRIMERO
        this.setPosition(x, y);
        
        // Establecer tamaño visual a 32x32px (sin escalado)
        this.setDisplaySize(32, 32);
        this.setScale(1);  // Asegurar que el scale sea 1
        
        // Configurar body de física (32x32px)
        if (this.body) {
            this.body.setSize(32, 32);
            this.body.setOffset(0, 0);  // Sin offset, el body coincide con el sprite
        }
        
        // Configurar física
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.body.updateFromGameObject();  // Sincronizar body con posición del sprite
        
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);
        this.setVelocityY(0);  // Sin velocidad Y inicial

        // Debug: Verificar tamaño visual
        console.log(`  📏 Enemy spawn: displayWidth=${this.displayWidth}, displayHeight=${this.displayHeight}, scaleX=${this.scaleX}, scaleY=${this.scaleY}, body.width=${this.body.width}, body.height=${this.body.height}`);

        // Pop-in effect (comentado temporalmente para debug)
        // this.setScale(0);
        // this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Detener comportamientos
        this.stopMoving();
        
        // Limpiar estado
        if (this.body) {
            this.setVelocityX(0);
            this.setVelocityY(0);
        }
        this.setScale(1); // Reset scale
        
        // Remover del grupo legacy si existe
        if (this.scene && this.scene.patrolEnemies) {
            this.scene.patrolEnemies.remove(this);
        }
        
        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Iniciar patrullaje (delegado a PatrolBehavior)
     */
    patrol(minX, maxX, speed = 60) {
        this.patrolBehavior.startPatrol(minX, maxX, speed);
    }

    /**
     * Detener movimiento (delegado a PatrolBehavior)
     */
    stopMoving() {
        this.patrolBehavior.stopPatrol();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Debug: verificar que preUpdate se esté llamando solo si debug activo
        const debugPatrol = this.scene?.registry?.get('showPatrolLogs');
        if (debugPatrol) {
            if (this._preUpdateCounter === undefined) {
                this._preUpdateCounter = 0;
                console.log(`  ✅ PatrolEnemy.preUpdate: Llamado por primera vez, active=${this.active}, visible=${this.visible}`);
            }
            this._preUpdateCounter++;
            if (this._preUpdateCounter % 180 === 0) {  // Cada 3 segundos aprox
                console.log(`  🔄 PatrolEnemy.preUpdate: Frame ${this._preUpdateCounter}, active=${this.active}, body=${!!this.body}, patrolBehavior=${!!this.patrolBehavior}`);
            }
        }

        // Strategy Pattern: Delegar actualización a PatrolBehavior
        if (this.patrolBehavior) {
            this.patrolBehavior.update(time, delta);
        } else {
            console.error(`  ❌ PatrolEnemy.preUpdate: patrolBehavior es null`);
        }

        // Auto-arrancar patrulla si hay bounds pendientes y ya tocó suelo/plataforma
        if (
            this.patrolConfig &&
            !this.patrolBehavior.isPatrolling &&
            (this.body.blocked?.down || this.body.touching?.down || this.ridingPlatform)
        ) {
            const { minX, maxX, speed } = this.patrolConfig;
            this.patrolBehavior.startPatrol(minX, maxX, speed);
        }

        // Cleanup offscreen enemies
        if (this.y > this.scene.player.y + 900) {
            this.stopMoving();
            this.setActive(false);
            this.setVisible(false);
        }
    }

    /**
     * Limpiar comportamiento al destruir
     */
    destroy(fromScene) {
        if (this.patrolBehavior) {
            this.patrolBehavior.destroy();
        }
        super.destroy(fromScene);
    }
}

export class ShooterEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_shooter');
        this.setDepth(20);

        // Use 'carry' mode: only follow platform, no movement
        enablePlatformRider(this, { mode: 'carry', marginX: 5 });

        // Strategy Pattern: Usar ShootBehavior
        this.shootBehavior = new ShootBehavior(this);
    }

    spawn(x, y) {
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }
        
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);

        // 6. Tweens for Dynamic Enemies: Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Detener disparo
        this.stopShooting();
        
        // Limpiar estado
        if (this.body) {
            this.setVelocityX(0);
            this.setVelocityY(0);
        }
        this.setScale(1); // Reset scale
        
        // Remover del grupo legacy si existe
        if (this.scene && this.scene.shooterEnemies) {
            this.scene.shooterEnemies.remove(this);
        }
        
        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Iniciar disparo (delegado a ShootBehavior)
     */
    startShooting(projectilesGroup, currentHeight = 0) {
        this.shootBehavior.startShooting(projectilesGroup, currentHeight);
    }

    /**
     * Disparar (delegado a ShootBehavior)
     * @deprecated Usar startShooting en su lugar
     */
    shoot(projectilesGroup, currentHeight = 0) {
        // Mantener compatibilidad, pero delegar a behavior
        if (!this.shootBehavior.projectilesGroup) {
            this.shootBehavior.startShooting(projectilesGroup, currentHeight);
        } else {
            this.shootBehavior.shoot();
        }
    }

    /**
     * Detener disparo (delegado a ShootBehavior)
     */
    stopShooting() {
        this.shootBehavior.stopShooting();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update platform rider behavior
        updatePlatformRider(this);

        // Cleanup offscreen - usar despawn si hay pool
        if (this.y > this.scene.player.y + 900) {
            if (this.scene.shooterEnemyPool) {
                this.scene.shooterEnemyPool.despawn(this);
            } else {
            this.stopShooting();
            this.setActive(false);
            this.setVisible(false);
        }
        }
    }

    /**
     * Limpiar comportamiento al destruir
     */
    destroy(fromScene) {
        if (this.shootBehavior) {
            this.shootBehavior.destroy();
        }
        super.destroy(fromScene);
    }
}

export class JumperShooterEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 0) {
        // Constructor puede recibir x, y o no (para pooling)
        super(scene, x, y, 'enemy_jumper_shooter');
        this.setDepth(20);

        // Use 'carry' mode: only follow platform, jumping is handled separately
        enablePlatformRider(this, { mode: 'carry', marginX: 5 });

        // Strategy Pattern: Usar múltiples comportamientos
        this.jumpBehavior = new JumpBehavior(this, -400);
        this.shootBehavior = new ShootBehavior(this);
    }

    spawn(x, y) {
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }
        
        this.body.reset(x, y);
        this.body.allowGravity = true; // Needs gravity to jump
        this.setGravityY(1200); // Apply gravity since world gravity is 0
        this.body.immovable = false;   // Needs to move
        this.setCollideWorldBounds(false);
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);

        // 6. Tweens for Dynamic Enemies: Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Detener comportamientos
        this.stopBehavior();
        
        // Limpiar estado
        if (this.body) {
            this.setVelocityX(0);
            this.setVelocityY(0);
        }
        this.setScale(1); // Reset scale
        
        // Remover del grupo legacy si existe
        if (this.scene && this.scene.jumperShooterEnemies) {
            this.scene.jumperShooterEnemies.remove(this);
        }
        
        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Iniciar comportamientos (salto y disparo)
     */
    startBehavior(projectilesGroup) {
        this.stopBehavior();

        // Strategy Pattern: Iniciar ambos comportamientos
        this.jumpBehavior.startJumping(1000, 2000);
        this.shootBehavior.startShooting(projectilesGroup, this.scene.currentHeight || 0);
    }

    /**
     * Disparar (delegado a ShootBehavior)
     * @deprecated Usar startBehavior en su lugar
     */
    shoot(projectilesGroup) {
        // Mantener compatibilidad
        if (!this.shootBehavior.projectilesGroup) {
            this.shootBehavior.startShooting(projectilesGroup, this.scene.currentHeight || 0);
        } else {
            this.shootBehavior.shoot();
            }
    }

    /**
     * Detener todos los comportamientos
     */
    stopBehavior() {
        this.jumpBehavior.stopJumping();
        this.shootBehavior.stopShooting();
    }

    destroy(fromScene) {
        this.stopBehavior();
        if (this.jumpBehavior) {
            this.jumpBehavior.destroy();
        }
        if (this.shootBehavior) {
            this.shootBehavior.destroy();
        }
        super.destroy(fromScene);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update platform rider behavior
        updatePlatformRider(this);

        // Cleanup offscreen - usar despawn si hay pool
        if (this.y > this.scene.player.y + 900) {
            if (this.scene.jumperShooterEnemyPool) {
                this.scene.jumperShooterEnemyPool.despawn(this);
            } else {
            this.stopBehavior();
            this.setActive(false);
            this.setVisible(false);
            }
        }
    }
}
