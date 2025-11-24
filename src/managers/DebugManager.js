export class DebugManager {
    constructor(scene) {
        this.scene = scene;
        // DEBUG SETTINGS
        this.debugStartHeight = 3000; // Set to > 0 to start at that height
        this.enableTestEnemies = false; // Set to true to spawn test enemies
        this.enableLavaDelay = false; // Give player time to react at start
    }

    applyDebugSettings() {
        const scene = this.scene;

        // Apply Height Offset
        if (this.debugStartHeight > 0) {
            scene.heightOffset = this.debugStartHeight;
            scene.currentHeight = this.debugStartHeight;
        }

        // Apply Lava Delay
        if (this.enableLavaDelay && scene.lavaManager && scene.lavaManager.lava) {
            // Move lava further down (e.g., 1500px below player instead of 500px)
            // This gives the player a few seconds while the lava catches up
            scene.lavaManager.lava.y = scene.player.y + 1500;
        }

        // Spawn Test Enemies if enabled
        if (this.enableTestEnemies) {
            this.spawnTestEnemies();
        }
    }

    spawnTestEnemies() {
        const scene = this.scene;
        const levelManager = scene.levelManager;

        // Start generating much higher to leave room for test enemies
        levelManager.lastPlatformY = -500;

        let platforms = [];
        let attempts = 0;

        // Generate rows until we have at least 3 platforms
        while (platforms.length < 3 && attempts < 10) {
            // We need generateNextRow to return the platform it created.
            // Currently LevelManager.generateNextRow returns 'null' or doesn't return the platform explicitly 
            // if it spawns a coin or gap.
            // We might need to modify LevelManager or just inspect the group.

            let initialCount = scene.platforms.getLength();
            levelManager.generateNextRow();
            let newCount = scene.platforms.getLength();

            if (newCount > initialCount) {
                // A platform was added
                platforms.push(scene.platforms.getLast(true));
            }
            attempts++;
        }

        // --- TEST ENEMIES ---
        // Spawn enemies on the generated platforms
        if (platforms.length > 0) {
            // Jumper Shooter Enemy (Closest to player)
            levelManager.spawnJumperShooter(platforms[0]);
        }

        if (platforms.length > 1) {
            // Shooter Enemy (Middle)
            levelManager.spawnShooter(platforms[1]);
        }

        if (platforms.length > 2) {
            // Spike Enemy (Highest)
            levelManager.spawnSpike(platforms[2]);
        }
    }
}
