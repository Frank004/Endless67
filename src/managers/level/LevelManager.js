import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../../prefabs/Enemy.js';
import { PlatformSpawner } from './PlatformSpawner.js';
import { MazeSpawner } from './MazeSpawner.js';
import { EnemySpawner } from './EnemySpawner.js';
import { CleanupManager } from './CleanupManager.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';
import { WALLS } from '../../config/GameConstants.js';

/**
 * LevelManager
 * 
 * Delegator for level generation tasks.
 * Retained for legacy support of:
 * - spawnPlatform() (via PlatformSpawner)
 * - Enemy/Maze spawning delegation
 */
export class LevelManager {
    constructor(scene) {
        this.scene = scene;

        // Sub-managers
        this.platformSpawner = new PlatformSpawner(scene);
        this.mazeSpawner = new MazeSpawner(scene);
        this.enemySpawner = new EnemySpawner(scene);
        this.cleanupManager = new CleanupManager(scene);

        // Enemy Pools are managed in Game.js and accessed via this.scene.patrolEnemyPool etc.
    }

    /**
     * Spawns a platform using PlatformSpawner.
     */
    spawnPlatform(x, y, width, isMoving, speed = 100) {
        return this.platformSpawner.spawn(x, y, width, isMoving, speed);
    }

    /**
     * Delegates to MazeSpawner.
     */
    spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex = null, pattern = null, tintColor = null, enemyBudget = null, coinBudget = null) {
        return this.mazeSpawner.spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex, pattern, tintColor, enemyBudget, coinBudget);
    }

    spawnPatrol(platform) {
        return this.enemySpawner.spawnPatrol(platform);
    }

    spawnShooter(platform) {
        return this.enemySpawner.spawnShooter(platform);
    }

    spawnJumperShooter(platform) {
        return this.enemySpawner.spawnJumperShooter(platform);
    }

    /**
     * Cleanup de objetos viejos (plataformas, enemigos, coins, etc.)
     */
    cleanupOnly() {
        const scene = this.scene;
        const limitY = scene.player.y + 900;

        // Delegate to CleanupManager
        this.cleanupManager.cleanup(limitY);
    }

    /**
     * Update loop - Handles cleanup of off-screen objects.
     */
    update() {
        // Only perform cleanup
        this.cleanupOnly();
    }

    // logPlatformPlacement, checkItemOverlap removed (moved to PlatformSpawner)
}
