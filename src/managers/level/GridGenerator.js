import { SLOT_CONFIG, getPlatformBounds } from '../../config/SlotConfig.js';
import { PatternTransformer } from '../../utils/PatternTransformer.js';
import { PLATFORM_PATTERNS, getRandomPattern, getRandomPatternExcluding } from '../../data/PlatformPatterns.js';
import { MAZE_ROW_HEIGHT, MAZE_PATTERNS, getRandomMazePattern, getRandomMazePatternExcluding } from '../../data/MazePatterns.js';

/**
 * GridGenerator.js
 * 
 * Pure Logic Component for Level Generation.
 * Decoupled from Phaser Scenes.
 * 
 * Responsible for:
 * 1. Calculating vertical layout (stacking slots).
 * 2. Determining slot types.
 * 3. Positioning internal elements (platforms/mazes) relative to the slot.
 */
export class GridGenerator {
    constructor(gameWidth = SLOT_CONFIG.gameWidth) {
        this.gameWidth = gameWidth;
        this.transformer = new PatternTransformer(gameWidth);

        // Internal State (only Y tracking, no index)
        this.lastSlotYEnd = null; // Start undefined

        // Pattern history to prevent immediate repetition
        this.lastPlatformPattern = null;
        this.lastMazePattern = null;
    }

    reset(startY) {
        this.lastSlotYEnd = startY;
        // Reset pattern history on level reset
        this.lastPlatformPattern = null;
        this.lastMazePattern = null;
    }

    /**
     * Calculates the layout for the next slot.
     * Does NOT spawn anything. Returns strictly DATA.
     * 
     * @param {number} slotIndex - Current slot index from SlotGenerator
     * @returns {Object} SlotData
     */
    nextSlot(slotIndex, startYOverride = null) {
        // 1. Calculate Y Start
        let yStart;
        if (startYOverride !== null) {
            yStart = startYOverride;
        } else if (this.lastSlotYEnd === null) {
            // First slot default
            yStart = SLOT_CONFIG.rules.startPlatformY || 450;
        } else {
            // Stack on top of last slot
            yStart = this.lastSlotYEnd - SLOT_CONFIG.slotGap;
        }

        // 2. Determine Type
        const type = this._determineType(slotIndex);

        // 3. Calculate height based on type
        const height = this._calculateSlotHeight(type);

        // 4. Generate Internal Layout
        const internalData = this._generateInternalLayout(type, yStart, height);

        // 5. Update State
        const yEnd = yStart - height;
        this.lastSlotYEnd = yEnd;

        // 6. Build Result
        return {
            index: slotIndex,
            type,
            yStart,
            yEnd,
            height,
            data: internalData
        };
    }

    _determineType(slotIndex) {
        if (slotIndex < SLOT_CONFIG.rules.tutorialSlots) {
            return 'PLATFORM_BATCH';
        }
        // Simple Weighted Random (can be enhanced later)
        const r = Math.random();
        if (r < 0.5) return 'PLATFORM_BATCH';
        if (r < 0.7) return 'SAFE_ZONE';
        return 'MAZE';
    }

    _calculateSlotHeight(type) {
        // Visual adjustment: Add 10px to increase gap between slots
        const VISUAL_GAP_ADJUSTMENT = 10;

        if (type === 'MAZE') {
            // Maze calculation needs to match platform gap (160px) not maze internal gap (100px)
            const config = SLOT_CONFIG.types.MAZE;
            const rowCount = config.rowCount || 5;
            const rowHeight = config.rowHeight || MAZE_ROW_HEIGHT;
            const rowGap = config.rowGap || 100;

            // Content height with internal 100px gaps
            const contentHeight = rowCount * rowHeight + (rowCount - 1) * rowGap;
            // = 5 * 128 + 4 * 100 = 640 + 400 = 1040

            // Fine-tuned adjustment to match platform spacing visually
            // Need to compensate: (160 - 100) + 10 = 70px
            const gapAdjustment = 70;

            return contentHeight + gapAdjustment + VISUAL_GAP_ADJUSTMENT;
        } else {
            // Platform batches: Use standard slot height plus visual adjustment
            return SLOT_CONFIG.slotHeight + VISUAL_GAP_ADJUSTMENT; // 650px
        }
    }

    _generateInternalLayout(type, yStart, slotHeight) {
        if (type === 'MAZE') {
            // Get maze pattern (excluding last used to prevent repetition)
            const pattern = getRandomMazePatternExcluding(this.lastMazePattern);

            // Update history
            this.lastMazePattern = pattern;

            return {
                type: 'MAZE_GRID',
                pattern: pattern,
                patternIndex: MAZE_PATTERNS.indexOf(pattern) + 1 || 0
            };
        } else {
            // Platform Batch
            return this._generatePlatformPositions(yStart, slotHeight);
        }
    }

    _generatePlatformPositions(yStart, slotHeight) {
        // Standard Grid: Get platform count from config
        const config = SLOT_CONFIG.types.PLATFORM_BATCH;
        const platformCount = config.platformCount.min; // Always 4 for now
        const gap = SLOT_CONFIG.minVerticalGap; // 160px
        const platforms = [];

        // 1. Get Pattern (excluding last used to prevent repetition)
        const pattern = getRandomPatternExcluding(this.lastPlatformPattern);

        // Update history
        this.lastPlatformPattern = pattern.name;

        // 2. Transform (Logic only)
        const transformed = this.transformer.randomTransform(pattern.platforms);
        const clamped = this.transformer.clampToBounds(transformed.platforms);

        let currentY = yStart;

        for (let i = 0; i < platformCount; i++) {
            // Cycle through pattern platforms
            const basePlat = clamped[i % clamped.length];

            platforms.push({
                x: basePlat.x,
                y: currentY,
                width: SLOT_CONFIG.platformWidth
            });

            currentY -= gap;
        }

        return {
            sourcePattern: pattern.name,
            transform: transformed.transform,
            platforms
        };
    }
}
