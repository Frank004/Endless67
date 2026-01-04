import { MAZE_ROW_HEIGHT } from '../../data/MazePatterns.js';
import { WALLS, GAME_CONFIG } from '../../config/GameConstants.js';
import { ASSETS } from '../../config/AssetKeys.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';
import { getPlayableBounds } from '../../utils/playableBounds.js';
import { LEVEL_CONFIG } from '../../data/LevelConfig.js';

import { ENEMY_CONFIG } from '../../config/EnemyConfig.js';
import { enablePlatformRider } from '../../utils/platformRider.js';

/**
 * MazeSpawner
 * 
 * Responsabilidades:
 * - Spawning de filas de maze (paredes y suelo visual).
 * - Spawning de items y enemigos dentro del maze (usando LevelManager para enemigos por ahora).
 */
export class MazeSpawner {
    constructor(scene) {
        this.scene = scene;
        this.mazeMirrorX = false;
    }

    createMazeFloorVisual(x, y, width, height, originX = 0) {
        const scene = this.scene;
        if (!scene?.add?.tileSprite) return null;
        const centerFrames = ['floor-center-01.png', 'floor-center-02.png', 'floor-center-03.png', 'floor-center-04.png'];
        const frame = centerFrames[Math.floor(Math.random() * centerFrames.length)];
        const visualCenter = scene.add.tileSprite(x, y, width, height, ASSETS.FLOOR, frame);
        visualCenter.setOrigin(originX, 0.5);
        visualCenter.setDepth(12);
        return [visualCenter];
    }

    spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex = null, pattern = null, tintColor = null, enemyBudget = null, coinBudget = null) {
        const scene = this.scene;
        const bounds = getPlayableBounds(scene, MAZE_ROW_HEIGHT);
        const gameWidth = bounds.width;
        const TILE = 32;
        const wallWidth = WALLS.WIDTH;

        const leftPlayable = wallWidth;
        const rightPlayable = gameWidth - wallWidth;
        const playableWidth = Math.max(TILE, rightPlayable - leftPlayable);
        const centerX = (leftPlayable + rightPlayable) / 2;
        let type = config.type;

        const DESIGN_WIDTH = SLOT_CONFIG.designWidth || 400;
        const scaleRatio = gameWidth / DESIGN_WIDTH;
        const maxPlayableWidth = Math.max(TILE, playableWidth);
        const snap = (v) => Math.max(TILE, Math.floor(v / TILE) * TILE);
        let w1 = snap(Phaser.Math.Clamp((config.width || 0) * scaleRatio, TILE, maxPlayableWidth));
        let w2 = snap(Phaser.Math.Clamp((config.width2 || 0) * scaleRatio, TILE, maxPlayableWidth));
        const MIN_GAP = 96;

        // Handle Horizontal Mirroring
        if (this.mazeMirrorX) {
            if (type === 'left') type = 'right';
            else if (type === 'right') type = 'left';
            else if (type === 'split') {
                let temp = w1; w1 = w2; w2 = temp;
            }
        }

        const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT;
        const leftX = leftPlayable;
        const rightX = rightPlayable;

        let w1Eff = w1;
        let w2Eff = w2;

        // Ajustar anchos efectivos
        if (type === 'left' || type === 'right') {
            const maxWidthSide = snap(Math.max(TILE, playableWidth - MIN_GAP));
            w1Eff = snap(Math.min(w1Eff, maxWidthSide));
        } else if (type === 'split') {
            w1Eff = snap(w1Eff);
            w2Eff = snap(w2Eff);
            const maxTotal = snap(Math.max(TILE * 2, playableWidth - MIN_GAP));
            const total = w1Eff + w2Eff;
            if (total > maxTotal) {
                const scale = maxTotal / total;
                w1Eff = snap(Math.floor(w1Eff * scale));
                w2Eff = snap(Math.floor(w2Eff * scale));
            }
        }
        if (type === 'center') {
            const maxCenter = snap(Math.max(TILE, playableWidth - MIN_GAP));
            w1 = snap(Math.min(w1, maxCenter));
        }

        // Spawn Walls
        if (type === 'left') {
            const maxWidth = snap(Math.max(TILE, playableWidth - MIN_GAP));
            w1Eff = Math.min(w1Eff, maxWidth);
            let block = scene.mazeWalls.create(leftX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(0, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = this.createMazeFloorVisual(leftX, y, w1Eff, rowHeight, 0);
        } else if (type === 'right') {
            const maxWidth = snap(Math.max(TILE, playableWidth - MIN_GAP));
            w1Eff = Math.min(w1Eff, maxWidth);
            let block = scene.mazeWalls.create(rightX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(1, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = this.createMazeFloorVisual(rightX, y, w1Eff, rowHeight, 1);
        } else if (type === 'split') {
            let b1 = scene.mazeWalls.create(leftX, y, ASSETS.MAZE_BLOCK);
            b1.setOrigin(0, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            b1.visual = this.createMazeFloorVisual(leftX, y, w1Eff, rowHeight, 0);
            let b2 = scene.mazeWalls.create(rightX, y, ASSETS.MAZE_BLOCK);
            b2.setOrigin(1, 0.5).setDisplaySize(w2Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            b2.visual = this.createMazeFloorVisual(rightX, y, w2Eff, rowHeight, 1);
        } else if (type === 'center') {
            const maxCenter = snap(Math.max(TILE, playableWidth - MIN_GAP));
            w1 = snap(Math.min(w1, maxCenter));
            let block = scene.mazeWalls.create(centerX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(0.5, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = this.createMazeFloorVisual(centerX, y, w1, rowHeight, 0.5);
        }

        // Wall Segments for logic
        let gapX = centerX;
        let gapStart = wallWidth;
        let gapEnd = gameWidth - wallWidth;
        let wallSegments = [];

        if (type === 'left') {
            gapStart = Math.max(wallWidth, w1);
            gapEnd = gameWidth - wallWidth;
            wallSegments.push({ min: wallWidth, max: Math.min(w1Eff, gameWidth - wallWidth) });
        } else if (type === 'right') {
            gapStart = wallWidth;
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w1Eff);
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w1Eff), max: gameWidth - wallWidth });
        } else if (type === 'split') {
            gapStart = Math.max(wallWidth, w1Eff);
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w2Eff);
            wallSegments.push({ min: wallWidth, max: Math.min(w1Eff, gameWidth - wallWidth) });
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w2Eff), max: gameWidth - wallWidth });
        } else if (type === 'center') {
            const leftGapEnd = centerX - w1 / 2;
            const rightGapStart = centerX + w1 / 2;
            const useLeftGap = Phaser.Math.Between(0, 1) === 0;
            gapStart = useLeftGap ? wallWidth : Math.max(wallWidth, rightGapStart);
            gapEnd = useLeftGap ? Math.min(gameWidth - wallWidth, leftGapEnd) : gameWidth - wallWidth;
            wallSegments.push({ min: Math.max(wallWidth, leftGapEnd), max: Math.min(gameWidth - wallWidth, rightGapStart) });
        }

        gapX = gapStart + (gapEnd - gapStart) / 2;
        const gapWidth = Math.max(10, gapEnd - gapStart);
        const gapMargin = Math.min(20, gapWidth * 0.25);
        gapX = Phaser.Math.Clamp(gapX, gapStart + gapMargin, gapEnd - gapMargin);

        // Config checks
        let levelConfig = (scene.levelManager && scene.levelManager.difficultyManager)
            ? scene.levelManager.difficultyManager.getConfig(scene.currentHeight)
            : (LEVEL_CONFIG.world1?.progression?.[0] || {
                mechanics: { powerups: false, powerupChance: 0 },
                maze: { enemyChance: SLOT_CONFIG?.types?.MAZE?.spawnChances?.enemies ?? 0, enemyCount: { min: 0, max: 2 } }
            });

        // Powerups
        const isDev = scene.registry?.get('isDevMode');
        const baseMazePowerupChance = (SLOT_CONFIG?.types?.MAZE?.spawnChances?.powerups ?? 0) * 100;
        let powerupChance = levelConfig.mechanics.powerups ? levelConfig.mechanics.powerupChance : 0;
        powerupChance = Math.max(powerupChance, baseMazePowerupChance);
        const timeCooldown = isDev ? 0 : 8000;
        const heightCooldown = isDev ? 0 : 400;
        const now = scene.time.now;

        if (scene.currentHeight - scene.lastPowerupSpawnHeight < heightCooldown || now - scene.lastPowerupTime < timeCooldown) {
            powerupChance = 0;
        }

        if (Phaser.Math.Between(0, 100) < powerupChance) {
            const { minX, maxX } = getPlayableBounds(scene, 32);
            const safeX = Phaser.Math.Clamp(gapX, minX, maxX);
            
            // Calcular Y con separación adecuada desde el top del bloque del maze
            const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT || 64;
            const POWERUP_BASE_SIZE = 32; // Tamaño base del powerup
            const ITEM_HALF = POWERUP_BASE_SIZE / 2; // 16px
            const powerupSeparation = 16; // Separación desde el borde superior del bloque
            const blockTop = y - (rowHeight / 2);
            const powerupY = blockTop - ITEM_HALF - powerupSeparation;
            
            const powerup = scene.powerups.create(safeX, powerupY, ASSETS.POWERUP_BALL);
            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
            scene.lastPowerupSpawnHeight = scene.currentHeight;
            scene.lastPowerupTime = now;
        } else {
            // Coins
            const mazeCoinChance = SLOT_CONFIG?.types?.MAZE?.spawnChances?.coins ?? 0;
            const bonusAvailable = coinBudget && (coinBudget.used < (coinBudget.bonus ?? 0));
            const chance = isDev ? 1 : mazeCoinChance;
            if (Phaser.Math.FloatBetween(0, 1) < chance || bonusAvailable) {
                let coin = null;
                const itemMargin = WALLS.WIDTH + WALLS.MARGIN + 16;
                const safeX = Phaser.Math.Clamp(gapX, itemMargin, gameWidth - itemMargin);
                
                // Calcular Y con separación adecuada desde el top del bloque del maze
                // y es el centro del bloque, rowHeight/2 es la mitad hacia arriba, ITEM_HALF (16px) + 16px de separación
                const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT || 64;
                const COIN_BASE_SIZE = 32; // Tamaño base del coin
                const ITEM_HALF = COIN_BASE_SIZE / 2; // 16px
                const coinSeparation = 16; // Separación desde el borde superior del bloque
                const blockTop = y - (rowHeight / 2);
                const coinY = blockTop - ITEM_HALF - coinSeparation;
                
                if (scene.coinPool) {
                    coin = scene.coinPool.spawn(safeX, coinY);
                    if (coin && scene.coins) scene.coins.add(coin, true);
                } else if (scene.coins) {
                    coin = scene.coins.create(safeX, coinY, 'coin');
                }
                if (coin) {
                    enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                    if (bonusAvailable) {
                        coinBudget.used += 1;
                    }
                }
            }
        }

        // Enemies
        if (wallSegments.length === 0 || !allowSpikes) return;

        const mazeSpawnConfig = SLOT_CONFIG?.types?.MAZE?.spawnChances || {};
        const enemyChanceCfg = levelConfig.maze?.enemyChance;
        const enemyCountCfg = levelConfig.maze?.enemyCount ?? mazeSpawnConfig.enemyCount ?? { min: 1, max: 1 };
        const enemyTypes = mazeSpawnConfig.enemyTypes || { patrol: 1 };

        let enemySpawnChance = (enemyChanceCfg !== undefined) ? enemyChanceCfg : (mazeSpawnConfig.enemies ?? 0);
        let maxEnemiesRow = Phaser.Math.Between(enemyCountCfg.min ?? 1, enemyCountCfg.max ?? 1);
        maxEnemiesRow = Math.min(wallSegments.length, maxEnemiesRow);
        if (enemySpawnChance > 0 && maxEnemiesRow < 1) {
            maxEnemiesRow = 1;
        }

        const mazeBudget = enemyBudget || { target: maxEnemiesRow, spawned: 0 };

        if (rowIndex >= 0 && enemySpawnChance > 0 && mazeBudget.spawned < mazeBudget.target && scene.patrolEnemies.countActive() < maxEnemiesRow) {
            Phaser.Utils.Array.Shuffle(wallSegments);

            scene.time.delayedCall(100, () => {
                const remaining = mazeBudget.target - mazeBudget.spawned;
                const enemiesToSpawn = Math.min(remaining, wallSegments.length);
                for (let i = 0; i < enemiesToSpawn; i++) {
                    let segment = wallSegments[i];
                    if (!segment || !segment.min || !segment.max) continue;

                    let safeMin = segment.min + 10;
                    let safeMax = segment.max - 10;

                    if (safeMax > safeMin + 20) {
                        let enemyX = Phaser.Math.Between(safeMin, safeMax);
                        const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT || 60;
                        const enemyHalfHeight = ENEMY_CONFIG.PATROL.SIZE / 2;
                        const platformTop = y - rowHeight / 2;
                        const enemyY = platformTop - enemyHalfHeight;

                        const rType = Math.random();
                        const usePatrol = rType < (enemyTypes.patrol ?? 1);

                        // Delegar back a LevelManager (o EnemySpawner en el futuro)
                        if (usePatrol) {
                            if (scene.patrolEnemyPool) {
                                const enemy = scene.patrolEnemyPool.spawn(enemyX, enemyY);
                                if (scene.patrolEnemies) scene.patrolEnemies.add(enemy, true);
                                if (enemy && enemy.active && enemy.setPatrolBounds) {
                                    const margin = 4;
                                    const minBound = safeMin + margin;
                                    const maxBound = safeMax - margin;
                                    const patrolSpeed = ENEMY_CONFIG.PATROL.SPEED;
                                    if (minBound < maxBound) {
                                        enemy.setPatrolBounds(minBound, maxBound, patrolSpeed);
                                        enemy.patrol(minBound, maxBound, patrolSpeed);
                                    }
                                }
                            }
                        } else {
                            if (scene.shooterEnemyPool) {
                                const shooter = scene.shooterEnemyPool.spawn(enemyX, enemyY);
                                if (scene.shooterEnemies) scene.shooterEnemies.add(shooter, true);
                                const projectilesGroup = scene.projectilePool || scene.projectiles;
                                if (shooter?.startShooting) shooter.startShooting(projectilesGroup, scene.currentHeight);
                            }
                        }

                        mazeBudget.spawned += 1;
                        if (mazeBudget.spawned >= mazeBudget.target) {
                            break;
                        }
                    }
                }
            });
        }
    }
}
