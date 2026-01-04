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
            if (scene.registry?.get('showSlotLogs')) {
                console.log('[CleanupManager] Despawning platform y=', p.y, 'limitY=', limitY);
            }
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
     * OPTIMIZACIÓN: Solo hacer trim cada N frames para reducir overhead
     */
    _trimPools() {
        const scene = this.scene;
        
        // Solo hacer trim cada 60 frames (~1 segundo a 60fps) para reducir overhead
        if (!scene._cleanupFrameCount) scene._cleanupFrameCount = 0;
        scene._cleanupFrameCount++;
        
        if (scene._cleanupFrameCount % 60 !== 0) {
            return; // Skip trim este frame
        }
        
        const trimInactive = (pool, keep = 5) => {
            if (pool?.trim) {
                pool.trim(keep);
            }
        };

        // Valores reducidos para mantener menos objetos en memoria
        trimInactive(scene.platformPool, 20);  // Reducido de 30 a 20
        trimInactive(scene.patrolEnemyPool, 15);  // Reducido de 20 a 15
        trimInactive(scene.shooterEnemyPool, 10);  // Reducido de 15 a 10
        trimInactive(scene.jumperShooterEnemyPool, 10);  // Reducido de 15 a 10
        trimInactive(scene.coinPool, 30);  // Reducido de 40 a 30
        trimInactive(scene.powerupPool, 15);  // Reducido de 20 a 15
        trimInactive(scene.projectilePool, 30);  // Reducido de 40 a 30
    }
}
