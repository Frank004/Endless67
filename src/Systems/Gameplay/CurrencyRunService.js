import PlayerProfileService from './PlayerProfileService.js';

class CurrencyRunService {
    constructor() {
        this.runCoins = 0;
    }

    resetRunCoins() {
        this.runCoins = 0;
    }

    onCoinCollected(value = 0) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return this.runCoins;
        this.runCoins += amount;
        return this.runCoins;
    }

    commitRunCoinsToProfile() {
        const amount = this.runCoins;
        if (!Number.isFinite(amount) || amount <= 0) {
            this.runCoins = 0;
            return 0;
        }
        PlayerProfileService.addCoins(amount);
        this.runCoins = 0;
        return amount;
    }
}

export default new CurrencyRunService();
