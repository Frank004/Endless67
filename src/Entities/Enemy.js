import { enablePlatformRider, updatePlatformRider } from '../Utils/platformRider.js';
import StateMachine from '../Utils/StateMachine.js'; // Import StateMachine
import { PatrolBehavior } from './Behaviors/PatrolBehavior.js';

import { ShootBehavior } from './Behaviors/ShootBehavior.js';
import { JumpBehavior } from './Behaviors/JumpBehavior.js';

import { ENEMY_CONFIG } from '../Config/EnemyConfig.js';
import { ASSETS } from '../Config/AssetKeys.js';
import { registerEnemyAnimations } from '../Utils/animations.js';

export class PatrolEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 0) {
        // Constructor puede recibir x, y o no (para pooling)
        super(scene, x, y, ASSETS.ENEMY_ATLAS, 'patrol-idle1.png');
        this.setDepth(20);
        this.isDead = false;

        // Ensure enemy animations exist before FSM plays them
        if (!scene.anims.exists('enemy_idle')) {
            registerEnemyAnimations(scene);
        }

        // Use 'patrol' mode: platformRider takes full control of movement and bounds
        enablePlatformRider(this, {
            mode: 'patrol',
            marginX: 5,
            autoPatrol: true,
            patrolSpeed: ENEMY_CONFIG.PATROL.SPEED
        });

        // Strategy Pattern: Usar PatrolBehavior only for extra custom logic if needed (now reduced)

        // Initialize State Machine
        this.fsm = new StateMachine('idle', this);

        this.fsm.addState('idle', {
            onEnter: () => this.play('enemy_idle', true),
            onUpdate: () => {
                if (this.riderAutoPatrol && this.ridingPlatform) {
                    this.fsm.setState('run');
                }
            }
        })
            .addState('run', {
                onEnter: () => this.play('enemy_run', true),
                onUpdate: () => {
                    if (!this.riderAutoPatrol || !this.ridingPlatform) {
                        this.fsm.setState('idle');
                    }
                }
            })
            .addState('attack', {
                onEnter: () => {
                    this.play('enemy_attack', true);
                    this.once('animationcomplete', () => {
                        if (this.fsm.currentState === 'attack') {
                            this.fsm.setState('idle'); // Return to idle after attack
                        }
                    });
                }
            })
            .addState('die', {
                onEnter: () => {
                    this.stopMoving();
                    this.body.checkCollision.none = true; // Disable collisions
                    this.play('enemy_die', true);
                    this.once('animationcomplete', () => {
                        this.destroy(); // Destroy after death animation
                    });
                }
            });

