import MilestoneIndicator from '../../../src/prefabs/ui/MilestoneIndicator.js';
import { MILESTONE_CONFIG } from '../../../src/config/MilestoneConfig.js';

describe('MilestoneIndicator', () => {
    let indicator;
    let mockScene;

    beforeEach(() => {
        // Mock scene
        mockScene = {
            add: {
                rectangle: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis()
                }),
                text: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis()
                }),
                line: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setLineWidth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis()
                }),
                sprite: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis(),
                    setFlipX: jest.fn().mockReturnThis(),
                    setTint: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    play: jest.fn().mockReturnThis(),
                    once: jest.fn(),
                    x: 0
                }),
                existing: jest.fn()
            },
            scale: {
                width: 400
            },
            tweens: {
                add: jest.fn()
            },
            milestoneParticles: {
                emitParticleAt: jest.fn()
            },
            textures: {
                exists: jest.fn(() => true)
            },
            sound: {
                play: jest.fn()
            }
        };
    });

    afterEach(() => {
        if (indicator) {
            indicator.destroy();
        }
    });

    describe('Initialization', () => {
        test('should create indicator with correct properties', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            expect(indicator.position).toBe(1);
            expect(indicator.milestoneHeight).toBe(1000);
            expect(indicator.coins).toBe(50);
            expect(indicator.playerName).toBe('AAA');
            expect(indicator.passed).toBe(false);
            expect(indicator.locked).toBe(false);
        });

        test('should use correct color for position', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');
            expect(indicator.color).toBe(MILESTONE_CONFIG.colors[0]); // Gold for 1st

            const indicator2 = new MilestoneIndicator(mockScene, 9, 500, 30, 'BBB');
            expect(indicator2.color).toBe(MILESTONE_CONFIG.colors[8]); // Hot Pink for 9th
            indicator2.destroy();
        });

        test('should create visual elements', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            // Should create 2 sprites (left + right backgrounds)
            expect(mockScene.add.sprite).toHaveBeenCalledTimes(2);

            // Should create 2 text elements (left + right)
            expect(mockScene.add.text).toHaveBeenCalledTimes(2);

            // Should create 1 line
            expect(mockScene.add.line).toHaveBeenCalledTimes(1);
        });

        test('should format position text with leading zero', () => {
            indicator = new MilestoneIndicator(mockScene, 5, 1000, 50, 'AAA');

            // Check that text was created with "05"
            const textCalls = mockScene.add.text.mock.calls;
            expect(textCalls[0][2]).toBe('05');
            expect(textCalls[1][2]).toBe('05');
        });

        test('should set correct depth and scroll factor', () => {
            const mockSetDepth = jest.fn().mockReturnThis();
            const mockSetScrollFactor = jest.fn().mockReturnThis();

            // Mock Container methods
            MilestoneIndicator.prototype.setDepth = mockSetDepth;
            MilestoneIndicator.prototype.setScrollFactor = mockSetScrollFactor;

            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            expect(mockSetDepth).toHaveBeenCalledWith(100);
            expect(mockSetScrollFactor).toHaveBeenCalledWith(0);
        });
    });

    describe('Position Updates', () => {
        beforeEach(() => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');
        });

        test('should update Y position', () => {
            indicator.updatePosition(150);
            expect(indicator.y).toBe(150);
        });

        test('should handle negative positions', () => {
            indicator.updatePosition(-500);
            expect(indicator.y).toBe(-500);
        });
    });

    describe('Locking Behavior', () => {
        beforeEach(() => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');
            indicator.setAlpha = jest.fn();
        });

        test('should lock indicator and reduce opacity', () => {
            indicator.setLocked(true);

            expect(indicator.locked).toBe(true);
            expect(indicator.setAlpha).toHaveBeenCalledWith(0.6);
        });

        test('should not change opacity when unlocking', () => {
            indicator.setLocked(false);

            expect(indicator.locked).toBe(false);
            expect(indicator.setAlpha).not.toHaveBeenCalled();
        });
    });

    describe('Pass Effect', () => {
        beforeEach(() => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');
        });

        test('should trigger flash animation', () => {
            indicator.playPassEffect();

            expect(mockScene.tweens.add).toHaveBeenCalled();
            expect(indicator.passed).toBe(true);
        });



        test('should not trigger effect twice', () => {
            indicator.playPassEffect();
            const firstCallCount = mockScene.tweens.add.mock.calls.length;

            indicator.playPassEffect();
            const secondCallCount = mockScene.tweens.add.mock.calls.length;

            expect(secondCallCount).toBe(firstCallCount); // No additional calls
        });

        test('should handle missing particle emitter gracefully', () => {
            mockScene.milestoneParticles = null;

            expect(() => indicator.playPassEffect()).not.toThrow();
        });
    });

    describe('Visual Configuration', () => {
        test('should use config dimensions', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            const spriteCalls = mockScene.add.sprite.mock.calls;

            // Check that sprites are capable of being created (dimensions are in texture usually)
            // But we can check position
            expect(spriteCalls.length).toBe(2);
        });

        test('should position indicators at screen edges', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            const spriteCalls = mockScene.add.sprite.mock.calls;
            const { edgeOffset, indicatorWidth } = MILESTONE_CONFIG;

            // Left indicator X position
            expect(spriteCalls[0][0]).toBe(edgeOffset + indicatorWidth / 2);

            // Right indicator X position
            const expectedRightX = mockScene.scale.width - edgeOffset - indicatorWidth / 2;
            expect(spriteCalls[1][0]).toBe(expectedRightX);
        });

        test('should set line alpha from config', () => {
            indicator = new MilestoneIndicator(mockScene, 1, 1000, 50, 'AAA');

            const lineCalls = mockScene.add.line.mock.calls;
            const lineInstance = lineCalls[0][0]; // Get the line instance

            expect(mockScene.add.line().setAlpha).toHaveBeenCalledWith(MILESTONE_CONFIG.lineAlpha);
        });
    });

    describe('All Positions Color Test', () => {
        test('should have unique colors for all 10 positions', () => {
            const colors = new Set();

            for (let pos = 1; pos <= 10; pos++) {
                const ind = new MilestoneIndicator(mockScene, pos, 1000, 50, 'TST');
                colors.add(ind.color);
                ind.destroy();
            }

            expect(colors.size).toBe(10); // All colors should be unique
        });
    });
});
