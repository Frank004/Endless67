import EventBus, { Events } from '../../src/Core/EventBus.js';

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all listeners before each test
        EventBus.removeAllListeners();
    });

    test('should be a singleton instance', () => {
        expect(EventBus).toBeDefined();
        expect(EventBus.on).toBeDefined();
        expect(EventBus.emit).toBeDefined();
    });

    test('should emit and receive events', () => {
        const mockCallback = jest.fn();
        const testData = { score: 100 };

        EventBus.on(Events.SCORE_UPDATED, mockCallback);
        EventBus.emit(Events.SCORE_UPDATED, testData);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(testData);
    });

    test('should handle multiple listeners for same event', () => {
        const mockCallback1 = jest.fn();
        const mockCallback2 = jest.fn();

        EventBus.on(Events.PLAYER_DIED, mockCallback1);
        EventBus.on(Events.PLAYER_DIED, mockCallback2);
        EventBus.emit(Events.PLAYER_DIED);

        expect(mockCallback1).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
    });

    test('should remove listener', () => {
        const mockCallback = jest.fn();

        EventBus.on(Events.GAME_PAUSED, mockCallback);
        EventBus.off(Events.GAME_PAUSED, mockCallback);
        EventBus.emit(Events.GAME_PAUSED);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should handle events with no listeners', () => {
        expect(() => {
            EventBus.emit(Events.COIN_COLLECTED, { value: 10 });
        }).not.toThrow();
    });

    test('Events constants should be defined', () => {
        expect(Events.PLAYER_DIED).toBe('PLAYER_DIED');
        expect(Events.SCORE_UPDATED).toBe('SCORE_UPDATED');
        expect(Events.GAME_OVER).toBe('GAME_OVER');
        expect(Events.GAME_PAUSED).toBe('GAME_PAUSED');
    });
});
