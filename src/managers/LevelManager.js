import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { MAZE_PATTERNS, MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS_HARD, MAZE_PATTERNS_NUMBERED } from '../data/MazePatterns.js';
import { getLevelConfig, LEVEL_CONFIG } from '../data/LevelConfig.js';
import { enablePlatformRider } from '../utils/platformRider.js';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;

        // Level Generation State
        this.lastPlatformY = 500;
        this.lastPlatformX = null;
        this.mazeSequenceRemaining = 0;
        this.lastMazeSide = 0;
        this.justFinishedMaze = false;
        this.currentMazePattern = null;
        this.currentMazeRowIndex = 0;
        this.mazeMirrorX = false;
        this.mazeMirrorY = false;

        // Constants from Config
        const settings = LEVEL_CONFIG.world1.baseSettings;
        this.minPlatformsPerScreen = settings.minPlatformsPerScreen;
        this.maxPlatformsPerScreen = settings.maxPlatformsPerScreen;
        this.worldHeightForMaxDifficulty = settings.worldHeightForMaxDifficulty;
        this.maxHorizontalDelta = settings.maxHorizontalDelta;
        this.platformsSinceLastMaze = 0;
    }

    generateNextRow() {
        const scene = this.scene;
        let y = this.lastPlatformY - 160;
        let height = scene.currentHeight;

        // Get configuration for current height
        const config = getLevelConfig(height);

        // Maze Logic
        let allowMaze = config.maze.enabled && this.platformsSinceLastMaze > 10;

        // Continue existing maze
        if (this.mazeSequenceRemaining > 0) {
            let mazeConfig = this.currentMazePattern[this.currentMazeRowIndex];

            // Handle Vertical Mirroring
            if (this.mazeMirrorY) {
                mazeConfig = this.currentMazePattern[this.currentMazePattern.length - 1 - this.currentMazeRowIndex];
            }

            this.spawnMazeRowFromConfig(y, mazeConfig, config.maze.allowMovingPlatforms, config.maze.allowEnemies, this.currentMazeRowIndex, this.currentMazePattern);

            this.currentMazeRowIndex++;
            this.mazeSequenceRemaining--;
            this.lastPlatformY = y;
            this.justFinishedMaze = (this.mazeSequenceRemaining === 0);
            return;
        }

        // Start new maze
        if (allowMaze && !this.justFinishedMaze && Phaser.Math.Between(0, 100) < config.maze.chance) {
            // Spawn Safety Platform below maze entrance
            // This ensures the player has a safe landing spot before the maze starts
            const centerX = scene.cameras.main.centerX;
            this.spawnPlatform(centerX, y, 200, false); // Centered, wide, static
            this.lastPlatformY = y;

            // Select pattern based on difficulty
            let patternPool = MAZE_PATTERNS_EASY;
            if (config.maze.patterns === 'medium') patternPool = MAZE_PATTERNS_MEDIUM;
            else if (config.maze.patterns === 'hard') patternPool = MAZE_PATTERNS_HARD;

            // 50% chance to pick a numbered pattern if available
            if (MAZE_PATTERNS_NUMBERED.length > 0 && Phaser.Math.Between(0, 100) < 50) {
                patternPool = MAZE_PATTERNS_NUMBERED;
            }

            this.currentMazePattern = Phaser.Utils.Array.GetRandom(patternPool);
            this.mazeSequenceRemaining = this.currentMazePattern.length;
            this.currentMazeRowIndex = 0;

            // Randomize Mirroring
            this.mazeMirrorX = Phaser.Math.Between(0, 1) === 0;
            this.mazeMirrorY = Phaser.Math.Between(0, 1) === 0;

            this.generateNextRow(); // Recursively call to spawn first row immediately
            this.platformsSinceLastMaze = 0; // Reset counter
            return;
        }

        this.justFinishedMaze = false;

        // --- NORMAL PLATFORM GENERATION ---
        // Use config for platform width and moving chance
        let width = config.platforms.width;
        let isMoving = !config.platforms.staticOnly && Phaser.Math.Between(0, 100) < config.platforms.movingChance;

        // Calculate platform chance based on density (simplified for now, can be moved to config later)
        let difficultyT = Math.min(height / this.worldHeightForMaxDifficulty, 1);
        let platformsPerScreen = Phaser.Math.Linear(
            this.minPlatformsPerScreen,
            this.maxPlatformsPerScreen,
            difficultyT
        );
        let basePlatformChance = (platformsPerScreen / 4.5) * 100;

        let x;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = 32;
        const centerX = scene.cameras.main.centerX;
        // Límites de generación: respetar paredes (32px) + margen de seguridad (28px)
        const minX = wallWidth + 28; // 32px (wall) + 28px margen
        const maxX = gameWidth - wallWidth - 28; // gameWidth - 32px (wall) - 28px margen
        // Zigzag Pattern Logic from Config
        let zigzagChance = config.platforms.zigzagChance;
        if (this.lastPlatformX !== null && Phaser.Math.Between(0, 100) < zigzagChance) {
            // Force a position far from the last one (zigzag)
            if (this.lastPlatformX < centerX) {
                x = Phaser.Math.Between(centerX, maxX);
            } else {
                x = Phaser.Math.Between(minX, centerX);
            }
            } else {
                // Normal random placement logic
                if (this.lastPlatformX === null) {
                    x = Phaser.Math.Between(minX, maxX);
                } else {
                    // Usar límites dinámicos basados en el ancho del juego
                    const dynamicMinX = Math.max(minX, this.lastPlatformX - this.maxHorizontalDelta);
                    const dynamicMaxX = Math.min(maxX, this.lastPlatformX + this.maxHorizontalDelta);
                    x = Phaser.Math.Between(dynamicMinX, dynamicMaxX);
                }
            }

        if (Phaser.Math.Between(0, 100) < basePlatformChance) {
            let plat = this.spawnPlatform(x, y, width, isMoving, config.platforms.movingSpeed);
            this.lastPlatformY = y;
            this.lastPlatformX = x;
            this.platformsSinceLastMaze++;

            // Spawn Enemy on Platform using Config
            if (plat && plat.active && Phaser.Math.Between(0, 100) < config.enemies.spawnChance) {
                // Determine enemy type from distribution
                let roll = Phaser.Math.Between(0, 100);
                let dist = config.enemies.distribution;

                if (roll < dist.patrol) {
                    this.spawnPatrol(plat);
                } else if (roll < dist.patrol + dist.shooter) {
                    this.spawnShooter(plat);
                } else {
                    this.spawnJumperShooter(plat);
                }
            } else if (plat && plat.active) {
                // Try to spawn Powerup first
                let powerupChance = config.mechanics.powerups ? config.mechanics.powerupChance : 0;
                const timeCooldown = 15000;
                const heightCooldown = 500;
                const now = scene.time.now;

                if (scene.currentHeight - scene.lastPowerupSpawnHeight < heightCooldown || now - scene.lastPowerupTime < timeCooldown) {
                    powerupChance = 0;
                }

                if (Phaser.Math.Between(0, 100) < powerupChance) {
                    const powerup = scene.powerups.create(x, y - 50, 'powerup_ball');
                    enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
                    scene.lastPowerupSpawnHeight = scene.currentHeight;
                    scene.lastPowerupTime = now;
                } else {
                    // Spawn Coin if no enemy and no powerup
                    let canSpawnCoin = true;
                    scene.coins.children.iterate(c => {
                        if (c.active && Math.abs(c.y - (y - 40)) < 80) canSpawnCoin = false;
                    });

                    // Increased coin chance from 70 to 80
                    if (canSpawnCoin && Phaser.Math.Between(0, 100) < 80) {
                        const coin = scene.coins.create(x, y - 40, 'coin');
                        enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                    }
                }
            }
        } else {
            // Gap - maybe spawn a coin or powerup
            // Use dynamic bounds to respect walls
            const gameWidth = scene.cameras.main.width;
            const wallWidth = 32;
            const minX = wallWidth + 28;
            const maxX = gameWidth - wallWidth - 28;
            let coinX = Phaser.Math.Between(minX, maxX);

            // Powerup Logic from Config
            let powerupChance = config.mechanics.powerups ? config.mechanics.powerupChance : 0;
            const timeCooldown = 15000;
            const heightCooldown = 500;
            const now = scene.time.now;

            if (scene.currentHeight - scene.lastPowerupSpawnHeight < heightCooldown || now - scene.lastPowerupTime < timeCooldown) {
                powerupChance = 0;
            }

            if (Phaser.Math.Between(0, 100) < powerupChance) {
                const powerup = scene.powerups.create(coinX, y, 'powerup_ball');
                enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
                scene.lastPowerupSpawnHeight = scene.currentHeight;
                scene.lastPowerupTime = now;
            } else {
                // Coin Spacing Check
                let canSpawnCoin = true;
                scene.coins.children.iterate(c => {
                    if (c.active && Math.abs(c.y - y) < 80) canSpawnCoin = false;
                });

                if (canSpawnCoin) {
                    const coin = scene.coins.create(coinX, y, 'coin');
                    enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                }
            }

            this.lastPlatformY = y;
            return null;
        }
    }

    spawnPlatform(x, y, width, isMoving, speed = 100) {
        const scene = this.scene;
        let texture = isMoving ? 'platform_moving' : 'platform';
        let p = scene.platforms.create(x, y, texture);
        p.setDisplaySize(width, 18).refreshBody().setDepth(5);

        // Moving Platform Physics
        if (isMoving) {
            p.setData('isMoving', true);
            p.setData('speed', speed); // Store speed for update loop
            p.setVelocityX(speed);
            p.setFrictionX(1);
            p.body.allowGravity = false;
            p.body.immovable = true;
            p.body.setBounce(1, 0);
            p.body.setCollideWorldBounds(true);
        }
        return p;
    }

    spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex = null, pattern = null) {
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = 32;
        const centerX = scene.cameras.main.centerX;
        let type = config.type;
        let w1 = config.width;
        let w2 = config.width2 || 0;

        // Handle Horizontal Mirroring
        if (this.mazeMirrorX) {
            if (type === 'left') type = 'right';
            else if (type === 'right') type = 'left';
            else if (type === 'split') {
                let temp = w1; w1 = w2; w2 = temp;
            }
        }

        // Spawn Walls based on type (maze walls are created from screen edges, but items must respect side walls)
        if (type === 'left') {
            let block = scene.mazeWalls.create(0, y, 'maze_block');
            block.setOrigin(0, 0.5).setDisplaySize(w1, 60).refreshBody().setDepth(10);
        } else if (type === 'right') {
            let block = scene.mazeWalls.create(gameWidth, y, 'maze_block');
            block.setOrigin(1, 0.5).setDisplaySize(w1, 60).refreshBody().setDepth(10);
        } else if (type === 'split') {
            let b1 = scene.mazeWalls.create(0, y, 'maze_block');
            b1.setOrigin(0, 0.5).setDisplaySize(w1, 60).refreshBody().setDepth(10);

            let b2 = scene.mazeWalls.create(gameWidth, y, 'maze_block');
            b2.setOrigin(1, 0.5).setDisplaySize(w2, 60).refreshBody().setDepth(10);
        } else if (type === 'center') {
            let block = scene.mazeWalls.create(centerX, y, 'maze_block');
            block.setOrigin(0.5, 0.5).setDisplaySize(w1, 60).refreshBody().setDepth(10);
        }

        // Spawning Items/Enemies - must respect side walls (wallWidth = 32px on each side)
        let gapX = centerX;
        let gapStart = wallWidth; // Start from left wall
        let gapEnd = gameWidth - wallWidth; // End at right wall

        // Define wall segments for enemy spawning
        let wallSegments = [];

        if (type === 'left') {
            gapStart = Math.max(wallWidth, w1); // Respect left wall
            gapEnd = gameWidth - wallWidth; // Respect right wall
            wallSegments.push({ min: wallWidth, max: Math.min(w1, gameWidth - wallWidth) }); // Wall segment within playable area
        } else if (type === 'right') {
            gapStart = wallWidth; // Respect left wall
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w1); // Respect right wall and maze wall
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w1), max: gameWidth - wallWidth }); // Wall segment within playable area
        } else if (type === 'split') {
            gapStart = Math.max(wallWidth, w1); // Respect left wall
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w2); // Respect right wall
            wallSegments.push({ min: wallWidth, max: Math.min(w1, gameWidth - wallWidth) }); // Left wall segment
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w2), max: gameWidth - wallWidth }); // Right wall segment
        } else if (type === 'center') {
            const leftGapEnd = centerX - w1 / 2;
            const rightGapStart = centerX + w1 / 2;
            const useLeftGap = Phaser.Math.Between(0, 1) === 0;
            gapStart = useLeftGap ? wallWidth : Math.max(wallWidth, rightGapStart); // Respect left wall
            gapEnd = useLeftGap ? Math.min(gameWidth - wallWidth, leftGapEnd) : gameWidth - wallWidth; // Respect right wall
            wallSegments.push({ min: Math.max(wallWidth, leftGapEnd), max: Math.min(gameWidth - wallWidth, rightGapStart) }); // Center wall segment
        }

        if (type !== 'center') {
            gapX = gapStart + (gapEnd - gapStart) / 2;
        } else {
            gapX = gapStart + (gapEnd - gapStart) / 2;
        }

        const gapWidth = Math.max(10, gapEnd - gapStart);
        const gapMargin = Math.min(20, gapWidth * 0.25);
        gapX = Phaser.Math.Clamp(gapX, gapStart + gapMargin, gapEnd - gapMargin);

        // Get Config for current height
        const levelConfig = getLevelConfig(scene.currentHeight);

        // Powerup Logic from Config
        let powerupChance = levelConfig.mechanics.powerups ? levelConfig.mechanics.powerupChance : 0;
        const timeCooldown = 15000;
        const heightCooldown = 500;
        const now = scene.time.now;

        if (scene.currentHeight - scene.lastPowerupSpawnHeight < heightCooldown || now - scene.lastPowerupTime < timeCooldown) {
            powerupChance = 0;
        }

        if (Phaser.Math.Between(0, 100) < powerupChance) {
            const powerup = scene.powerups.create(gapX, y - 50, 'powerup_ball');
            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
            scene.lastPowerupSpawnHeight = scene.currentHeight;
            scene.lastPowerupTime = now;
        } else {
            // 1. Dynamic Coin Spawning in Mazes: 80% chance
            if (Phaser.Math.Between(0, 100) < 80) {
                const coin = scene.coins.create(gapX, y - 50, 'coin');
                enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
            }
        }

        // Spawn enemies on WALLS (floors) - with validation
        if (wallSegments.length === 0 || !allowSpikes) {
            return;
        }

        // Enemy Spawning (Patrol Enemies only in maze)
        let enemySpawnChance = levelConfig.maze.enemyChance;
        let maxEnemies = Phaser.Math.Between(levelConfig.maze.enemyCount.min, levelConfig.maze.enemyCount.max);
        maxEnemies = Math.min(wallSegments.length, maxEnemies);

        // SKIP first row (rowIndex === 0) to prevent immediate danger/falling issues
        if (rowIndex > 0 && enemySpawnChance > 0 && Phaser.Math.Between(0, 100) < enemySpawnChance && scene.patrolEnemies.countActive() < maxEnemies) {
            Phaser.Utils.Array.Shuffle(wallSegments);

            for (let i = 0; i < maxEnemies; i++) {
                let segment = wallSegments[i];

                if (!segment || !segment.min || !segment.max) continue;

                let safeMin = segment.min + 20;
                let safeMax = segment.max - 20;

                if (safeMax > safeMin + 20) {
                    let enemyX = Phaser.Math.Between(safeMin, safeMax);
                    // Spawn higher to avoid spawning inside the wall (Wall height 60, top is y-30)
                    // y - 60 puts it well above to fall safely
                    let enemy = scene.patrolEnemies.get(enemyX, y - 60);

                    if (enemy && enemy.body) {
                        enemy.spawn(enemyX, y - 60);
                        // No manual patrol call needed - PatrolEnemy handles it via platformRider
                    }
                }
            }
        }
    }

    spawnPatrol(platform) {
        if (!platform || !platform.active) {
            console.warn('spawnPatrol: Invalid platform');
            return;
        }
        const scene = this.scene;
        let ex = platform.x;
        let ey = platform.y - 40; // Spawn higher to avoid embedding
        let enemy = scene.patrolEnemies.get(ex, ey);
        if (enemy) {
            enemy.spawn(ex, ey);
        }
    }

    spawnShooter(platform) {
        if (!platform || !platform.active) {
            console.warn('spawnShooter: Invalid platform');
            return;
        }
        const scene = this.scene;
        try {
            let ex = platform.x;
            let ey = platform.y - 20;
            let shooter = scene.shooterEnemies.get(ex, ey);
            if (shooter) {
                shooter.spawn(ex, ey);
                shooter.startShooting(scene.projectiles, scene.currentHeight);
            }
        } catch (e) {
            console.warn('Error spawning shooter:', e);
        }
    }

    spawnJumperShooter(platform) {
        if (!platform || !platform.active) {
            console.warn('spawnJumperShooter: Invalid platform');
            return;
        }
        if (platform.getData('isMoving')) {
            this.spawnPatrol(platform);
            return;
        }
        const scene = this.scene;
        try {
            let ex = platform.x;
            let ey = platform.y - 50;
            let jumper = scene.jumperShooterEnemies.get(ex, ey);
            if (jumper) {
                jumper.spawn(ex, ey);
                jumper.startBehavior(scene.projectiles);
            }
        } catch (e) {
            console.warn('Error spawning jumper shooter:', e);
        }
    }

    update() {
        const scene = this.scene;
        if (this.lastPlatformY > scene.cameras.main.scrollY - 300) {
            this.generateNextRow();
        }

        // Cleanup objects below the player
        const limitY = scene.player.y + 900;
        scene.platforms.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.coins.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.powerups.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.mazeWalls.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });

        // Update moving platforms
        const gameWidth = scene.cameras.main.width;
        const wallWidth = 32;
        const minPlatformX = wallWidth + 50; // 32px (wall) + 50px margen
        const maxPlatformX = gameWidth - wallWidth - 50; // gameWidth - 32px (wall) - 50px margen
        
        scene.platforms.children.iterate((plat) => {
            if (plat.getData('isMoving')) {
                let speed = plat.getData('speed') || 100; // Use stored speed or default
                if (plat.x < minPlatformX) plat.setVelocityX(speed);
                else if (plat.x > maxPlatformX) plat.setVelocityX(-speed);
            }
        });
    }
}
