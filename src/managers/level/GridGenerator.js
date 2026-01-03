
import { SLOT_CONFIG, getPlatformBounds } from '../../config/SlotConfig.js';
import { PatternTransformer } from '../../utils/PatternTransformer.js';
import { PLATFORM_PATTERNS, getRandomPattern } from '../../data/PlatformPatterns.js';

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

        // Internal State
        this.lastSlotYEnd = null; // Start undefined
        this.currentSlotIndex = 0;
    }

    reset(startY) {
        this.lastSlotYEnd = startY;
        this.currentSlotIndex = 0;
    }

    /**
     * Calculates the layout for the next slot.
     * Does NOT spawn anything. Returns strictly DATA.
     * 
     * @returns {Object} SlotData
     */
    nextSlot(startYOverride = null) {
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
        const type = this._determineType();
        const height = SLOT_CONFIG.slotHeight; // Force fixed height for consistency ("Lego")

        // 3. Generate Internal Layout
        const internalData = this._generateInternalLayout(type, yStart, height);

        // 4. Update State
        const yEnd = yStart - height;
        this.lastSlotYEnd = yEnd;

        // 5. Build Result
        return {
            index: this.currentSlotIndex++,
            type,
            yStart,
            yEnd,
            height,
            data: internalData
        };
    }

    _determineType() {
        if (this.currentSlotIndex < SLOT_CONFIG.rules.tutorialSlots) {
            return 'PLATFORM_BATCH';
        }
        // Simple Weighted Random (can be enhanced later)
        const r = Math.random();
        if (r < 0.5) return 'PLATFORM_BATCH';
        if (r < 0.7) return 'SAFE_ZONE';
        return 'MAZE';
    }

    _generateInternalLayout(type, yStart, slotHeight) {
        if (type === 'MAZE') {
            // Maze layout logic (stub for now, can be ported from SlotGenerator)
            return { type: 'MAZE_GRID', info: 'Maze Layout' };
        } else {
            // Platform Batch
            return this._generatePlatformPositions(yStart, slotHeight);
        }
    }

    _generatePlatformPositions(yStart, slotHeight) {
        // Standard Grid: 4 platforms, 160px apart.
        const gap = 160;
        const count = 4;
        const platforms = [];

        // 1. Get Pattern
        const pattern = getRandomPattern();

        // 2. Transform (Logic only)
        const transformed = this.transformer.randomTransform(pattern.platforms);
        const clamped = this.transformer.clampToBounds(transformed.platforms);

        let currentY = yStart;

        for (let i = 0; i < count; i++) {
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
