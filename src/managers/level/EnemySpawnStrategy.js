import { ENEMY_CONFIG } from '../../config/EnemyConfig.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';

/**
 * Strategy responsible for determining if and which enemy to spawn on a platform.
 */
export class EnemySpawnStrategy {
    /**
     * @param {Phaser.Scene} scene - The game scene.
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Attempts to spawn an enemy on the given platform based on probabilities.
     * @param {Phaser.GameObjects.Sprite} platform - The target platform.
     * @param {Object} options - Options including isMoving and spawnChances.
     * @returns {boolean} True if an enemy was spawned, false otherwise.
     */
    trySpawn(platform, options = {}) {
        const { isMoving = false, spawnChances = {} } = options;

        // Rule 1: Enemies never spawn on moving platforms
        if (isMoving) return false;

        // Rule 2: Platform must be valid and active
        if (!platform || !platform.active) return false;

        // Unpack configuration from SlotGenerator
        // SlotGenerator passes { enemies: 0.4, distribution: { patrol: 50, shooter: 50... } }
        const totalChance = spawnChances.enemies || 0;
        const distribution = spawnChances.distribution || { patrol: 100, shooter: 0, jumper: 0 };

        if (totalChance <= 0) return false;

        // Step 1: Check if ANY enemy spawns based on total chance
        if (Math.random() > totalChance) return false;

        // Step 2: Determine WHICH enemy type based on distribution weights
        const typeRand = Math.random() * 100; // 0-100
        let cumulative = 0;

        // Check Patrol
        cumulative += (distribution.patrol || 0);
        if (typeRand < cumulative) {
            this._spawnPatrol(platform);
            return true;
        }

        // Check Shooter
        cumulative += (distribution.shooter || 0);
        if (typeRand < cumulative) {
            this._spawnShooter(platform);
            return true;
        }

        // Check Jumper
        cumulative += (distribution.jumper || 0);
        if (typeRand < cumulative) {
            this._spawnJumper(platform);
            return true;
        }

        return false;
    }

    /**
     * Spawns an enemy at a specific coordinate with optional constraints.
     * Used by MazeSpawner or other coordinate-based systems.
     * 
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Enemy type ('patrol', 'shooter', 'jumper')
     * @param {Object} context - Optional context { minX, maxX } for patrols
     * @returns {boolean} True if spawned
     */
    spawnInZone(x, y, type, context = {}) {
        if (type === 'patrol') {
            if (this.scene.patrolEnemyPool) {
                const enemy = this.scene.patrolEnemyPool.spawn(x, y);
                if (this.scene.patrolEnemies) this.scene.patrolEnemies.add(enemy, true);

                if (enemy && enemy.active && enemy.setPatrolBounds) {
                    const minX = context.minX ?? (x - 50);
                    const maxX = context.maxX ?? (x + 50);
                    const patrolSpeed = ENEMY_CONFIG.PATROL.SPEED;

                    if (minX < maxX) {
                        enemy.setPatrolBounds(minX, maxX, patrolSpeed);
                        enemy.patrol(minX, maxX, patrolSpeed);
                        return true;
                    }
                }
            }
        } else if (type === 'shooter') {
            if (this.scene.shooterEnemyPool) {
                const shooter = this.scene.shooterEnemyPool.spawn(x, y);
                if (this.scene.shooterEnemies) this.scene.shooterEnemies.add(shooter, true);

                const projectilesGroup = this.scene.projectilePool || this.scene.projectiles;
                if (shooter?.startShooting) shooter.startShooting(projectilesGroup, this.scene.currentHeight);
                return true;
            }
        } else if (type === 'jumper') {
            if (this.scene.jumperShooterEnemyPool) {
                const jumper = this.scene.jumperShooterEnemyPool.spawn(x, y);
                if (this.scene.jumperShooterEnemies) this.scene.jumperShooterEnemies.add(jumper, true);

                const projectilesGroup = this.scene.projectilePool || this.scene.projectiles;
                if (jumper?.startShooting) jumper.startShooting(projectilesGroup, this.scene.currentHeight);
                return true;
            }
        }
        return false;
    }

    /**
     * Internal helper to spawn a patrol enemy.
     * @private
     */
    _spawnPatrol(platform) {
        this.scene.time.delayedCall(200, () => {
            const enemy = this.scene.levelManager.spawnPatrol(platform);
            if (enemy && enemy.active) {
                const platformHalfWidth = (SLOT_CONFIG.platformWidth || 128) / 2;
                const enemyHalfWidth = ENEMY_CONFIG.PATROL.SIZE / 2;
                const margin = ENEMY_CONFIG.PATROL.BOUNDS_MARGIN;

                const minX = platform.x - platformHalfWidth + enemyHalfWidth + margin;
                const maxX = platform.x + platformHalfWidth - enemyHalfWidth - margin;
                const patrolSpeed = ENEMY_CONFIG.PATROL.SPEED;

                if (minX >= maxX) return;

                // Slightly delayed patrol init to ensure physics sync
                this.scene.time.delayedCall(300, () => {
                    if (enemy && enemy.active && enemy.body) {
                        if (enemy.setPatrolBounds) enemy.setPatrolBounds(minX, maxX, patrolSpeed);
                        if (enemy.patrol) enemy.patrol(minX, maxX, patrolSpeed);
                    }
                });
            }
        });
    }

    /**
     * Internal helper to spawn a shooter enemy.
     * @private
     */
    _spawnShooter(platform) {
        this.scene.time.delayedCall(200, () => {
            this.scene.levelManager.spawnShooter(platform);
        });
    }

    /**
     * Internal helper to spawn a jumper enemy.
     * @private
     */
    _spawnJumper(platform) {
        this.scene.time.delayedCall(200, () => {
            this.scene.levelManager.spawnJumperShooter(platform);
        });
    }
}
