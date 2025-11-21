export function spawnTestEnemies(scene) {
    // Start generating much higher to leave room for test enemies
    scene.lastPlatformY = -300;
    for (let i = 0; i < 3; i++) scene.generateNextRow();

    // --- TEST ENEMIES ---
    // Jumper Shooter Enemy (Closest to player, Y=250)
    let pTest1 = scene.spawnPlatform(200, 250, 100, false);
    scene.spawnJumperShooter(pTest1);

    // Shooter Enemy (Middle, Y=50)
    let pTest2 = scene.spawnPlatform(300, 50, 100, false);
    scene.spawnShooter(pTest2);

    // Spike Enemy (Highest, Y=-150)
    let pTest3 = scene.spawnPlatform(100, -150, 100, false);
    scene.spawnSpike(pTest3);
    // --------------------
}
