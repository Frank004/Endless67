/**
 * CleanupSystem.js
 * 
 * Handles cleaning up off-screen objects and managing object pools.
 * Also handles full game reset cleanup.
 */
export class CleanupSystem {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Cleans up old objects (platforms, enemies, coins, etc.) during gameplay.
     * @param {number} limitY - The Y coordinate limit (usually below player). Objects below this are removed.
     */
    cleanup(limitY) {
        // Only disable if explicitly disabled
        if (this.scene.registry?.get('disableCleanup') || this.scene.disableCleanup) {
            return;
        }
        const scene = this.scene;

        // Cleanup platforms
        const platformsToRemove = scene.platformPool
            .getActive()
            .filter(p => p.y > limitY);
        platformsToRemove.forEach(p => {
            if (scene.platforms) scene.platforms.remove(p);
            scene.platformPool.despawn(p);
        });

        // Cleanup enemies
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

        // Cleanup Debug Texts
        if (scene.children && scene.children.list) {
            const textsToRemove = scene.children.list.filter(child =>
                child.active &&
                child.type === 'Text' &&
                child.y > limitY &&
                child.scrollFactorX !== 0
            );

            textsToRemove.forEach(text => text.destroy());
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
     * Maintains some objects available but trims excess to save memory.
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

    /**
     * Clean up any residual objects from a previous game session.
     * Use this when restarting the scene.
     */
    resetGame() {
        const scene = this.scene;

        // Clean up pools (despawn all active objects)
        try {
            scene.platformPool?.despawnAll?.();
            scene.coinPool?.despawnAll?.();
            scene.powerupPool?.despawnAll?.();
            scene.patrolEnemyPool?.despawnAll?.();
            scene.shooterEnemyPool?.despawnAll?.();
            scene.jumperShooterEnemyPool?.despawnAll?.();
            scene.projectilePool?.despawnAll?.();
        } catch (e) {
            // Silently ignore pool cleanup errors
        }

        // Clean up Phaser groups
        try {
            scene.platforms?.clear?.(true, true);
            scene.coins?.clear?.(true, true);
            scene.powerups?.clear?.(true, true);
            scene.patrolEnemies?.clear?.(true, true);
            scene.shooterEnemies?.clear?.(true, true);
            scene.jumperShooterEnemies?.clear?.(true, true);
            scene.projectiles?.clear?.(true, true);
            scene.mazeWalls?.clear?.(true, true);
        } catch (e) {
            // Silently ignore group cleanup errors
        }

        // Clean up particle emitters
        try {
            [scene.dustEmitter, scene.sparkEmitter, scene.burnEmitter, scene.auraEmitter, scene.confettiEmitter].forEach(emitter => {
                if (emitter && typeof emitter.stop === 'function') {
                    emitter.stop();
                    emitter.killAll?.();
                }
            });
        } catch (e) {
            // Silently ignore emitter cleanup errors
        }

        // Reset managers and systems
        scene.slotGenerator?.reset?.();

        if (scene.riserManager) {
            scene.riserManager.setEnabled?.(false);
            if (scene.riserManager.riser?.destroy) {
                scene.riserManager.riser.destroy();
                scene.riserManager.riser = null;
            }
            scene.riserManager.hasStartedRising = false;
            scene.riserManager.initialPlayerY = undefined;
        }

        // Clean up timers
        scene.powerupTimer?.remove?.();
        scene.powerupTimer = null;

        // Stop all tweens
        scene.tweens?.killAll?.();

        // Reset camera
        if (scene.cameras?.main) {
            scene.cameras.main.stopFollow?.();
            scene.cameras.main.scrollX = 0;
            scene.cameras.main.scrollY = 0;
        }

        // Clean up UI Manager listeners
        scene.uiManager?.gameOverMenu?.reset?.();
        scene.uiManager?.destroy?.();

        // Clean up Audio Manager listeners
        scene.audioManager?.stopAudio?.();

        // Clean up stage props
        scene.stageProps?.destroy?.();

        // Clean up fog effect
        scene.fogEffect?.destroy?.();
    }
}
