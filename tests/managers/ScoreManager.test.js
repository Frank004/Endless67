import ScoreManager from '../../src/managers/gameplay/ScoreManager.js';

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

    test('should sort scores by height then coins', () => {
        scoreManager.saveScore('A', 10, 100);
        scoreManager.saveScore('B', 20, 50);
        scoreManager.saveScore('C', 10, 200);

        const scores = scoreManager.getTopScores();
        expect(scores[0].name).toBe('C'); // 200 height
        expect(scores[1].name).toBe('A'); // 100 height
        expect(scores[2].name).toBe('B'); // 50 height
    });

    test('should keep only top 10 scores', () => {
        for (let i = 0; i < 15; i++) {
            scoreManager.saveScore(`P${i}`, i, i * 10);
        }
        const scores = scoreManager.getTopScores();
        expect(scores).toHaveLength(10);
        expect(scores[0].height).toBe(140); // Highest score
    });

    test('isHighScore should respect minimum requirements when full', () => {
        // Fill leaderboard with very low valid scores to test the hard minimums
        for (let i = 0; i < 10; i++) {
            scoreManager.saveScore(`P${i}`, 1, 60 + i);
        }
        // Lowest score is 60 height, 1 coin.

        // Even if it ties/beats the lowest score, it must meet min requirements?
        // Code: if (coins < 1 || height < 60) return false;

        expect(scoreManager.isHighScore(59, 10)).toBe(false); // Height 59 < 60 -> False (Strict Min)
        expect(scoreManager.isHighScore(100, 0)).toBe(false); // Coins 0 < 1 -> False (Strict Min)

        // 61 height, 2 coins -> Should be true (beats 60 height)
        expect(scoreManager.isHighScore(61, 2)).toBe(true);
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