        this.fsm.start();
    }


    setPatrolBounds(minX, maxX, speed = ENEMY_CONFIG.PATROL.SPEED) {
        // Legacy method support - platformRider auto-calculates bounds from platform
        // But if we wanted manual bounds, we'd override rider properties
        this.riderPatrolSpeed = speed;
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

        // Establecer tamaño visual: NO usar setDisplaySize con el tamaño del hitbox (20),
        // dejar que el sprite use su tamaño natural (32x25) o forzarlo si fuera necesario.
        // this.setDisplaySize(ENEMY_CONFIG.PATROL.SIZE, ENEMY_CONFIG.PATROL.SIZE); // REMOVED
        this.setScale(1);  // Asegurar que el scale sea 1

        // Configurar body de física
        if (this.body) {
            this.body.setSize(ENEMY_CONFIG.PATROL.SIZE, ENEMY_CONFIG.PATROL.SIZE);
            // Sprite is 32x25, Body is 20x20.
            // Align bottom: Offset Y = SpriteHeight (25) - BodyHeight (20) = 5
            // Center X: (32 - 20) / 2 = 6
            this.body.setOffset(6, 5);
        }

        // Configurar física
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.body.gravity.y = ENEMY_CONFIG.PATROL.GRAVITY; // Needs gravity to fall onto platform
        this.body.immovable = false;
        this.body.updateFromGameObject();

        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);
        this.setVelocityY(0);  // Sin velocidad Y inicial

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
    /**
     * Iniciar patrullaje (Legacy/Deprecated - use autoPatrol in platformRider)
     */
    patrol(minX, maxX, speed = ENEMY_CONFIG.PATROL.SPEED) {
        this.riderPatrolSpeed = speed;
        this.riderPatrolSpeed = speed;
        this.riderAutoPatrol = true;
    }

    // --- State Actions ---

    attack() {
        if (this.isDead || this.fsm.currentState === 'attack') return;
        this.fsm.setState('attack');
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.fsm.setState('die');
    }

    /**
     * Detener movimiento (delegado a PatrolBehavior)
     */
    stopMoving() {
        // this.patrolBehavior.stopPatrol();
        this.riderAutoPatrol = false;
        if (this.body) this.setVelocityX(0);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // PlatformRider updates logic automatically
        updatePlatformRider(this);

        // Update State Machine
        if (this.fsm) {
            this.fsm.update(time, delta);
        }


        // Debug: verificar que preUpdate se esté llamando solo si debug activo
        const debugPatrol = this.scene?.registry?.get('showPatrolLogs');
        if (debugPatrol) {
            if (this._preUpdateCounter === undefined) {
                this._preUpdateCounter = 0;
                console.log(`  ✅ PatrolEnemy.preUpdate: Llamado por primera vez, active=${this.active}`);
            }
            this._preUpdateCounter++;
            if (this._preUpdateCounter % 180 === 0) {
                console.log(`  🔄 PatrolEnemy: x=${this.x.toFixed(1)}, onPlat=${!!this.ridingPlatform}`);
            }
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
        super(scene, x, y, ASSETS.ENEMY_ATLAS, 'patrol-idle1.png'); // Use Atlas
        this.setDepth(20);
        this.isDead = false;

        // Use 'carry' mode: only follow platform, no movement
        enablePlatformRider(this, { mode: 'carry', marginX: 5 });

        // Strategy Pattern: Usar ShootBehavior
        this.shootBehavior = new ShootBehavior(this);

        this.fsm = new StateMachine('idle', this);
        this.fsm.addState('idle', {
            onEnter: () => this.play('enemy_idle', true)
        })
            .addState('attack', {
                onEnter: () => {
                    this.play('enemy_attack', true);
                    this.once('animationcomplete', () => {
                        if (this.fsm.currentState === 'attack' && !this.isDead) {
                            this.fsm.setState('idle');
                        }
                    });
                }
            })
            .addState('die', {
                onEnter: () => {
                    this.stopShooting();
                    this.body.checkCollision.none = true;
                    this.play('enemy_die', true);
                    this.once('animationcomplete', () => {
                        this.destroy();
                    });
                }
            });
        this.fsm.start();
    }

    spawn(x, y) {
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }

        this.body.reset(x, y);
        // Remove direct setDisplaySize to respect sprite size
        this.setScale(1);
        if (this.body) {
            this.body.setSize(ENEMY_CONFIG.SHOOTER.SIZE, ENEMY_CONFIG.SHOOTER.SIZE); // 24
            // Sprite 32x25. Body 24x24 (if from config).
            // Align bottom: 25 - 24 = 1.
            // Center X: (32 - 24) / 2 = 4.
            this.body.setOffset(4, 1);
        }
        this.body.allowGravity = false;
        this.setGravityY(0);
        this.body.immovable = true;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);

        // Reset timers/behavior
        this.stopShooting();
        this.fsm.setState('idle');
    }

    attack() {
        if (!this.isDead && this.fsm.currentState !== 'attack') {
            this.fsm.setState('attack');
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.fsm.setState('die');
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
        * Detener disparo (delegado a ShootBehavior)
        */
    stopShooting() {
        this.shootBehavior.stopShooting();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Face Player
        if (this.scene && this.scene.player && this.scene.player.active && !this.isDead) {
            this.setFlipX(this.scene.player.x < this.x);
        }

        // Update physics/logic
        updatePlatformRider(this);
        // Update State Machine
        if (this.fsm) {
            this.fsm.update(time, delta);
        }

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
    constructor(scene, x, y) {
        super(scene, x, y, ASSETS.ENEMY_ATLAS, 'jumper-idle1.png');

        // Agregar al sistema de física (CRÍTICO para pooling)
        scene.physics.add.existing(this);

        this.setDepth(20);
        this.isDead = false;

        // Strategy Pattern: Jump + Shoot behaviors
        this.jumpBehavior = new JumpBehavior(this, ENEMY_CONFIG.JUMPER.JUMP_FORCE);
        this.shootBehavior = new ShootBehavior(this);

        this.fsm = new StateMachine('jump', this);
        this.fsm.addState('jump', {
            onEnter: () => {
                this.play('jumper_jump', true);
            },
            onUpdate: () => {
                if (!this.anims.isPlaying) {
                    this.play('jumper_jump', true);
                }
            }
        })
            .addState('attack', {
                onEnter: () => {
                    this.play('jumper_attack', true);
                    this.once('animationcomplete', () => {
                        if (this.fsm.currentState === 'attack' && !this.isDead) {
                            this.fsm.setState('jump');
                        }
                    });
                }
            })
            .addState('die', {
                onEnter: () => {
                    this.stopBehavior();
                    this.body.checkCollision.none = true;
                    this.play('enemy_die', true);
                    this.once('animationcomplete', () => {
                        this.destroy();
                    });
                }
            });
        this.fsm.start();
    }

    spawn(x, y) {
        // Reset physics body
        this.body.reset(x, y);

        this.setScale(1);

        // Body dimensions based on sprite size 29x24
        if (this.body) {
            this.body.setSize(29, 24);
            this.body.setOffset(0, 0);
        }

        // La gravedad se hereda del mundo (1200)
        // Solo necesitamos asegurar que no sea immovable
        this.body.immovable = false;

        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);
        this.setVelocityY(0);

        // Reset behaviors
        this.stopBehavior();

        // Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });

        this.fsm.setState('jump');
    }

    despawn() {
        this.stopBehavior();
        if (this.body) {
            this.setVelocityX(0);
            this.setVelocityY(0);
        }
        this.setScale(1);
        if (this.scene && this.scene.jumperShooterEnemies) {
            this.scene.jumperShooterEnemies.remove(this);
        }
        this.setActive(false);
        this.setVisible(false);
    }

    startBehavior(projectilesGroup) {
        this.stopBehavior();
        this.jumpBehavior.startJumping(ENEMY_CONFIG.JUMPER.JUMP_INTERVAL_MIN, ENEMY_CONFIG.JUMPER.JUMP_INTERVAL_MAX);
        this.shootBehavior.startShooting(projectilesGroup, this.scene.currentHeight || 0);
    }

    stopBehavior() {
        this.jumpBehavior.stopJumping();
        this.shootBehavior.stopShooting();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Face Player
        if (this.scene && this.scene.player && this.scene.player.active && !this.isDead) {
            this.setFlipX(this.scene.player.x < this.x);
        }


        // Cleanup offscreen
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

    attack() {
        if (!this.isDead && this.fsm.currentState !== 'attack') {
            this.fsm.setState('attack');
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.fsm.setState('die');
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
}
