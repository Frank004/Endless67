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
            // First slot default - este fallback no debería ejecutarse porque SlotGenerator
            // siempre llama a reset() con startY calculado. Pero por seguridad:
            // Ad banner está arriba, así que asumimos screenHeight = 640 (default)
            // Floor está en 640 - 32 = 608, primera plataforma en 608 - 160 = 448
            const screenHeight = 640; // Default, pero SlotGenerator siempre pasa el valor correcto
            const floorHeight = 32;
            const floorY = screenHeight - floorHeight;
            yStart = floorY - 160; // 160px arriba del floor
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
        // Simple weighted selection: more platforms early, mix later
        if (slotIndex < 3) return 'PLATFORM_BATCH';
        const r = Math.random();
        if (r < 0.6) return 'PLATFORM_BATCH';
        if (r < 0.8) return 'SAFE_ZONE';
        return 'MAZE';
    }

    _calculateSlotHeight(type) {
        const gap = SLOT_CONFIG.minVerticalGap; // 160px
        if (type === 'MAZE') {
            const config = SLOT_CONFIG.types.MAZE;
            const rowCount = config.rowCount || 5;
            const rowHeight = config.rowHeight || MAZE_ROW_HEIGHT;
            const rowGap = config.rowGap || 100;

            // Content height with internal 100px gaps
            const contentHeight = rowCount * rowHeight + (rowCount - 1) * rowGap; // 5*128 + 4*100 = 1040

            // Match periodic vertically (must be multiple of 160)
            // 1040 -> 1120 (7 * 160)
            return Math.ceil(contentHeight / gap) * gap;
        } else {
            // Standard slots are 640 (4 * 160)
            return SLOT_CONFIG.slotHeight;
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
            return this._generatePlatformPositions(yStart, slotHeight, type);
        }
    }

    _generatePlatformPositions(yStart, slotHeight, type = 'PLATFORM_BATCH') {
        const config = SLOT_CONFIG.types[type] || SLOT_CONFIG.types.PLATFORM_BATCH;
        const gap = SLOT_CONFIG.minVerticalGap; // 160px

        // Fallback to calculated count if config is missing to avoid runtime errors
        // Note: SAFE_ZONE and PLATFORM_BATCH both have platformCount { min: 4, max: 4 }
        const platformCount = config?.platformCount?.min ?? Math.max(1, Math.floor(slotHeight / gap));
        const platforms = [];

        // Select random pattern (avoid immediate repetition)
        let pattern = getRandomPatternExcluding(this.lastPlatformPattern);
        if (!pattern) pattern = getRandomPattern();
        this.lastPlatformPattern = pattern?.name;

        // Scale pattern to current game width (designWidth -> gameWidth), keeping center alignment
        const designWidth = SLOT_CONFIG.designWidth || 400;
        const scaleRatio = this.gameWidth / designWidth;
        const centerOffset = this.gameWidth / 2;
        let normalizedPlatforms = pattern.platforms.map(p => ({
            x: ((p.x - designWidth / 2) * scaleRatio) + centerOffset,
            y: p.y
        }));

        // Apply random transform (mirror) based on config weights
        const transformed = this.transformer.randomTransform(normalizedPlatforms, config.transformWeights);
        // Clamp to bounds for safety
        const clamped = this.transformer.clampToBounds(transformed.platforms);
        const patternLength = clamped.length;

        for (let i = 0; i < platformCount; i++) {
            // Cycle through pattern platforms
            const basePlat = clamped[i % patternLength];

            // Calculate Y offset based on repetition (if we need to stack patterns)
            // But usually platformCount == patternLength for standard slots.
            const repetition = Math.floor(i / patternLength);
            const patternHeight = SLOT_CONFIG.slotHeight; // Base height of a pattern cycle

            // Use pattern's local Y (relative to its top-start)
            // yStart is the top of the slot. basePlat.y is negative (e.g. 0, -160, -320...)
            const computedY = yStart + basePlat.y - (repetition * patternHeight);

            // basePlat.x is already in absolute coordinates (normalized and centered in line 148)
            // DO NOT add center again - it's already correctly positioned
            const computedX = basePlat.x;

            platforms.push({
                x: computedX,
                y: computedY,
                width: SLOT_CONFIG.platformWidth
            });
        }

        return {
            sourcePattern: pattern.name,
            transform: transformed.transform,
            platforms
        };
    }
}
