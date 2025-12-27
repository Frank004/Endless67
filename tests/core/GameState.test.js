import GameState from '../../src/core/GameState.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('GameState', () => {
    beforeEach(() => {
        // Reset state before each test
        GameState.reset();
        EventBus.removeAllListeners();
    });

    describe('Singleton', () => {
        test('should be a singleton instance', () => {
            expect(GameState).toBeDefined();
            expect(GameState.score).toBeDefined();
        });
    });

    describe('Score Management', () => {
        test('should initialize with score 0', () => {
            expect(GameState.score).toBe(0);
        });

        test('should add score and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.SCORE_UPDATED, mockCallback);

            GameState.addScore(10);

            expect(GameState.score).toBe(10);
            expect(mockCallback).toHaveBeenCalledWith({
                score: 10,
                delta: 10
            });
        });

        test('should set score directly', () => {
            GameState.setScore(100);
            expect(GameState.score).toBe(100);
        });

        test('should accumulate score', () => {
            GameState.addScore(10);
            GameState.addScore(20);
            GameState.addScore(5);
            expect(GameState.score).toBe(35);
        });
    });

    describe('Height Management', () => {
        test('should initialize with height 0', () => {
            expect(GameState.height).toBe(0);
        });

        test('should update height and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.HEIGHT_UPDATED, mockCallback);

            GameState.updateHeight(500);

            expect(GameState.height).toBe(500);
            expect(mockCallback).toHaveBeenCalledWith({
                height: 500,
                maxHeight: 500
            });
        });

        test('should track max height', () => {
            GameState.updateHeight(500);
            GameState.updateHeight(300);
            GameState.updateHeight(700);

            expect(GameState.height).toBe(700);
            expect(GameState.maxHeight).toBe(700);
        });
    });

    describe('Lives Management', () => {
        test('should initialize with 3 lives', () => {
            expect(GameState.lives).toBe(3);
        });

        test('should lose life and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.PLAYER_HIT, mockCallback);

            GameState.loseLife();

            expect(GameState.lives).toBe(2);
            expect(mockCallback).toHaveBeenCalledWith({ lives: 2 });
        });

        test('should not go below 0 lives', () => {
            GameState.loseLife();
            GameState.loseLife();
            GameState.loseLife();
            GameState.loseLife();

            expect(GameState.lives).toBe(0);
        });

        test('should trigger game over when lives reach 0', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.GAME_OVER, mockCallback);

            GameState.loseLife();
            GameState.loseLife();
            GameState.loseLife();

            expect(GameState.isGameOver).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should add life', () => {
            GameState.loseLife();
            GameState.addLife();
            expect(GameState.lives).toBe(3);
        });
    });

    describe('Pause Management', () => {
        test('should initialize as not paused', () => {
            expect(GameState.isPaused).toBe(false);
        });

        test('should pause and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.GAME_PAUSED, mockCallback);

            GameState.pause();

            expect(GameState.isPaused).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should resume and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.GAME_RESUMED, mockCallback);

            GameState.pause();
            GameState.resume();

            expect(GameState.isPaused).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should toggle pause state', () => {
            GameState.togglePause();
            expect(GameState.isPaused).toBe(true);

            GameState.togglePause();
            expect(GameState.isPaused).toBe(false);
        });

        test('should not resume if game is over', () => {
            GameState.gameOver();
            GameState.resume();

            expect(GameState.isPaused).toBe(true);
        });
    });

    describe('Game Over', () => {
        test('should set game over state', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.GAME_OVER, mockCallback);

            GameState.gameOver();

            expect(GameState.isGameOver).toBe(true);
            expect(GameState.isPaused).toBe(true);
            expect(mockCallback).toHaveBeenCalledWith({
                score: 0,
                height: 0
            });
        });
    });

    describe('Sound Management', () => {
        test('should initialize with sound enabled', () => {
            expect(GameState.soundEnabled).toBe(true);
        });

        test('should toggle sound and emit event', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.SOUND_TOGGLED, mockCallback);

            GameState.toggleSound();

            expect(GameState.soundEnabled).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith({ enabled: false });
        });

        test('should set sound state directly', () => {
            GameState.setSoundEnabled(false);
            expect(GameState.soundEnabled).toBe(false);

            GameState.setSoundEnabled(true);
            expect(GameState.soundEnabled).toBe(true);
        });
    });

    describe('Reset', () => {
        test('reset should emit height and score updates with zeroed values', () => {
            const scoreListener = jest.fn();
            const heightListener = jest.fn();
            EventBus.on(Events.SCORE_UPDATED, scoreListener);
            EventBus.on(Events.HEIGHT_UPDATED, heightListener);

            GameState.addScore(25);
            GameState.updateHeight(180);

            GameState.reset();

            expect(GameState.score).toBe(0);
            expect(GameState.height).toBe(0);
            expect(scoreListener).toHaveBeenLastCalledWith({ score: 0 });
            expect(heightListener).toHaveBeenCalledWith({ height: 180, maxHeight: 180 });
            expect(heightListener).toHaveBeenLastCalledWith({ height: 0 });
        });
    });

    describe('Reset', () => {
        test('should reset all state to initial values', () => {
            GameState.addScore(100);
            GameState.updateHeight(500);
            GameState.loseLife();
            GameState.pause();

            GameState.reset();

            expect(GameState.score).toBe(0);
            expect(GameState.height).toBe(0);
            expect(GameState.lives).toBe(3);
            expect(GameState.isPaused).toBe(false);
            expect(GameState.isGameOver).toBe(false);
        });
    });

    describe('Start Game', () => {
        test('should reset and start game', () => {
            const mockCallback = jest.fn();
            EventBus.on(Events.GAME_STARTED, mockCallback);

            GameState.addScore(100);
            GameState.startGame();

            expect(GameState.score).toBe(0);
            expect(GameState.isGameOver).toBe(false);
            expect(GameState.isPaused).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Get State', () => {
        test('should return complete state object', () => {
            GameState.addScore(50);
            GameState.updateHeight(300);

            const state = GameState.getState();

            expect(state).toEqual({
                score: 50,
                height: 300,
                maxHeight: 300,
                lives: 3,
                isPaused: false,
                isGameOver: false,
                soundEnabled: true
            });
        });
    });
});
