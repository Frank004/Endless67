import ScoreManager from '../../src/managers/ScoreManager.js';

describe('ScoreManager', () => {
    let scoreManager;
    let mockLocalStorage;

    beforeEach(() => {
        scoreManager = ScoreManager;
        mockLocalStorage = {};

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockLocalStorage[key] || null),
                setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
                clear: jest.fn(() => { mockLocalStorage = {}; }),
                removeItem: jest.fn((key) => { delete mockLocalStorage[key]; })
            },
            writable: true
        });
    });

    test('should return empty array when no scores exist', () => {
        const scores = scoreManager.getTopScores();
        expect(scores).toEqual([]);
    });

    test('should save a score correctly', () => {
        scoreManager.saveScore('ABC', 100, 50);
        const scores = scoreManager.getTopScores();
        expect(scores).toHaveLength(1);
        expect(scores[0]).toMatchObject({ name: 'ABC', coins: 100, height: 50 });
    });

    test('should sort scores by coins then height', () => {
        scoreManager.saveScore('A', 10, 100);
        scoreManager.saveScore('B', 20, 50);
        scoreManager.saveScore('C', 10, 200);

        const scores = scoreManager.getTopScores();
        expect(scores[0].name).toBe('B'); // 20 coins
        expect(scores[1].name).toBe('C'); // 10 coins, 200 height
        expect(scores[2].name).toBe('A'); // 10 coins, 100 height
    });

    test('should keep only top 10 scores', () => {
        for (let i = 0; i < 15; i++) {
            scoreManager.saveScore(`P${i}`, i, i);
        }
        const scores = scoreManager.getTopScores();
        expect(scores).toHaveLength(10);
        expect(scores[0].coins).toBe(14); // Highest score
    });

    test('isHighScore should respect minimum requirements', () => {
        // Min 1 coin AND 60m height
        expect(scoreManager.isHighScore(59, 10)).toBe(false); // Height too low
        expect(scoreManager.isHighScore(100, 0)).toBe(false); // No coins
        expect(scoreManager.isHighScore(60, 1)).toBe(true); // Just enough
    });

    test('saveScore should uppercase and trim player names to 3 characters', () => {
        scoreManager.saveScore('playerOne', 5, 10);
        const scores = scoreManager.getTopScores();

        expect(scores[0].name).toBe('PLA'); // Uppercased and trimmed
    });

    test('isHighScore should compare against a full leaderboard', () => {
        const storedScores = [];
        for (let i = 0; i < 10; i++) {
            storedScores.push({ name: `P${i}`, coins: 10 - i, height: 50 + i });
        }
        window.localStorage.setItem(scoreManager.storageKey, JSON.stringify(storedScores));

        expect(scoreManager.isHighScore(120, 1)).toBe(true); // Height beats last entry
        expect(scoreManager.isHighScore(40, 1)).toBe(false); // Height too low vs last entry
        expect(scoreManager.isHighScore(60, 15)).toBe(true); // More coins than top
    });

    test('getTopScores should handle storage errors gracefully', () => {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => { throw new Error('storage failure'); }),
                setItem: jest.fn()
            },
            writable: true
        });

        expect(scoreManager.getTopScores()).toEqual([]);
    });
});
