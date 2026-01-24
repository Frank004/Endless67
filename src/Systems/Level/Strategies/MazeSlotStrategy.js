import { SlotStrategy } from './SlotStrategy.js';
import { SLOT_CONFIG } from '../../../Config/SlotConfig.js';
import { MAZE_ROW_HEIGHT } from '../../../Data/MazePatterns.js';
import { WallDecorManager } from '../../Visuals/WallDecorManager.js';

/**
 * Strategy for generating Maze slots.
 * Handles the creation of grid-based layouts with walls, spikes, enemies, and coins.
 * @extends SlotStrategy
 */
export class MazeSlotStrategy extends SlotStrategy {
    constructor(scene) {
        super(scene);
        this.wallDecorManager = scene.wallDecorManager;
        if (!this.wallDecorManager) {
            console.warn('⚠️ MazeSlotStrategy: wallDecorManager missing in scene! Creating fallback.');
            this.wallDecorManager = new WallDecorManager(scene);
        }
    }

    /**
     * Generates a maze slot based on the provided layout data.
     * @param {Object} layoutData - The layout data calculated by GridGenerator.
     * @param {number} layoutData.yStart - The starting Y coordinate of the slot.
     * @param {number} layoutData.height - The height of the slot.
     * @param {Object} layoutData.data - Internal data containing pattern info.
     * @returns {Object} Result of generation (rowCount, patternName, etc.).
     */
    generate(layoutData) {
        const { yStart, height, yEnd } = layoutData;
        const internalData = layoutData.data || {};
        let pattern = internalData.pattern;

        // Fallback pattern
        if (!pattern || !Array.isArray(pattern) || pattern.length === 0) {
            console.warn('⚠️ MazeSlotStrategy: No pattern found, using default simple pattern');
            pattern = [
                [1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 0, 1, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 1, 0, 1, 0, 0, 1]
            ];
        }

        const config = SLOT_CONFIG.types.MAZE;
        const rowCount = config.rowCount || 5;
        const rowHeight = config.rowHeight || MAZE_ROW_HEIGHT;
        const rowGap = config.rowGap || 100;

        // SlotYEnd used for cleanup logic if needed, but LevelManager handles spawn
        const slotYEnd = yEnd;

        // Cleanup existing walls in this range (redundant if strict pooling used, but safe)
        if (this.scene.mazeWalls) {
            this.scene.mazeWalls.children.each(wall => {
                if (wall.active && wall.y <= yStart + 1 && wall.y >= slotYEnd - 1) {
                    wall.destroy();
                }
            });
        }

        const mazeColors = [0xff7777, 0x77ff77, 0x7777ff, 0xffcc66, 0x66ccff];
        const color = mazeColors[(layoutData.index || 0) % mazeColors.length]; // Use slot index for color cycle

        const verbose = this.scene?.registry?.get('showSlotLogs') === true;
        if (verbose) {
            console.log(`  🌀 Generando MAZE [${rowCount} filas] (Y: ${yStart} a ${slotYEnd})`);
        }

        const difficulty = this.scene.difficultyManager;
        const mazeConfig = difficulty ? difficulty.getMazeConfig() : { allowEnemies: false, enemyCount: { min: 0, max: 0 } };

        const allowEnemies = mazeConfig.allowEnemies;
        const enemyCountCfg = mazeConfig.enemyCount || { min: 1, max: 2 };
        const enemyChance = (mazeConfig.enemyChance ?? 40) / 100;

        const spawnEnemiesThisMaze = allowEnemies && Math.random() < enemyChance;
        const enemyBudget = {
            target: spawnEnemiesThisMaze ? Phaser.Math.Between(enemyCountCfg.min ?? 1, enemyCountCfg.max ?? 1) : 0,
            spawned: 0
        };

        const coinBudget = {
            bonus: 2,
            used: 0
        };

        for (let row = 0; row < rowCount; row++) {
            const rowY = yStart - (row * (rowHeight + rowGap));
            let rowConfig = pattern[row % pattern.length];

            this.scene.levelManager.spawnMazeRowFromConfig(
                rowY,
                rowConfig,
                false, // allowMoving
                true,  // allowSpikes / enemies
                row,
                pattern,
                color,
                enemyBudget,
                coinBudget
            );
        }

        // GENERATE WALL DECOR
        this.wallDecorManager.generateForSlot(yStart, height);

        return {
            rowCount,
            patternName: `MAZE_${layoutData.data.patternIndex}`,
            patternLength: pattern.length,
            contentHeight: height
        };
    }
}
