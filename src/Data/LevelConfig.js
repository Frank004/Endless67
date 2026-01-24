export const LEVEL_CONFIG = {
    world1: {
        name: "Magma Caverns",
        baseSettings: {
            platforms: {
                staticOnly: true,
                movingChance: 0,
                movingSpeed: 0,
                width: 140,
                zigzagChance: 20
            },
            lava: {
                speed: -41
            }
        },
        // Progression defined by height ranges (minHeight inclusive, meters/units)
        // User-defined detailed progression list
        progression: [
            // 1. Training (Static, Coins only)
            {
                minHeight: 0,
                maxHeight: 300,
                description: "Training: Static Only",
                platforms: { staticOnly: true, movingChance: 0, width: 150, zigzagChance: 0 },
                enemies: { spawnChance: 0, types: [] },
                maze: { enabled: false },
                lava: { speed: -40 },
                mechanics: { powerups: false, coins: true, coinChance: 60 }
            },
            // 2. Moving Platforms
            {
                minHeight: 300,
                maxHeight: 600,
                description: "Intro: Moving Platforms",
                platforms: { staticOnly: false, movingChance: 40, movingSpeed: 80, width: 140, zigzagChance: 20 },
                enemies: { spawnChance: 0, types: [] },
                maze: { enabled: false },
                lava: { speed: -41 },
                mechanics: { powerups: false, coins: true, coinChance: 60 }
            },
            // 3. Powerups Introduction
            {
                minHeight: 600,
                maxHeight: 900,
                description: "Mechanics: Powerups",
                platforms: { staticOnly: false, movingChance: 40, movingSpeed: 90, width: 140, zigzagChance: 30 },
                enemies: { spawnChance: 0, types: [] },
                maze: { enabled: false },
                lava: { speed: -42 },
                mechanics: { powerups: true, powerupChance: 20, coins: true, coinChance: 60 } // High chance to intro
            },
            // 4. Patrol Enemies
            {
                minHeight: 900,
                maxHeight: 1300,
                description: "Intro: Patrol Enemies",
                platforms: { staticOnly: false, movingChance: 40, movingSpeed: 90, width: 130, zigzagChance: 30 },
                enemies: {
                    spawnChance: 30,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: false },
                lava: { speed: -43 }, // Was -55
                mechanics: { powerups: true, powerupChance: 10, coins: true, coinChance: 60 }
            },
            // 5. Safe Zone / Slow Riser Phase
            {
                minHeight: 1300,
                maxHeight: 1700,
                description: "Safe Zone: Riser Slows",
                platforms: { staticOnly: false, movingChance: 30, movingSpeed: 80, width: 130, zigzagChance: 20 },
                enemies: {
                    spawnChance: 20, // Reduced enemies
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: false },
                lava: { speed: -35 }, // SLOWER LAVA (RELIEF) - Kept same
                mechanics: { powerups: true, powerupChance: 15, coins: true, coinChance: 60 }
            },
            // 6. Maze Tutorial (No Enemies)
            {
                minHeight: 1700,
                maxHeight: 2100,
                description: "Intro: Maze (Safe)",
                platforms: { staticOnly: false, movingChance: 40, movingSpeed: 100, width: 120, zigzagChance: 40 },
                enemies: {
                    spawnChance: 30,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: true, chance: 15, patterns: 'easy', allowEnemies: false },
                lava: { speed: -45 }, // Was -60
                mechanics: { powerups: true, powerupChance: 10, coins: true, coinChance: 60 }
            },
            // 7. Full Pool (Moving + Maze + Patrols)
            {
                minHeight: 2100,
                maxHeight: 2500,
                description: "Mixed: Maze & Moving",
                platforms: { staticOnly: false, movingChance: 50, movingSpeed: 110, width: 110, zigzagChance: 50 },
                enemies: {
                    spawnChance: 35,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: true, chance: 20, patterns: 'easy', allowEnemies: false },
                lava: { speed: -46 }, // Was -70
                mechanics: { powerups: true, powerupChance: 10, coins: true, coinChance: 50 }
            },
            // 8. Maze Enemies Enabled
            {
                minHeight: 2500,
                maxHeight: 2900,
                description: "Danger: Enemies in Maze",
                platforms: { staticOnly: false, movingChance: 50, movingSpeed: 110, width: 110, zigzagChance: 50 },
                enemies: {
                    spawnChance: 40,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: true, chance: 25, patterns: 'medium', allowEnemies: true },
                lava: { speed: -47 }, // Was -80
                mechanics: { powerups: true, powerupChance: 10, coins: true, coinChance: 50 }
            },
            // 9. More Patrols
            {
                minHeight: 2900,
                maxHeight: 3300,
                description: "Challenge: High Patrols",
                platforms: { staticOnly: false, movingChance: 55, movingSpeed: 120, width: 100, zigzagChance: 50 },
                enemies: {
                    spawnChance: 60, // High spawn rate
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: { enabled: true, chance: 25, patterns: 'medium', allowEnemies: true },
                lava: { speed: -48 }, // Was -83
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 40 }
            },
            // 10. Shooter Introduction
            {
                minHeight: 3300,
                maxHeight: 3800,
                description: "Intro: Shooter Enemy",
                platforms: { staticOnly: false, movingChance: 50, movingSpeed: 120, width: 100, zigzagChance: 50 },
                enemies: {
                    spawnChance: 50,
                    types: ['shooter'],
                    distribution: { patrol: 0, shooter: 100, jumper: 0 }, // Exclusive
                    projectiles: { count: 1, speed: 'normal' }
                },
                maze: { enabled: true, chance: 30, patterns: 'medium', allowEnemies: true },
                lava: { speed: -49 }, // Was -88
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 40 }
            },
            // 11. More Shooters
            {
                minHeight: 3800,
                maxHeight: 4300,
                description: "Challenge: High Shooters",
                platforms: { staticOnly: false, movingChance: 60, movingSpeed: 130, width: 95, zigzagChance: 60 },
                enemies: {
                    spawnChance: 70, // Lots of firing
                    types: ['shooter'],
                    distribution: { patrol: 0, shooter: 100, jumper: 0 },
                    projectiles: { count: 2, speed: 'fast' }
                },
                maze: { enabled: true, chance: 30, patterns: 'medium', allowEnemies: true },
                lava: { speed: -50 }, // Was -92
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 40 }
            },
            // 12. Shooter + Patrol
            {
                minHeight: 4300,
                maxHeight: 4800,
                description: "Mixed: Shooter & Patrol",
                platforms: { staticOnly: false, movingChance: 60, movingSpeed: 130, width: 95, zigzagChance: 60 },
                enemies: {
                    spawnChance: 60,
                    types: ['patrol', 'shooter'],
                    distribution: { patrol: 50, shooter: 50, jumper: 0 }
                },
                maze: { enabled: true, chance: 30, patterns: 'medium', allowEnemies: true },
                lava: { speed: -52 }, // Was -96
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 30 }
            },
            // 13. Jumper Introduction
            {
                minHeight: 4800,
                maxHeight: 5300,
                description: "Intro: Jumper Enemy",
                platforms: { staticOnly: false, movingChance: 60, movingSpeed: 140, width: 90, zigzagChance: 60 },
                enemies: {
                    spawnChance: 50,
                    types: ['jumper'],
                    distribution: { patrol: 0, shooter: 0, jumper: 100 } // Exclusive
                },
                maze: { enabled: true, chance: 35, patterns: 'hard', allowEnemies: true },
                lava: { speed: -54 }, // Was -100
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 30 }
            },
            // 14. More Jumpers
            {
                minHeight: 5300,
                maxHeight: 5800,
                description: "Challenge: High Jumpers",
                platforms: { staticOnly: false, movingChance: 65, movingSpeed: 145, width: 90, zigzagChance: 70 },
                enemies: {
                    spawnChance: 70,
                    types: ['jumper'],
                    distribution: { patrol: 0, shooter: 0, jumper: 100 }
                },
                maze: { enabled: true, chance: 35, patterns: 'hard', allowEnemies: true },
                lava: { speed: -56 }, // Was -102
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 30 }
            },
            // 15. Jumper + Patrol
            {
                minHeight: 5800,
                maxHeight: 6300,
                description: "Mixed: Jumper & Patrol",
                platforms: { staticOnly: false, movingChance: 65, movingSpeed: 150, width: 90, zigzagChance: 70 },
                enemies: {
                    spawnChance: 65,
                    types: ['patrol', 'jumper'],
                    distribution: { patrol: 50, shooter: 0, jumper: 50 }
                },
                maze: { enabled: true, chance: 35, patterns: 'hard', allowEnemies: true },
                lava: { speed: -57 }, // Was -104
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 30 }
            },
            // 16. Jumper + Shooter
            {
                minHeight: 6300,
                maxHeight: 6800,
                description: "Mixed: Jumper & Shooter",
                platforms: { staticOnly: false, movingChance: 70, movingSpeed: 150, width: 85, zigzagChance: 70 },
                enemies: {
                    spawnChance: 65,
                    types: ['shooter', 'jumper'],
                    distribution: { patrol: 0, shooter: 50, jumper: 50 },
                    projectiles: { count: 2, speed: 'fast' }
                },
                maze: { enabled: true, chance: 35, patterns: 'hard', allowEnemies: true },
                lava: { speed: -58 }, // Was -105
                mechanics: { powerups: true, powerupChance: 8, coins: true, coinChance: 30 }
            },
            // 17. Chaos (All)
            {
                minHeight: 6800,
                maxHeight: 999999,
                description: "Endless Chaos",
                platforms: { staticOnly: false, movingChance: 75, movingSpeed: 160, width: 80, zigzagChance: 80 },
                enemies: {
                    spawnChance: 80,
                    types: ['patrol', 'shooter', 'jumper'],
                    distribution: { patrol: 33, shooter: 33, jumper: 34 },
                    projectiles: { count: 3, speed: 'extreme' }
                },
                maze: { enabled: true, chance: 40, patterns: 'hard', allowEnemies: true },
                lava: { speed: -60 }, // Max speed cap
                mechanics: { powerups: true, powerupChance: 5, coins: true, coinChance: 25 }
            }
        ]
    }
};

export function getLevelConfig(height) {
    const config = LEVEL_CONFIG.world1;
    // Find first tier where height is within range
    const tier = config.progression.find(p => height >= p.minHeight && height < p.maxHeight);
    // Return found tier or the last one (max difficulty)
    return tier || config.progression[config.progression.length - 1];
}
