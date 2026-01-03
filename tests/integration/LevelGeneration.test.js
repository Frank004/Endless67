
import { SlotGenerator } from '../../src/managers/level/SlotGenerator.js';
import { SLOT_CONFIG } from '../../src/config/SlotConfig.js';
import { PatternTransformer } from '../../src/utils/PatternTransformer.js';

// Partially mock dependencies to isolate logic issues from Phaser internals
const mockScene = {
    cameras: {
        main: {
            width: 360,
            height: 640,
            scrollY: 0,
            centerX: 180
        }
    },
    registry: {
        get: jest.fn(() => false)
    },
    levelManager: {
        spawnPlatform: jest.fn((x, y, width) => ({ x, y, width, active: true })),
        spawnMazeRowFromConfig: jest.fn(),
        cleanupOnly: jest.fn()
    },
    physics: {
        add: {
            staticSprite: jest.fn(() => ({
                setDisplaySize: jest.fn().mockReturnThis(),
                refreshBody: jest.fn().mockReturnThis(),
                active: true,
                x: 0, y: 0, displayWidth: 0, displayHeight: 0
            }))
        }
    },
    platforms: { add: jest.fn() },
    powerupPool: { spawn: jest.fn() },
    coinPool: { spawn: jest.fn() },
    powerups: { add: jest.fn(), children: { iterate: jest.fn() } },
    coins: { add: jest.fn(), children: { iterate: jest.fn() } },
    time: { delayedCall: jest.fn() },
    player: { y: 0 }
};

describe('Level Generation Integration Logic', () => {
    let generator;

    beforeEach(() => {
        jest.clearAllMocks();
        generator = new SlotGenerator(mockScene);
    });

    test('Slots should stack perfectly "lego-style" (Correct Y Continuity)', () => {
        // Init generator
        generator.init(1000); // Start Y at 1000

        // Generate a few slots
        generator.generateNextSlot(); // Slot 0
        generator.generateNextSlot(); // Slot 1
        generator.generateNextSlot(); // Slot 2

        const slots = generator.slots;
        expect(slots.length).toBeGreaterThanOrEqual(3);

        console.log('DEBUG: Generated Slot Y Positions:');
        slots.forEach((s, i) => console.log(`Slot ${i}: yStart=${s.yStart}, yEnd=${s.yEnd}, height=${s.height}`));

        // Verify continuity
        for (let i = 0; i < slots.length - 1; i++) {
            const current = slots[i];
            const next = slots[i + 1];

            console.log(`Checking continuity: Slot ${i} end=${current.yEnd} -> Slot ${i + 1} start=${next.yStart}. Gap=${current.yEnd - next.yStart}`);

            // The top of current slot (yEnd) should be the bottom of next slot (yStart)
            // Note: In Phaser Y goes UP as numbers decrease? No, Y increases DOWN.
            // Game scrolls UP, so we move to negative Y.
            // StartY (base) -> yEnd (top of slot). 
            // yEnd should be < yStart (numerically smaller, visually higher).

            expect(current.yEnd).toBeLessThan(current.yStart);

            // Gap check: next.yStart should be current.yEnd - slotGap
            const expectedNextStart = current.yEnd - SLOT_CONFIG.slotGap;
            expect(next.yStart).toBeCloseTo(expectedNextStart, 1);
        }
    });

    test('Platforms should stay within horizontal bounds', () => {
        // Force platform batch type
        jest.spyOn(generator, 'determineSlotType').mockReturnValue('PLATFORM_BATCH');

        generator.init(1000);
        generator.generateNextSlot();

        expect(mockScene.levelManager.spawnPlatform).toHaveBeenCalled();

        const calls = mockScene.levelManager.spawnPlatform.mock.calls;
        calls.forEach(call => {
            const [x, y, width] = call;
            const halfWidth = width / 2;
            const minX = 32 + 5 + halfWidth; // Wall + margin + halfWidth
            const maxX = 360 - 32 - 5 - halfWidth;

            expect(x).toBeGreaterThanOrEqual(minX);
            expect(x).toBeLessThanOrEqual(maxX);
        });
    });
});
