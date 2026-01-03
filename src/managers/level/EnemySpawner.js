import { SLOT_CONFIG } from '../../config/SlotConfig.js';
import { WALLS } from '../../config/GameConstants.js';
import { ENEMY_CONFIG } from '../../config/EnemyConfig.js';

/**
 * EnemySpawner.js
 * 
 * Responsibilities:
 * - Spawning enemies on platforms or at specific coordinates.
 * - Configuring enemy properties (patrol bounds, shooting, etc.).
 * - Using object pools for efficient spawning.
 */
export class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Spawns a patrol enemy on a platform.
     * @param {Object} platform - The platform to spawn on.
     * @returns {Object|null} The spawned enemy or null if failed.
     */
    spawnPatrol(platform) {
        const scene = this.scene;
        if (platform && platform.active === false) return;

        const pos = this._calculateSpawnPosition(platform, ENEMY_CONFIG.PATROL.SIZE);
        if (!pos) return null;

        const enemy = scene.patrolEnemyPool.spawn(pos.x, pos.y);
        if (enemy) {
            // Configure patrol bounds
            const platformHalfWidth = (SLOT_CONFIG.platformWidth || 128) / 2;
            const enemyHalfWidth = ENEMY_CONFIG.PATROL.SIZE / 2;
            const margin = ENEMY_CONFIG.PATROL.BOUNDS_MARGIN;
            const minX = pos.x - platformHalfWidth + enemyHalfWidth + margin;
            const maxX = pos.x + platformHalfWidth - enemyHalfWidth - margin;

            enemy.setPatrolBounds(minX, maxX, ENEMY_CONFIG.PATROL.SPEED);

            // Add to physics group
            if (scene.patrolEnemies) {
                scene.patrolEnemies.add(enemy, true);
            }

            // Start patrol behavior
            enemy.patrolBehavior.startPatrol(minX, maxX, ENEMY_CONFIG.PATROL.SPEED);
        }

        return enemy;
    }

    /**
     * Spawns a shooter enemy.
     * @param {Object} platform - The platform to spawn on (optional).
     * @returns {Object|null} The spawned shooter.
     */
    spawnShooter(platform) {
        const scene = this.scene;
        try {
            const pos = this._calculateSpawnPosition(platform, ENEMY_CONFIG.SHOOTER.SIZE);
            if (!pos) return null;

            const shooter = scene.shooterEnemyPool.spawn(pos.x, pos.y);
            if (scene.shooterEnemies) {
                scene.shooterEnemies.add(shooter, true);
            }
            const projectilesGroup = scene.projectilePool || scene.projectiles;
            if (shooter?.startShooting) {
                shooter.startShooting(projectilesGroup, scene.currentHeight);
            }
            return shooter;
        } catch (e) {
            console.warn('Error spawning shooter:', e);
            return null;
        }
    }

    /**
     * Spawns a jumper shooter enemy.
     * @param {Object} platform - The platform to spawn on (optional).
     * @returns {Object|null} The spawned jumper.
     */
    spawnJumperShooter(platform) {
        const scene = this.scene;

        // If platform is moving, spawn a normal patrol enemy instead (jumper might have issues with moving platforms)
        if (platform?.getData && platform.getData('isMoving')) {
            return this.spawnPatrol(platform);
        }

        try {
            const pos = this._calculateSpawnPosition(platform, ENEMY_CONFIG.JUMPER.SIZE);
            if (!pos) {
                console.error(`  ❌ ERROR: Invalid position for jumper`);
                return null;
            }

            const jumper = scene.jumperShooterEnemyPool.spawn(pos.x, pos.y);
            if (!jumper) {
                console.error('  ❌ ERROR: Failed to spawn jumper from pool');
                return null;
            }

            if (scene.jumperShooterEnemies) {
                scene.jumperShooterEnemies.add(jumper, true);
            }

            // IMPORTANTE: Delay para permitir que la física se estabilice antes de iniciar behaviors
            const projectilesGroup = scene.projectilePool || scene.projectiles;
            scene.time.delayedCall(300, () => {
                if (jumper && jumper.active && jumper.startBehavior) {
                    jumper.startBehavior(projectilesGroup);
                }
            });

            return jumper;
        } catch (e) {
            console.warn('Error spawning jumper shooter:', e);
            return null;
        }
    }

    /**
     * Internal helper to calculate spawn coordinates.
     * @private
     * @returns {Object|null} {x, y} or null if invalid
     */
    _calculateSpawnPosition(platform, enemySize) {
        const scene = this.scene;
        const ex = platform?.x ?? scene.cameras.main.centerX;

        let ey;
        if (platform) {
            const platformHalfHeight = (SLOT_CONFIG.platformHeight || 32) / 2;
            const platformTop = platform.y - platformHalfHeight;
            const enemyHalfHeight = enemySize / 2;
            ey = platformTop - enemyHalfHeight + 1; // 1px overlap
        } else {
            // Fallback if no platform provided (rare)
            const platY = scene.cameras.main.scrollY; // Example fallback
            ey = platY;
        }

        if (!isFinite(ey) || isNaN(ey)) {
            return null;
        }
        return { x: ex, y: ey };
    }
}
