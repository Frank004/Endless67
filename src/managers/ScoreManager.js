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

        // Sort by coins descending, then height descending
        scores.sort((a, b) => {
            if (b.coins !== a.coins) return b.coins - a.coins;
            return b.height - a.height;
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
        // Requirements: minimum 1 coin and maximum 60m height
        if (coins < 1) return false;
        if (height < 60) return false;

        const scores = this.getTopScores();
        if (scores.length < this.maxScores) return true;

        const lastScore = scores[scores.length - 1];
        if (coins > lastScore.coins) return true;
        if (coins === lastScore.coins && height > lastScore.height) return true;

        return false;
    }
}
