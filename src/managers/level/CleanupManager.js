/**
 * CleanupManager.js
 * 
 * Handles cleaning up off-screen objects and managing object pools.
 * Refactored from LevelManager.js.
 */
export class CleanupManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Cleans up old objects (platforms, enemies, coins, etc.)
     * @param {number} limitY - The Y coordinate limit (usually below player). Objects below this are removed.
     */
    cleanup(limitY) {
        // Solo desactivar si está explícitamente deshabilitado (no por showSlotLogs)
        if (this.scene.registry?.get('disableCleanup') || this.scene.disableCleanup) {
            return;
        }
        const scene = this.scene;

        // Cleanup plataformas
        const platformsToRemove = scene.platformPool
            .getActive()
            .filter(p => p.y > limitY);
        platformsToRemove.forEach(p => {
            // OPTIMIZATION: Logs removed - only show if explicitly debugging cleanup
            // if (scene.registry?.get('showSlotLogs')) {
            //     console.log('[CleanupManager] Despawning platform y=', p.y, 'limitY=', limitY);
            // }
            if (scene.platforms) scene.platforms.remove(p);
            scene.platformPool.despawn(p);
        });

        // Cleanup enemigos
        this._cleanupPool(scene.patrolEnemyPool, scene.patrolEnemies, limitY);
        this._cleanupPool(scene.shooterEnemyPool, scene.shooterEnemies, limitY);
        this._cleanupPool(scene.jumperShooterEnemyPool, scene.jumperShooterEnemies, limitY);

        // Cleanup coins
        if (scene.coins && scene.coins.children) {
            scene.coins.children.each(coin => {
                if (coin.active && coin.y > limitY) {
                    if (scene.coinPool) scene.coinPool.despawn(coin);
                    else coin.destroy();
                }
            });
        }

        // Cleanup maze walls (static objects)
        if (scene.mazeWalls && scene.mazeWalls.children) {
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

        // Cleanup powerups
        if (scene.powerups && scene.powerups.children) {
            scene.powerups.children.each(powerup => {
                if (powerup.active && powerup.y > limitY) {
                    if (scene.powerupPool) scene.powerupPool.despawn(powerup);
                    else powerup.destroy();
                }
            });
        }

        // Trim inactive objects to save memory
        this._trimPools();
    }

    /**
     * Helper to cleanup standard pools
     */
    _cleanupPool(pool, group, limitY) {
        if (!pool) return;
        const toRemove = pool.getActive().filter(e => e.y > limitY);
        toRemove.forEach(e => {
            if (group) group.remove(e);
            pool.despawn(e);
        });
    }

    /**
     * Mantiene algunos objetos disponibles pero sin ser agresivos para evitar vaciar el pool en runs largos.
     */
    _trimPools() {
        const scene = this.scene;
        const trimInactive = (pool, keep = 5) => {
            if (pool?.trim) {
                pool.trim(keep);
            }
        };

        trimInactive(scene.platformPool, 30);
        trimInactive(scene.patrolEnemyPool, 20);
        trimInactive(scene.shooterEnemyPool, 15);
        trimInactive(scene.jumperShooterEnemyPool, 15);
        trimInactive(scene.coinPool, 40);
        trimInactive(scene.powerupPool, 20);
        trimInactive(scene.projectilePool, 40);
    }
}
