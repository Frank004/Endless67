
export class PlaygroundRules {
    constructor(scene) {
        this.scene = scene;
    }

    applyStartRules() {
        const scene = this.scene;

        // 1. DISABLE AUTOMATIC GENERATION (SlotGenerator)
        if (scene.slotGenerator) {
            scene.slotGenerator.reset();
            // Stub update to stop auto-generation ticks
            scene.slotGenerator.update = () => { };
        }

        // 2. DISABLE RISER (LAVA)
        if (scene.riserManager) {
            scene.riserManager.setEnabled(false);
            // We do NOT stub triggerRising so it can be toggled back on by DevMenu
        }

        // 3. OVERRIDE LEVELMANAGER
        // Disable row generation, but keep entity updates (moving platforms)
        if (scene.levelManager) {
            scene.levelManager.generateNextRow = () => { };
        }

        // 4. PREPARE PLAYER
        this.setupPlayer();
    }

    setupPlayer() {
        const scene = this.scene;
        if (scene.player && scene.player.body) {
            scene.player.body.setAllowGravity(true);
            scene.player.setVelocity(0, 0);

            const startX = scene.cameras.main.centerX;
            const startY = scene.cameras.main.height - 48;
            scene.player.setPosition(startX, startY);
        }
    }
}
