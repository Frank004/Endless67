class ScoreManager {
    static instance = null;

    constructor() {
        if (ScoreManager.instance) {
            return ScoreManager.instance;
        }
        ScoreManager.instance = this;

        this.storageKey = 'endless67_scores';
        this.maxScores = 10;

        // DEBUG: Seed scores on init as requested (Uncomment to reset leaderboard)
        // this.seedDebugScores();
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

    saveScore(name, coins, height, worldY = 0) {
        const scores = this.getTopScores();
        const newScore = {
            name: name.substring(0, 3).toUpperCase(),
            coins: coins,
            height: height,
            worldY: worldY,
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

    /**
     * DEBUG: Seed leaderboard with test data
     * Positions 1-10 spaced by 200m
     */
    seedDebugScores() {
        console.log('🌱 [ScoreManager] Seeding debug scores...');
        const scores = [];
        const baseSpawnY = 750; // Approximated spawn Y

        for (let i = 0; i < 10; i++) {
            const rank = i + 1;
            const height = (11 - rank) * 200; // Rank 1 = 2000m, Rank 10 = 200m
            const worldY = baseSpawnY - (height * 10);

            scores.push({
                name: `CPU${rank}`,
                coins: 1, // Minimum coins so player can beat them easily with height
                height: height,
                worldY: worldY,
                date: new Date().toISOString()
            });
        }

        // Sort by height descending
        scores.sort((a, b) => b.height - a.height);

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
            console.log('✅ [ScoreManager] Debug scores seeded!');
        } catch (e) {
            console.warn('Error seeding scores:', e);
        }
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

        // Check Height first
        if (height > lastScore.height) return true;
        // If tied on height, check Coins
        if (height === lastScore.height && coins > lastScore.coins) return true;

        return false;
    }
}

export default new ScoreManager();
