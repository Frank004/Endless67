import { MilestoneIndicatorManager } from '../../../src/managers/ui/hud/MilestoneIndicatorManager.js';
import ScoreManager from '../../../src/managers/gameplay/ScoreManager.js';
import { MILESTONE_CONFIG } from '../../../src/config/MilestoneConfig.js';
import MilestoneIndicator from '../../../src/prefabs/ui/MilestoneIndicator.js';

// Mock dependencies
jest.mock('../../../src/managers/gameplay/ScoreManager.js');
jest.mock('../../../src/prefabs/ui/MilestoneIndicator.js', () => {
    return jest.fn().mockImplementation((scene, position, height, coins, name) => {
        return {
            scene,
            position,
            milestoneHeight: height,
            coins,
            playerName: name,
            passed: false,
            locked: false,
            updatePosition: jest.fn(),
            setVisible: jest.fn(),
            playPassEffect: jest.fn(),
            setLocked: jest.fn(),
            setAlpha: jest.fn(),
            destroy: jest.fn()
        };
    });
});

describe('MilestoneIndicatorManager', () => {
    let manager;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock camera
        mockCamera = {
            scrollY: 0,
            height: 600
        };

        // Mock scene
        mockScene = {
            time: { now: 0 },
            textures: { exists: jest.fn(() => true) },
            layout: { playerSpawnY: 500 },
            add: {
                particles: jest.fn().mockReturnValue({
                    setDepth: jest.fn().mockReturnThis(),
                    emitParticleAt: jest.fn(),
                    destroy: jest.fn()
                })
            },
            cameras: {
                main: mockCamera
            },
            milestoneParticles: null
        };

        // Mock ScoreManager
        ScoreManager.getTopScores = jest.fn().mockReturnValue([
            { name: 'AAA', coins: 100, height: 1000 },
            { name: 'BBB', coins: 90, height: 900 },
            { name: 'CCC', coins: 80, height: 800 }
        ]);

        manager = new MilestoneIndicatorManager(mockScene);
    });

    // Helper to advance time (for rate limited logs)
    const advanceTime = (ms) => { mockScene.time.now += ms; };

    afterEach(() => {
        if (manager) {
            manager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should create particle emitter on initialization', () => {
            expect(mockScene.add.particles).toHaveBeenCalled();
            expect(mockScene.milestoneParticles).toBeDefined();
        });

        test('should load milestones from ScoreManager', () => {
            expect(ScoreManager.getTopScores).toHaveBeenCalled();
            expect(manager.milestones.length).toBe(3);
        });

        test('should create correct number of indicators', () => {
            expect(manager.indicators.length).toBe(3);
        });

        test('should store milestone data correctly', () => {
            expect(manager.milestones[0]).toEqual({
                position: 1,
                height: 1000,
                coins: 100,
                name: 'AAA',
                passed: false
            });
        });
    });

    describe('Update Logic', () => {
        test('should not update if no indicators exist', () => {
            manager.indicators = [];
            expect(() => manager.update(0)).not.toThrow();
        });

        test('should update indicator positions based on player height', () => {
            // Use the indicators created by the manager
            const firstIndicator = manager.indicators[0];

            manager.update(-500); // Player at -500 (500m height)

            expect(firstIndicator.updatePosition).toHaveBeenCalled();
            expect(firstIndicator.setVisible).toHaveBeenCalled();
        });

        test('should trigger celebration when player passes milestone', () => {
            // Use the indicators created by the manager
            const firstIndicator = manager.indicators[0];

            // Player passes the milestone (at -1000 or below)
            manager.update(-10000);

            expect(firstIndicator.playPassEffect).toHaveBeenCalled();
            expect(firstIndicator.setLocked).toHaveBeenCalledWith(true);
            expect(manager.milestones[0].passed).toBe(true);
        });

        test('should not trigger celebration twice for same milestone', () => {
            const firstIndicator = manager.indicators[0];

            // Pass milestone first time
            manager.update(-10000);
            expect(firstIndicator.playPassEffect).toHaveBeenCalledTimes(1);

            // Update again - should not trigger again
            manager.update(-11000);
            expect(firstIndicator.playPassEffect).toHaveBeenCalledTimes(1);
        });

        test('should show indicator at top when far from milestone', () => {
            const firstIndicator = manager.indicators[0];

            // Player far below milestone
            manager.update(0);

            expect(firstIndicator.updatePosition).toHaveBeenCalledWith(10); // Fixed top position
            expect(firstIndicator.setVisible).toHaveBeenCalledWith(true);
        });
    });

    describe('Refresh', () => {
        test('should reload milestones when refresh is called', () => {
            const initialCount = manager.indicators.length;

            // Change mock data
            ScoreManager.getTopScores.mockReturnValue([
                { name: 'XXX', coins: 200, height: 2000 }
            ]);

            manager.refresh();

            expect(ScoreManager.getTopScores).toHaveBeenCalledTimes(2); // Once on init, once on refresh
            expect(manager.indicators.length).toBe(1);
        });

        test('should destroy old indicators before creating new ones', () => {
            const mockIndicator = {
                destroy: jest.fn()
            };
            manager.indicators = [mockIndicator];

            manager.refresh();

            expect(mockIndicator.destroy).toHaveBeenCalled();
        });
    });

    describe('Destroy', () => {
        test('should destroy all indicators', () => {
            const mockIndicator1 = { destroy: jest.fn() };
            const mockIndicator2 = { destroy: jest.fn() };
            manager.indicators = [mockIndicator1, mockIndicator2];

            manager.destroy();

            expect(mockIndicator1.destroy).toHaveBeenCalled();
            expect(mockIndicator2.destroy).toHaveBeenCalled();
            expect(manager.indicators.length).toBe(0);
        });

        test('should destroy particle emitter', () => {
            const destroyMock = jest.fn();
            mockScene.milestoneParticles = {
                destroy: destroyMock
            };

            // Recreate manager with updated mock
            manager.destroy();
            const newManager = new MilestoneIndicatorManager(mockScene);
            newManager.destroy();

            expect(destroyMock).toHaveBeenCalled();
        });

        test('should clear milestones array', () => {
            manager.destroy();
            expect(manager.milestones.length).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty leaderboard', () => {
            ScoreManager.getTopScores.mockReturnValue([]);

            const emptyManager = new MilestoneIndicatorManager(mockScene);

            expect(emptyManager.indicators.length).toBe(0);
            expect(emptyManager.milestones.length).toBe(0);

            // Should not throw when updating with no indicators
            expect(() => emptyManager.update(0)).not.toThrow();

            emptyManager.destroy();
        });

        test('should handle full leaderboard (10 scores)', () => {
            const fullLeaderboard = Array.from({ length: 10 }, (_, i) => ({
                name: `P${i + 1}`,
                coins: 100 - i * 10,
                height: 1000 - i * 100
            }));

            ScoreManager.getTopScores.mockReturnValue(fullLeaderboard);

            const fullManager = new MilestoneIndicatorManager(mockScene);

            expect(fullManager.indicators.length).toBe(10);
            expect(fullManager.milestones.length).toBe(10);

            fullManager.destroy();
        });
    });
});
