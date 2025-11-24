export class ScoreManager {
    constructor() {
        this.storageKey = 'endless67_scores';
        this.maxScores = 10;
    }

    getTopScores() {
        try {
            const scores = localStorage.getItem(this.storageKey);
            return scores ? JSON.parse(scores) : [];
        } catch (e) {
            console.warn('Error loading scores:', e);
            return [];
        }
    }

    saveScore(name, coins, height) {
        const scores = this.getTopScores();
        const newScore = {
            name: name.substring(0, 3).toUpperCase(),
            coins: coins,
            height: height,
            date: new Date().toISOString()
        };

        scores.push(newScore);

        // Sort by height descending, then coins descending
        scores.sort((a, b) => {
            if (b.height !== a.height) return b.height - a.height;
            return b.coins - a.coins;
        });

        // Keep top 10
        if (scores.length > this.maxScores) {
            scores.length = this.maxScores;
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (e) {
            console.warn('Error saving score:', e);
        }

        return scores;
    }

    isHighScore(height, coins) {
        const scores = this.getTopScores();
        if (scores.length < this.maxScores) return true;

        const lastScore = scores[scores.length - 1];
        if (height > lastScore.height) return true;
        if (height === lastScore.height && coins > lastScore.coins) return true;

        return false;
    }
}
