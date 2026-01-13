import { GameInitializer } from '../../core/GameInitializer.js';

export class PlaygroundCleanup {
    constructor(scene) {
        this.scene = scene;
    }

    clearScene() {
        const scene = this.scene;
        console.log('[PlaygroundCleanup] clearScene called - Safe Cleanup');

        // 1. CLEAR GROUPS SAFELY
        if (scene.patrolEnemies) scene.patrolEnemies.clear(true, true);
        if (scene.shooterEnemies) scene.shooterEnemies.clear(true, true);
        if (scene.jumperShooterEnemies) scene.jumperShooterEnemies.clear(true, true);
        if (scene.projectiles) scene.projectiles.clear(true, true);
        if (scene.coins) scene.coins.clear(true, true);
        if (scene.powerups) scene.powerups.clear(true, true);

        // 2. MAZE CLEANUP
        if (scene.mazeWalls) {
            scene.mazeWalls.children.each(block => {
                if (block.visual) {
                    if (Array.isArray(block.visual)) {
                        block.visual.forEach(v => v.destroy());
                    } else if (block.visual.destroy) {
                        block.visual.destroy();
                    }
                }
            });
            scene.mazeWalls.clear(true, true);
        }

        // 3. PLATFORM CLEANUP (Preserve Permanent Floors)
        if (scene.platforms) {
            scene.platforms.children.each(p => {
                if (!p.getData('isPermanentFloor')) {
                    p.destroy();
                }
            });
        }

        // 4. CLEANUP ORPHANED VISUALS
        // Texture check: 'floor' is used for maze beams. 'platform' for generated.
        const allChildren = scene.children.list;
        for (let i = allChildren.length - 1; i >= 0; i--) {
            const child = allChildren[i];

            // Critical skips
            if (child === scene.player) continue;
            if (child === scene.cameras.main) continue;
            // Skip Dev Menu elements
            if (this.isDevMenuElement(child)) continue;

            const isMazeVisual = (child.texture && child.texture.key === 'floor' && child.depth >= 10 && child.depth <= 14);
            const isOrphanPlatform = (child.texture && child.texture.key === 'platform' && !child.getData('isPermanentFloor'));

            if (isMazeVisual || isOrphanPlatform) {
                child.destroy();
            }
        }

        // 5. FORCE INPUT RESET
        if (scene.inputManager) {
            scene.inputManager.jumpKey_wasDown = true;
            scene.inputManager.padA_wasDown = true;
            scene.inputManager.setExtendedCooldown(250);
        }
        if (scene.input.activePointer) scene.input.activePointer.isDown = false;

        // 6. RESET PLAYER & CAMERA
        const centerXV4 = scene.cameras.main.centerX;
        const resetY = scene.cameras.main.height - 48;
        scene.player.setPosition(centerXV4, resetY);
        scene.player.setVelocity(0, 0);
        if (scene.player.body) scene.player.body.setAllowGravity(true);
        scene.cameras.main.scrollY = 0;
        scene.currentHeight = 0;
        scene.heightOffset = 0;

        // 7. RESTORE WALLS
        GameInitializer.updateWalls(scene);

        // 8. RESTORE SAFE PLATFORM IF NEEDED
        // this.respawnSafePlatform(); // Removed: User wants to land on StageFloor

        console.log('[PlaygroundCleanup] Cleanup Complete');
    }

    isDevMenuElement(child) {
        // Delegate to scene's dev menu if it exists
        if (this.scene.devMenu && this.scene.devMenu.isMenuElement(child)) return true;

        // Fallback checks (legacy or direct refereces)
        if (child === this.scene.toggleBtn || child === this.scene.toggleBtnBg) return true;

        return false;
    }


}
