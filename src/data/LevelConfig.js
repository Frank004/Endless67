export const LEVEL_CONFIG = {
    world1: {
        name: "Magma Caverns",
        baseSettings: {
            gravity: 1200,
            // FIX: Valores estaban invertidos
            // minPlatformsPerScreen = niveles difíciles (menos plataformas)
            // maxPlatformsPerScreen = niveles fáciles (más plataformas)
            minPlatformsPerScreen: 3.0,  // Niveles difíciles
            maxPlatformsPerScreen: 4.5,  // Niveles fáciles (tutorial)
            worldHeightForMaxDifficulty: 4000,
            maxHorizontalDelta: 170
        },
        // Progression defined by height ranges (minHeight inclusive)
        progression: [
            {
                minHeight: 0,
                maxHeight: 300,
                description: "Tutorial Zone",
                platforms: {
                    staticOnly: true,
                    movingChance: 0,
                    width: 140,
                    zigzagChance: 20
                },
                enemies: {
                    spawnChance: 0,
                    types: []
                },
                maze: {
                    enabled: false,
                    chance: 0
                },
                lava: {
                    speed: -41
                },
                mechanics: {
                    wallJump: false,
                    powerups: true,
                    powerupChance: 10
                }
            },
            {
                minHeight: 300,
                maxHeight: 500,
                description: "Intro to Mechanics",
                platforms: {
                    staticOnly: true,
                    movingChance: 0,
                    width: 130,
                    zigzagChance: 30
                },
                enemies: {
                    spawnChance: 0,
                    types: []
                },
                maze: {
                    enabled: true,
                    chance: 15,
                    patterns: 'easy',
                    allowEnemies: false
                },
                lava: {
                    speed: -41
                },
                mechanics: {
                    wallJump: true,
                    powerups: false
                }
            },
            {
                minHeight: 500,
                maxHeight: 800,
                description: "Moving Platforms & Powerups",
                platforms: {
                    staticOnly: false,
                    movingChance: 20,
                    movingSpeed: 80, // Slow
                    width: 120,
                    zigzagChance: 30
                },
                enemies: {
                    spawnChance: 0,
                    types: []
                },
                maze: {
                    enabled: true,
                    chance: 15,
                    patterns: 'easy',
                    allowEnemies: false,
                    allowMovingPlatforms: true
                },
                lava: {
                    speed: -41
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 20 // Increased from 5 to ensure player sees it
                }
            },
            {
                minHeight: 800,
                maxHeight: 1500,
                description: "First Enemies (Spike Only)",
                platforms: {
                    staticOnly: false,
                    movingChance: 20,
                    movingSpeed: 80,
                    width: 110,
                    zigzagChance: 40
                },
                enemies: {
                    spawnChance: 20,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: {
                    enabled: true,
                    chance: 25,
                    patterns: 'easy',
                    allowEnemies: true,
                    enemyCount: { min: 0, max: 1 },
                    enemyChance: 40
                },
                lava: {
                    speed: -59
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 10
                }
            },
            {
                minHeight: 1500,
                maxHeight: 3000,
                description: "More Action (Spike Only)",
                platforms: {
                    staticOnly: false,
                    movingChance: 30,
                    movingSpeed: 100, // Normal
                    width: 100,
                    zigzagChance: 40
                },
                enemies: {
                    spawnChance: 30,
                    types: ['patrol'],
                    distribution: { patrol: 100, shooter: 0, jumper: 0 }
                },
                maze: {
                    enabled: true,
                    chance: 25,
                    patterns: 'easy',
                    allowEnemies: true,
                    enemyCount: { min: 1, max: 2 },
                    enemyChance: 40
                },
                lava: {
                    speed: -59
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 8
                }
            },
            {
                minHeight: 3000,
                maxHeight: 3500,
                description: "Shooter Introduction (Exclusive)",
                platforms: {
                    staticOnly: false,
                    movingChance: 40,
                    movingSpeed: 120,
                    width: 90,
                    zigzagChance: 50
                },
                enemies: {
                    spawnChance: 40,
                    types: ['shooter'],
                    distribution: { patrol: 0, shooter: 100, jumper: 0 }, // Exclusive
                    projectiles: { count: 1, speed: 'normal' }
                },
                maze: {
                    enabled: true,
                    chance: 30,
                    patterns: 'medium',
                    allowEnemies: true,
                    enemyCount: { min: 1, max: 2 },
                    enemyChance: 60
                },
                lava: {
                    speed: -72
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 8
                }
            },
            {
                minHeight: 3500,
                maxHeight: 6000,
                description: "Shooters & Spikes Mixed",
                platforms: {
                    staticOnly: false,
                    movingChance: 50,
                    movingSpeed: 140,
                    width: 85,
                    zigzagChance: 60
                },
                enemies: {
                    spawnChance: 55,
                    types: ['patrol', 'shooter'],
                    distribution: { patrol: 50, shooter: 50, jumper: 0 }, // Mixed
                    projectiles: { count: 1, speed: 'normal' }
                },
                maze: {
                    enabled: true,
                    chance: 30,
                    patterns: 'hard',
                    allowEnemies: true,
                    enemyCount: { min: 1, max: 2 },
                    enemyChance: 60
                },
                lava: {
                    speed: -90
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 5
                }
            },
            {
                minHeight: 6000,
                maxHeight: 6500,
                description: "Jumper Introduction (Exclusive)",
                platforms: {
                    staticOnly: false,
                    movingChance: 60,
                    movingSpeed: 160,
                    width: 80,
                    zigzagChance: 70
                },
                enemies: {
                    spawnChance: 60,
                    types: ['jumper'],
                    distribution: { patrol: 0, shooter: 0, jumper: 100 }, // Exclusive
                    projectiles: { count: 2, speed: 'fast' }
                },
                maze: {
                    enabled: true,
                    chance: 35,
                    patterns: 'hard',
                    allowEnemies: true,
                    enemyCount: { min: 2, max: 3 },
                    enemyChance: 80
                },
                lava: {
                    speed: -90
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 5
                }
            },
            {
                minHeight: 6500,
                maxHeight: 999999,
                description: "Expert Mode (All Enemies)",
                platforms: {
                    staticOnly: false,
                    movingChance: 70,
                    movingSpeed: 180,
                    width: 80,
                    zigzagChance: 80
                },
                enemies: {
                    spawnChance: 70,
                    types: ['patrol', 'shooter', 'jumper'],
                    distribution: { patrol: 20, shooter: 40, jumper: 40 }, // All Mixed
                    projectiles: { count: 3, speed: 'very_fast' }
                },
                maze: {
                    enabled: true,
                    chance: 35,
                    patterns: 'hard',
                    allowEnemies: true,
                    enemyCount: { min: 2, max: 3 },
                    enemyChance: 90
                },
                lava: {
                    speed: -100
                },
                mechanics: {
                    wallJump: true,
                    powerups: true,
                    powerupChance: 5
                }
            }
        ]
    }
};

export function getLevelConfig(height) {
    const config = LEVEL_CONFIG.world1;
    const tier = config.progression.find(p => height >= p.minHeight && height < p.maxHeight) || config.progression[config.progression.length - 1];
    return tier;
}
