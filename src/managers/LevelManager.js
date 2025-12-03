import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { MAZE_PATTERNS, MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS_HARD, MAZE_PATTERNS_NUMBERED } from '../data/MazePatterns.js';
import { getLevelConfig, LEVEL_CONFIG } from '../data/LevelConfig.js';
import { enablePlatformRider } from '../utils/platformRider.js';
import { WALLS } from '../config/GameConstants.js';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;

        // Level Generation State
        this.lastPlatformY = 500;
        this.lastPlatformX = null;
        this.mazeSequenceRemaining = 0;
        this.lastMazeSide = 0;
        this.justFinishedMaze = false;
        this.pendingMazeStart = false; // Flag para iniciar laberinto en próxima fila
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
        this.skippedLastPlatform = false;
    }

    generateNextRow() {
        const scene = this.scene;
        // FIX: Restore 160px vertical spacing (classic feel)
        let y = this.lastPlatformY - 160;
        let height = scene.currentHeight;

        // Get configuration for current height
        const config = getLevelConfig(height);

        // --- MAZE LOGIC ---
        let allowMaze = config.maze.enabled && this.platformsSinceLastMaze > 10;

        // 1. Continue existing maze
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

        // 2. Start new maze (if allowed and lucky)
        if (allowMaze && !this.justFinishedMaze && !this.pendingMazeStart && Phaser.Math.Between(0, 100) < config.maze.chance) {
            // Spawn Safety Platform BEFORE maze entrance
            const centerX = scene.cameras.main.centerX;
            this.spawnPlatform(centerX, y, 180, false); // Centered, wide, static
            this.lastPlatformY = y;
            this.lastPlatformX = centerX;
            this.platformsSinceLastMaze++;

            // Mark maze to start NEXT row
            this.pendingMazeStart = true;
            return;
        }

        // 3. Start Pending Maze
        if (this.pendingMazeStart) {
            this.pendingMazeStart = false;

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

            // Generate first row of maze
            const mazeFirstRowY = y;
            this.lastPlatformY = mazeFirstRowY;

            let mazeConfig = this.currentMazePattern[this.currentMazeRowIndex];
            if (this.mazeMirrorY) {
                mazeConfig = this.currentMazePattern[this.currentMazePattern.length - 1 - this.currentMazeRowIndex];
            }
            this.spawnMazeRowFromConfig(mazeFirstRowY, mazeConfig, config.maze.allowMovingPlatforms, config.maze.allowEnemies, this.currentMazeRowIndex, this.currentMazePattern);

            this.currentMazeRowIndex++;
            this.mazeSequenceRemaining--;
            this.lastPlatformY = mazeFirstRowY;

            this.platformsSinceLastMaze = 0; // Reset counter
            return;
        }

        this.justFinishedMaze = false;

        // --- NORMAL PLATFORM GENERATION ---

        // 4. Safety Platform AFTER Maze
        if (this.platformsSinceLastMaze === 0) {
            const centerX = scene.cameras.main.centerX;
            this.spawnPlatform(centerX, y, 180, false); // Centered, wide, static
            this.lastPlatformY = y;
            this.lastPlatformX = centerX;
            this.platformsSinceLastMaze++;
            return;
        }

        // 5. Normal Platform Logic
        let width = config.platforms.width;
        let isMoving = !config.platforms.staticOnly && Phaser.Math.Between(0, 100) < config.platforms.movingChance;

        // Calculate X position
        let x;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const centerX = scene.cameras.main.centerX;
        const halfMaxWidth = Math.ceil(width / 2) + 10;
        const minX = wallWidth + WALLS.MARGIN + halfMaxWidth;
        const maxX = gameWidth - wallWidth - WALLS.MARGIN - halfMaxWidth;

        // Tutorial Zone (0-300m): FORCE Spawn, Static, Easy
        if (height < 300) {
            if (this.lastPlatformX === null) {
                x = Phaser.Math.Between(minX, maxX);
            } else {
                // Ensure reachable but varied
                const dynamicMinX = Math.max(minX, this.lastPlatformX - this.maxHorizontalDelta);
                const dynamicMaxX = Math.min(maxX, this.lastPlatformX + this.maxHorizontalDelta);
                x = Phaser.Math.Between(dynamicMinX, dynamicMaxX);
            }

            let plat = this.spawnPlatform(x, y, width, false); // Always static
            this.lastPlatformY = y;
            this.lastPlatformX = x;
            this.platformsSinceLastMaze++;

            // High coin chance in tutorial
            if (plat && plat.active && Phaser.Math.Between(0, 100) < 60) {
                const coin = scene.coins.create(x, y - 40, 'coin');
                enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
            }
            return;
        }

        // Standard Generation (Post-Tutorial)
        // Zigzag Logic
        let zigzagChance = config.platforms.zigzagChance;
        if (this.lastPlatformX !== null && Phaser.Math.Between(0, 100) < zigzagChance) {
            if (this.lastPlatformX < centerX) {
                x = Phaser.Math.Between(centerX, maxX);
            } else {
                x = Phaser.Math.Between(minX, centerX);
            }
        } else {
            if (this.lastPlatformX === null) {
                x = Phaser.Math.Between(minX, maxX);
            } else {
                const dynamicMinX = Math.max(minX, this.lastPlatformX - this.maxHorizontalDelta);
                const dynamicMaxX = Math.min(maxX, this.lastPlatformX + this.maxHorizontalDelta);
                x = Phaser.Math.Between(dynamicMinX, dynamicMaxX);
            }
        }

        // Platform Spawn Chance
        let difficultyT = Math.min(height / this.worldHeightForMaxDifficulty, 1);
        let platformsPerScreen = Phaser.Math.Linear(
            this.minPlatformsPerScreen,
            this.maxPlatformsPerScreen,
            difficultyT
        );
        let basePlatformChance = (platformsPerScreen / 4.5) * 100;

        // Force spawn if we skipped the last one to prevent large gaps
        if (this.skippedLastPlatform) {
            basePlatformChance = 100;
        }

        if (Phaser.Math.Between(0, 100) <= basePlatformChance) {
            let plat = this.spawnPlatform(x, y, width, isMoving, config.platforms.movingSpeed);
            this.lastPlatformY = y;
            this.lastPlatformX = x;
            this.platformsSinceLastMaze++;
            this.skippedLastPlatform = false;

            // Enemies & Items
            if (plat && plat.active && Phaser.Math.Between(0, 100) < config.enemies.spawnChance) {
                let roll = Phaser.Math.Between(0, 100);
                let dist = config.enemies.distribution;
                if (roll < dist.patrol) this.spawnPatrol(plat);
                else if (roll < dist.patrol + dist.shooter) this.spawnShooter(plat);
                else this.spawnJumperShooter(plat);
            } else if (plat && plat.active) {
                // Powerups & Coins
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
                    let canSpawnCoin = true;
                    scene.coins.children.iterate(c => {
                        if (c.active && Math.abs(c.y - (y - 40)) < 80) canSpawnCoin = false;
                    });
                    if (canSpawnCoin && Phaser.Math.Between(0, 100) < 80) {
                        const coin = scene.coins.create(x, y - 40, 'coin');
                        enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                    }
                }
            }
        } else {
            // FIX: Siempre actualizar lastPlatformY incluso cuando no hay plataforma
            this.lastPlatformY = y;
            this.skippedLastPlatform = true;

            // Gap - maybe spawn a coin or powerup
            const gameWidth = scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;
            const minX = wallWidth + WALLS.MARGIN;
            const maxX = gameWidth - wallWidth - WALLS.MARGIN;
            let coinX = Phaser.Math.Between(minX, maxX);

            // Powerup Logic
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

            return null;
        }
    }

    spawnPlatform(x, y, width, isMoving, speed = 100) {
        const scene = this.scene;

        // Usar PoolManager si está disponible
        if (scene.platformPool) {
            // Spawn desde el pool
            const p = scene.platformPool.spawn(x, y, width, isMoving, speed);

            // Asegurar que está en el physics world (ya debería estar por el constructor)
            if (!p.body) {
                scene.physics.add.existing(p);
            }

            return p;
        }
        return null;
    }

    spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex = null, pattern = null) {
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
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

        // Spawning Items/Enemies - must respect side walls
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

                    // Usar PoolManager si está disponible
                    if (scene.patrolEnemyPool) {
                        const enemy = scene.patrolEnemyPool.spawn(enemyX, y - 60);
                        // Agregar al grupo legacy para compatibilidad
                        if (scene.patrolEnemies) {
                            scene.patrolEnemies.add(enemy, true);
                        }
                    } else {
                        // Método legacy
                        let enemy = scene.patrolEnemies.get(enemyX, y - 60);
                        if (enemy && enemy.body) {
                            enemy.spawn(enemyX, y - 60);
                        }
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

        // Usar PoolManager si está disponible
        if (scene.patrolEnemyPool) {
            const enemy = scene.patrolEnemyPool.spawn(ex, ey);
            // Agregar al grupo legacy para compatibilidad
            if (scene.patrolEnemies) {
                scene.patrolEnemies.add(enemy, true);
            }
            return enemy;
        } else {
            // Método legacy
            let enemy = scene.patrolEnemies.get(ex, ey);
            if (enemy) {
                enemy.spawn(ex, ey);
            }
            return enemy;
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

            // Usar PoolManager si está disponible
            if (scene.shooterEnemyPool) {
                const shooter = scene.shooterEnemyPool.spawn(ex, ey);
                // Agregar al grupo legacy para compatibilidad
                if (scene.shooterEnemies) {
                    scene.shooterEnemies.add(shooter, true);
                }
                // Iniciar disparo (usar pool de proyectiles si está disponible)
                const projectilesGroup = scene.projectilePool || scene.projectiles;
                shooter.startShooting(projectilesGroup, scene.currentHeight);
                return shooter;
            } else {
                // Método legacy
                let shooter = scene.shooterEnemies.get(ex, ey);
                if (shooter) {
                    shooter.spawn(ex, ey);
                    shooter.startShooting(scene.projectiles, scene.currentHeight);
                }
                return shooter;
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

            // Usar PoolManager si está disponible
            if (scene.jumperShooterEnemyPool) {
                const jumper = scene.jumperShooterEnemyPool.spawn(ex, ey);
                // Agregar al grupo legacy para compatibilidad
                if (scene.jumperShooterEnemies) {
                    scene.jumperShooterEnemies.add(jumper, true);
                }
                // Iniciar comportamiento (usar pool de proyectiles si está disponible)
                const projectilesGroup = scene.projectilePool || scene.projectiles;
                jumper.startBehavior(projectilesGroup);
                return jumper;
            } else {
                // Método legacy
                let jumper = scene.jumperShooterEnemies.get(ex, ey);
                if (jumper) {
                    jumper.spawn(ex, ey);
                    jumper.startBehavior(scene.projectiles);
                }
                return jumper;
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

        // Cleanup plataformas usando PoolManager (despawn en lugar de destroy)
        if (scene.platformPool) {
            const platformsToRemove = scene.platformPool
                .getActive()
                .filter(p => p.y > limitY);

            platformsToRemove.forEach(p => {
                // Remover del grupo legacy
                if (scene.platforms) {
                    scene.platforms.remove(p);
                }
                // Despawn al pool
                scene.platformPool.despawn(p);
            });
        } else {
            // Método legacy
            scene.platforms.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        }

        // Cleanup enemigos usando PoolManager
        if (scene.patrolEnemyPool) {
            const patrolEnemiesToRemove = scene.patrolEnemyPool
                .getActive()
                .filter(e => e.y > limitY);
            patrolEnemiesToRemove.forEach(e => {
                if (scene.patrolEnemies) scene.patrolEnemies.remove(e);
                scene.patrolEnemyPool.despawn(e);
            });
        }

        if (scene.shooterEnemyPool) {
            const shooterEnemiesToRemove = scene.shooterEnemyPool
                .getActive()
                .filter(e => e.y > limitY);
            shooterEnemiesToRemove.forEach(e => {
                if (scene.shooterEnemies) scene.shooterEnemies.remove(e);
                scene.shooterEnemyPool.despawn(e);
            });
        }

        if (scene.jumperShooterEnemyPool) {
            const jumperEnemiesToRemove = scene.jumperShooterEnemyPool
                .getActive()
                .filter(e => e.y > limitY);
            jumperEnemiesToRemove.forEach(e => {
                if (scene.jumperShooterEnemies) scene.jumperShooterEnemies.remove(e);
                scene.jumperShooterEnemyPool.despawn(e);
            });
        }

        // Cleanup proyectiles usando PoolManager
        if (scene.projectilePool) {
            const projectilesToRemove = scene.projectilePool
                .getActive()
                .filter(p => p.y > limitY || p.x < -50 || p.x > scene.cameras.main.width + 50);
            projectilesToRemove.forEach(p => {
                if (scene.projectiles) scene.projectiles.remove(p);
                scene.projectilePool.despawn(p);
            });
        }

        // Cleanup otros objetos (aún no tienen pooling)
        scene.coins.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.powerups.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.mazeWalls.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });

        // Update moving platforms - ahora se maneja en Platform.preUpdate()
        // Mantener código legacy para compatibilidad
        if (scene.platforms) {
            const gameWidth = scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;
            const minPlatformX = wallWidth + WALLS.PLATFORM_MARGIN;
            const maxPlatformX = gameWidth - wallWidth - WALLS.PLATFORM_MARGIN;

            scene.platforms.children.iterate((plat) => {
                if (plat && plat.active && plat.getData('isMoving')) {
                    let speed = plat.getData('speed') || 100;
                    if (plat.x < minPlatformX) plat.setVelocityX(speed);
                    else if (plat.x > maxPlatformX) plat.setVelocityX(-speed);
                }
            });
        }
    }
}
