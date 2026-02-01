import { ReviveSystem } from '../src/Systems/Gameplay/ReviveSystem';
import EventBus, { Events } from '../src/Core/EventBus';
import GameState from '../src/Core/GameState';
import AdsManager from '../src/Systems/Core/AdsManager';

// Mock dependencies
jest.mock('../src/Core/EventBus');
jest.mock('../src/Core/GameState');
jest.mock('../src/Systems/Core/AdsManager');

describe('ReviveSystem', () => {
    let system;
    let mockScene;
    let mockUIManager;

    beforeEach(() => {
        mockUIManager = {
            showExtraLifeModal: jest.fn(),
            proceedToPostGame: jest.fn(),
            extraLifeModal: {
                startCloseAnimation: jest.fn()
            }
        };
        mockScene = {
            events: { on: jest.fn(), off: jest.fn(), once: jest.fn() },
            time: { delayedCall: jest.fn((delay, cb) => cb()) }, // Immediate execution
            uiManager: mockUIManager,
            pause: jest.fn(),
            isPaused: jest.fn(),
            physics: { pause: jest.fn() },
            respawnPlayer: jest.fn(),
            hasRevived: false
        };
        system = new ReviveSystem(mockScene);
    });

    test('should listen to GAME_OVER event', () => {
        expect(EventBus.on).toHaveBeenCalledWith(Events.GAME_OVER, expect.any(Function));
    });

    test('should offer revive if eligible', () => {
        system.hasRevived = false;
        system.onGameOver({});

        expect(mockUIManager.showExtraLifeModal).toHaveBeenCalled();
        expect(mockUIManager.proceedToPostGame).not.toHaveBeenCalled();
    });

    test('should proceed to post game if already revived', () => {
        system.hasRevived = true;
        system.onGameOver({});

        expect(mockUIManager.showExtraLifeModal).not.toHaveBeenCalled();
        expect(mockUIManager.proceedToPostGame).toHaveBeenCalled();
    });

    test('should handle revive success', async () => {
        AdsManager.showReviveReward.mockResolvedValue(true);

        await system.startReviveProcess({});

        expect(mockScene.respawnPlayer).toHaveBeenCalled();
    });
});
