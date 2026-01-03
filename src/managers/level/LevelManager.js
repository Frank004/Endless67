import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../../prefabs/Enemy.js';
import { PlatformSpawner } from './PlatformSpawner.js';
import { MazeSpawner } from './MazeSpawner.js';
import { EnemySpawner } from './EnemySpawner.js';
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

        // Cleanup plataformas
        const platformsToRemove = scene.platformPool
            .getActive()
            .filter(p => p.y > limitY);
        platformsToRemove.forEach(p => {
            if (scene.platforms) scene.platforms.remove(p);
            scene.platformPool.despawn(p);
        });

        // Cleanup enemigos
        const patrolEnemiesToRemove = scene.patrolEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        patrolEnemiesToRemove.forEach(e => {
            if (scene.patrolEnemies) scene.patrolEnemies.remove(e);
            scene.patrolEnemyPool.despawn(e);
        });

        const shooterEnemiesToRemove = scene.shooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        shooterEnemiesToRemove.forEach(e => {
            if (scene.shooterEnemies) scene.shooterEnemies.remove(e);
            scene.shooterEnemyPool.despawn(e);
        });

        const jumperEnemiesToRemove = scene.jumperShooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        jumperEnemiesToRemove.forEach(e => {
            if (scene.jumperShooterEnemies) scene.jumperShooterEnemies.remove(e);
            scene.jumperShooterEnemyPool.despawn(e);
        });

        // Cleanup coins
        scene.coins.children.each(coin => {
            if (coin.active && coin.y > limitY) {
                if (scene.coinPool) scene.coinPool.despawn(coin);
                else coin.destroy();
            }
        });

        // Cleanup maze walls (son estáticos, se destruyen cuando quedan muy abajo)
        if (scene.mazeWalls) {
            scene.mazeWalls.children.each(wall => {
                if (wall.active && wall.y > limitY) {
                    if (wall.visual) {
                        if (Array.isArray(wall.visual)) {
                            wall.visual.forEach(v => v?.destroy());
                        } else {
                            wall.visual.destroy();
                        }
                        wall.visual = null;
                    }
                    wall.destroy();
                }
            });
        }
        // Limpia decoradores huérfanos (placeholders sin colisión)

        // Cleanup powerups
        scene.powerups.children.each(powerup => {
            if (powerup.active && powerup.y > limitY) {
                if (scene.powerupPool) scene.powerupPool.despawn(powerup);
                else powerup.destroy();
            }
        });

        // Opcional: podar pools para reducir memoria tras un cleanup grande
        const trimInactive = (pool, keep = 5) => {
            if (pool?.trim) {
                pool.trim(keep);
            }
        };
        // Mantener algunos objetos disponibles pero sin ser agresivos para evitar vaciar el pool en runs largos
        trimInactive(scene.platformPool, 30);
        trimInactive(scene.patrolEnemyPool, 20);
        trimInactive(scene.shooterEnemyPool, 15);
        trimInactive(scene.jumperShooterEnemyPool, 15);
        trimInactive(scene.coinPool, 40);
        trimInactive(scene.powerupPool, 20);
        trimInactive(scene.projectilePool, 40);
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
