import { MAZE_ROW_HEIGHT } from '../../data/MazePatterns.js';
import { WALLS } from '../../config/GameConstants.js';
import { ASSETS } from '../../config/AssetKeys.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';
import { getPlayableBounds } from '../../utils/playableBounds.js';
import { ENEMY_CONFIG } from '../../config/EnemyConfig.js';
import { MazeVisuals } from '../visuals/MazeVisuals.js';
import { ItemSpawnStrategy } from './ItemSpawnStrategy.js';
import { EnemySpawnStrategy } from './EnemySpawnStrategy.js';

/**
 * MazeSpawner
 * 
 * Responsibilities:
 * - Spawning maze rows (Physics bodies + Visuals via delegate).
 * - Calculating gaps and playable areas.
 * - Delegating item/enemy spawning to Strategies.
 */
export class MazeSpawner {
    constructor(scene) {
        this.scene = scene;
        this.mazeMirrorX = false;

        // Delegates
        this.visuals = new MazeVisuals(scene);
        this.itemStrategy = new ItemSpawnStrategy(scene);
        this.enemyStrategy = new EnemySpawnStrategy(scene);
    }

    spawnPattern(startY, pattern) {
        if (!pattern || !pattern.rows) return;

        let currentY = startY;
        const rowHeight = MAZE_ROW_HEIGHT;

        pattern.rows.forEach((rowConfig, index) => {
            this.spawnMazeRowFromConfig(currentY, rowConfig, true, true, index, pattern);
            currentY -= rowHeight; // Stack upwards
        });
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

        // Scaling logic
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

        const rowHeight = MAZE_ROW_HEIGHT;
        const leftX = leftPlayable;
        const rightX = rightPlayable;

        let w1Eff = w1;
        let w2Eff = w2;

        // Calculate Effective Widths based on Gap constraints
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

        // --- SPAWN WALLS (Physics) & VISUALS (Delegated) ---
        if (type === 'left') {
            let block = scene.mazeWalls.create(leftX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(0, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = [this.visuals.createFloorVisual(leftX, y, w1Eff, rowHeight, 0)];
            this.visuals.addJoint(leftX, y, true);
        } else if (type === 'right') {
            let block = scene.mazeWalls.create(rightX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(1, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = [this.visuals.createFloorVisual(rightX, y, w1Eff, rowHeight, 1)];
            this.visuals.addJoint(rightX, y, false);
        } else if (type === 'split') {
            let b1 = scene.mazeWalls.create(leftX, y, ASSETS.MAZE_BLOCK);
            b1.setOrigin(0, 0.5).setDisplaySize(w1Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            b1.visual = [this.visuals.createFloorVisual(leftX, y, w1Eff, rowHeight, 0)];
            this.visuals.addJoint(leftX, y, true);

            let b2 = scene.mazeWalls.create(rightX, y, ASSETS.MAZE_BLOCK);
            b2.setOrigin(1, 0.5).setDisplaySize(w2Eff, rowHeight).refreshBody().setDepth(10).setVisible(false);
            b2.visual = [this.visuals.createFloorVisual(rightX, y, w2Eff, rowHeight, 1)];
            this.visuals.addJoint(rightX, y, false);
        } else if (type === 'center') {
            let block = scene.mazeWalls.create(centerX, y, ASSETS.MAZE_BLOCK);
            block.setOrigin(0.5, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10).setVisible(false);
            block.visual = [this.visuals.createFloorVisual(centerX, y, w1, rowHeight, 0.5)];
        }

        // --- CALCULATE GAP & SEGMENTS ---
        let gapX = centerX;
        let gapStart = wallWidth;
        let gapEnd = gameWidth - wallWidth;
        let wallSegments = []; // For spawning enemies

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

        // --- SPAWN ITEMS (Delegate to Strategy) ---
        const { minX, maxX } = getPlayableBounds(scene, 32);
        const itemMargin = WALLS.WIDTH + WALLS.MARGIN + 16;
        const safeX = Phaser.Math.Clamp(gapX, Math.max(minX, itemMargin), Math.min(maxX, gameWidth - itemMargin));

        const ITEM_SIZE = 32;
        const ITEM_HALF = ITEM_SIZE / 2;
        const itemSeparation = 16;
        const blockTop = y - (rowHeight / 2);
        const itemY = blockTop - ITEM_HALF - itemSeparation;

        // Try spawning Powerup or Coin via Strategy
        const bonusAvailable = coinBudget && (coinBudget.used < (coinBudget.bonus ?? 0));

        // 1. Try 'auto' (usually Powerup > Coin)
        let spawnedType = this.itemStrategy.spawnInZone(safeX, itemY, 'auto');

        // 2. If nothing spawned but we have bonus, force a coin attempt
        if (!spawnedType && bonusAvailable) {
            const result = this.itemStrategy.spawnInZone(safeX, itemY, 'coin');
            if (result === 'coin') {
                coinBudget.used += 1;
            }
        }

        // --- SPAWN ENEMIES (Delegate to Strategy) ---
        if (wallSegments.length === 0 || !allowSpikes) return;

        let mazeConfig = scene.difficultyManager ? scene.difficultyManager.getMazeConfig() : { allowEnemies: true, enemyChance: 20 };
        if (!mazeConfig.allowEnemies) return;

        let tierEnemyConfig = scene.difficultyManager ? scene.difficultyManager.getEnemyConfig() : { distribution: { patrol: 100, shooter: 0 } };

        const enemySpawnChance = mazeConfig.enemyChance ?? 20;
        const enemyCountCfg = mazeConfig.enemyCount || { min: 1, max: 1 };
        let maxEnemiesRow = Phaser.Math.Between(enemyCountCfg.min ?? 1, enemyCountCfg.max ?? 1);
        maxEnemiesRow = Math.min(wallSegments.length, maxEnemiesRow);

        if (enemySpawnChance > 0 && maxEnemiesRow < 1) maxEnemiesRow = 1;

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
                        const enemyHalfHeight = ENEMY_CONFIG.PATROL.SIZE / 2;
                        const platformTop = y - rowHeight / 2;
                        const enemyY = platformTop - enemyHalfHeight;

                        // Weighted Selection (No Jumpers in Maze)
                        const dist = tierEnemyConfig.distribution || { patrol: 100, shooter: 0, jumper: 0 };
                        const mazeDistribution = {
                            patrol: dist.patrol || 0,
                            shooter: dist.shooter || 0,
                            jumper: 0
                        };

                        const totalWeight = mazeDistribution.patrol + mazeDistribution.shooter;
                        const r = Phaser.Math.Between(0, totalWeight);

                        let selectedType = 'patrol';
                        if (r > mazeDistribution.patrol) {
                            selectedType = 'shooter';
                        }

                        // Delegate spawning
                        this.enemyStrategy.spawnInZone(enemyX, enemyY, selectedType, { minX: safeMin, maxX: safeMax });

                        mazeBudget.spawned += 1;
                        if (mazeBudget.spawned >= mazeBudget.target) break;
                    }
                }
            });
        }
    }
}
