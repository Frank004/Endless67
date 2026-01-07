
import { GridGenerator } from '../../src/managers/level/GridGenerator.js';
import { SLOT_CONFIG } from '../../src/config/SlotConfig.js';
import { GAME_CONFIG } from '../../src/config/GameConstants.js';

// Mock dependencies if needed (PatternTransformer is largely pure, but imports SlotConfig)
// We rely on real PatternTransformer logic here as it's pure enough.

describe('GridGenerator Logic (Pure Stacking)', () => {
    let grid;

    beforeEach(() => {
        grid = new GridGenerator(GAME_CONFIG.RESOLUTIONS.MOBILE.width); // Mobile width
        grid.reset(1000); // Start Y
    });

    test('Should stack 100 slots perfectly ("Lego Style")', () => {
        const slots = [];
        for (let i = 0; i < 100; i++) {
            slots.push(grid.nextSlot(i));
        }

        for (let i = 0; i < slots.length - 1; i++) {
            const current = slots[i];
            const next = slots[i + 1];

            // Verify Geometry (height varies by type)
            expect(current.height).toBeGreaterThan(0);
            expect(current.yEnd).toBe(current.yStart - current.height);

            // Verify Continuity (Lego Check)
            // Next start MUST == Current End (if gap is 0)
            // Or Current End - Gap
            const expectedNextStart = current.yEnd - SLOT_CONFIG.slotGap;

            // Allow floating point precision issues (epsilon)
            const diff = Math.abs(next.yStart - expectedNextStart);
            if (diff > 0.01) {
                console.error(`Stack Break at ${i}: Type=${current.type}, Height=${current.height}, Curr End ${current.yEnd}, Next Start ${next.yStart}, Diff ${diff}`);
            }
            expect(diff).toBeLessThan(0.01);
        }
    });

    test('Internal Platforms should distribute evenly', () => {
        const slot = grid.nextSlot(0);
        if (slot.type === 'PLATFORM_BATCH') {
            const platforms = slot.data.platforms;
            expect(platforms.length).toBe(4);

            // Check spacing
            for (let i = 0; i < platforms.length - 1; i++) {
                const p1 = platforms[i];
                const p2 = platforms[i + 1];
                const dist = p1.y - p2.y; // Y goes up/negative?
                // Logic: currentY -= gap. So p1 is lower (higher Y value) than p2?
                // nextSlot loop: currentY starts at startY, then -= gap.
                // startY = 1000. p0 = 1000. p1 = 840.
                // 1000 - 840 = 160. Positive.
                expect(dist).toBeCloseTo(160);
            }
        }
    });
});
