import { ReviveService } from '../../../src/Systems/Gameplay/ReviveService.js';
import AdsManager from '../../../src/Systems/Core/AdsManager.js';
import GameState from '../../../src/Core/GameState.js';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../../src/Systems/Core/AdsManager.js');

describe('ReviveService', () => {
    let reviveService;
    let mockScene;
    let mockPlayer;

    beforeEach(() => {
        // Mock Scene and Player
        mockPlayer = {
            body: { allowGravity: true, velocity: { x: 0, y: 0 } },
            active: true,
            visible: true,
            setVelocity: jest.fn(),
            setAcceleration: jest.fn(),
            clearTint: jest.fn(),
            play: jest.fn(),
            setPosition: jest.fn(),
            activateInvincibility: jest.fn(),
            controller: {
                context: {
                    resetState: jest.fn(),
                    flags: { inputLocked: false, dead: false }
                },
                unlockInput: jest.fn()
            }
        };

        mockScene = {
            cameras: {
                main: { scrollY: 100, centerX: 200, height: 600 }
            },
            riserManager: {
                riser: { y: 1000 },
                isRising: false
            },
            deathPosition: { x: 200, y: 500 },
            platformPool: {
                getActive: jest.fn().mockReturnValue([])
            },
            player: mockPlayer,
            physics: {
                resume: jest.fn(),
                world: { isPaused: true }
            },
            isPaused: jest.fn().mockReturnValue(false),
            scene: { resume: jest.fn() },
            uiManager: {
                hideExtraLifeModal: jest.fn(),
                showHUD: jest.fn(),
                proceedToPostGame: jest.fn()
            },
            audioManager: {
                startMusic: jest.fn(),
                resumeAll: jest.fn(),
                setupEventListeners: jest.fn(),
                music: {} // for tween target
            },
            sound: { resumeAll: jest.fn() },
            tweens: { add: jest.fn() },
            time: { delayedCall: jest.fn() }
        };

        reviveService = new ReviveService(mockScene);
        jest.clearAllMocks();
    });

    test('canRevive returns true initially', () => {
        expect(reviveService.canRevive()).toBe(true);
    });

    test('canRevive returns false after revive', () => {
        reviveService.hasRevived = true;
        expect(reviveService.canRevive()).toBe(false);
    });

    test('initiateRevive calls AdsManager', async () => {
        AdsManager.showReviveReward.mockResolvedValue(true);
        await reviveService.initiateRevive();
        expect(AdsManager.showReviveReward).toHaveBeenCalled();
    });

    test('initiateRevive executes execution flow on success', async () => {
        AdsManager.showReviveReward.mockResolvedValue(true);
        const spyExecute = jest.spyOn(reviveService, 'executeRevive');

        await reviveService.initiateRevive();
        expect(spyExecute).toHaveBeenCalled();
    });

    test('initiateRevive does NOT execute on failure', async () => {
        AdsManager.showReviveReward.mockResolvedValue(false);
        const spyExecute = jest.spyOn(reviveService, 'executeRevive');

        await reviveService.initiateRevive();
        expect(spyExecute).not.toHaveBeenCalled();
    });

    test('findBestSpawnPosition returns platform pos if within range', () => {
        const platformNear = { x: 250, y: 450, body: true, active: true }; // 50px away from deathY=500
        const platformFar = { x: 300, y: 100, body: true, active: true };  // 400px away

        mockScene.platformPool.getActive.mockReturnValue([platformNear, platformFar]);

        const pos = reviveService.findBestSpawnPosition();

        // Should choose platformNear (y - 70)
        expect(pos.y).toBe(380);
        expect(pos.x).toBe(250);
    });

    test('findBestSpawnPosition falls back to death position if no platforms', () => {
        mockScene.platformPool.getActive.mockReturnValue([]);

        const pos = reviveService.findBestSpawnPosition();

        // deathPos (200, 500) -> return (200, 450) [y-50]
        expect(pos.x).toBe(200);
        expect(pos.y).toBe(450);
    });

    test('executeRevive resets GameState flags', () => {
        GameState._isGameOver = true;
        GameState._isPaused = true;

        reviveService.executeRevive();

        expect(GameState._isGameOver).toBe(false);
        expect(GameState._isPaused).toBe(false);
    });

    test('executeRevive restores player physics and input', () => {
        reviveService.executeRevive();

        expect(mockPlayer.body.allowGravity).toBe(true);
        expect(mockPlayer.controller.context.flags.inputLocked).toBe(false);
        expect(mockPlayer.controller.unlockInput).toHaveBeenCalled();
        expect(mockPlayer.activateInvincibility).toHaveBeenCalled();
    });

    test('executeRevive handles paused scene', () => {
        mockScene.isPaused.mockReturnValue(true);
        reviveService.executeRevive();
        expect(mockScene.scene.resume).toHaveBeenCalledWith('Game');
    });
});
