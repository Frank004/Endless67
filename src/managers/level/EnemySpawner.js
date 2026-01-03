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

        // X position: center of the platform
        const ex = platform?.x ?? scene.cameras.main.centerX;

        // Y position: directly on top of the platform
        const platformHalfHeight = (SLOT_CONFIG.platformHeight || 32) / 2;
        const platformTop = platform.y - platformHalfHeight;
        const enemyHalfHeight = ENEMY_CONFIG.PATROL.SIZE / 2;
        const ey = platformTop - enemyHalfHeight + 1;  // 1px overlap to ensure contact

        if (!isFinite(ey) || isNaN(ey)) {
            console.error(`  ❌ ERROR: Invalid Y position for enemy: ${ey}`);
            return null;
        }

        const enemy = scene.patrolEnemyPool.spawn(ex, ey);
        if (enemy) {
            // Configure patrol bounds
            const platformHalfWidth = (SLOT_CONFIG.platformWidth || 128) / 2;
            const enemyHalfWidth = ENEMY_CONFIG.PATROL.SIZE / 2;
            const margin = ENEMY_CONFIG.PATROL.BOUNDS_MARGIN;
            const minX = ex - platformHalfWidth + enemyHalfWidth + margin;
            const maxX = ex + platformHalfWidth - enemyHalfWidth - margin;

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
            const ex = platform?.x ?? scene.cameras.main.centerX;
            const platY = platform?.y ?? scene.cameras.main.scrollY;
            const platHalfH = (SLOT_CONFIG.platformHeight || 32) / 2;
            const enemyHalfH = ENEMY_CONFIG.SHOOTER.SIZE / 2;
            const ey = platY - platHalfH - enemyHalfH + 1;

            const shooter = scene.shooterEnemyPool.spawn(ex, ey);
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
            const ex = platform?.x ?? scene.cameras.main.centerX;
            const ey = (platform?.y ?? scene.cameras.main.scrollY) - 50;

            const jumper = scene.jumperShooterEnemyPool.spawn(ex, ey);
            if (scene.jumperShooterEnemies) {
                scene.jumperShooterEnemies.add(jumper, true);
            }
            const projectilesGroup = scene.projectilePool || scene.projectiles;
            jumper.startBehavior(projectilesGroup);
            return jumper;
        } catch (e) {
            console.warn('Error spawning jumper shooter:', e);
            return null;
        }
    }
}
