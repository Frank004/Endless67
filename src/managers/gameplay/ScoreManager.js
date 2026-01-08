class ScoreManager {
    static instance = null;

    constructor() {
        if (ScoreManager.instance) {
            return ScoreManager.instance;
        }
        ScoreManager.instance = this;

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
        const scores = this.getTopScores();

        console.log('🏆 [ScoreManager] isHighScore check:', { height, coins, currentScores: scores.length, maxScores: this.maxScores });

        // If leaderboard is not full, always allow entry (no minimum requirements)
        if (scores.length < this.maxScores) {
            console.log('✅ [ScoreManager] Leaderboard not full, allowing entry');
            return true;
        }

        // Leaderboard is full - check if score beats the lowest entry
        // Requirements: minimum 1 coin AND minimum 60m height
        if (coins < 1 || height < 60) {
            console.log('❌ [ScoreManager] Does not meet minimum requirements (1 coin, 60m)');
            return false;
        }

        const lastScore = scores[scores.length - 1];
        if (coins > lastScore.coins) return true;
        if (coins === lastScore.coins && height > lastScore.height) return true;

        return false;
    }
}

export default new ScoreManager();
