export function spawnTestEnemies(scene) {
    // Start generating much higher to leave room for test enemies
    scene.lastPlatformY = -500;

    let platforms = [];
    let attempts = 0;

    // Generate rows until we have at least 3 platforms
    while (platforms.length < 3 && attempts < 10) {
        let plat = scene.generateNextRow();
        if (plat) {
            platforms.push(plat);
        }
        attempts++;
    }

    // --- TEST ENEMIES ---
    // Spawn enemies on the generated platforms
    if (platforms.length > 0) {
        // Jumper Shooter Enemy (Closest to player)
        scene.spawnJumperShooter(platforms[0]);
    }

    if (platforms.length > 1) {
        // Shooter Enemy (Middle)
        scene.spawnShooter(platforms[1]);
    }

    if (platforms.length > 2) {
        // Spike Enemy (Highest)
        scene.spawnSpike(platforms[2]);
    }
    // --------------------
}
