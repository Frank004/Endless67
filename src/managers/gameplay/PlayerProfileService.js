const STORAGE_KEY = 'endless67_profile_v1';

class PlayerProfileService {
    constructor() {
        this._profile = null;
    }

    _nowIso() {
        return new Date().toISOString();
    }

    _defaultProfile() {
        const now = this._nowIso();
        return {
            version: 1,
            currency: { coins: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
            skins: {
                equipped: 'default',
                owned: { default: { ownedAt: now, pricePaid: 0 } }
            },
            stats: { runs: 0, bestHeight: 0 },
            updatedAt: now
        };
    }

    _sanitize(profile) {
        const safe = profile && typeof profile === 'object' ? profile : {};
        const now = this._nowIso();

        safe.version = 1;

        if (!safe.currency || typeof safe.currency !== 'object') {
            safe.currency = { coins: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
        }
        safe.currency.coins = Math.max(0, Number(safe.currency.coins) || 0);
        safe.currency.lifetimeEarned = Math.max(0, Number(safe.currency.lifetimeEarned) || 0);
        safe.currency.lifetimeSpent = Math.max(0, Number(safe.currency.lifetimeSpent) || 0);

        if (!safe.skins || typeof safe.skins !== 'object') {
            safe.skins = { equipped: 'default', owned: {} };
        }
        if (!safe.skins.owned || typeof safe.skins.owned !== 'object') {
            safe.skins.owned = {};
        }
        if (!safe.skins.owned.default) {
            safe.skins.owned.default = { ownedAt: now, pricePaid: 0 };
        }
        if (!safe.skins.equipped || !safe.skins.owned[safe.skins.equipped]) {
            safe.skins.equipped = 'default';
        }

        if (!safe.stats || typeof safe.stats !== 'object') {
            safe.stats = { runs: 0, bestHeight: 0 };
        }
        safe.stats.runs = Math.max(0, Number(safe.stats.runs) || 0);
        safe.stats.bestHeight = Math.max(0, Number(safe.stats.bestHeight) || 0);

        safe.updatedAt = now;

        return safe;
    }

    loadOrCreate() {
        if (this._profile) return this._profile;

        let parsed = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('[PlayerProfileService] Error loading profile:', e);
        }

        const profile = this._sanitize(parsed || this._defaultProfile());
        this._profile = profile;
        this.save(profile);

        return profile;
    }

    save(profile = null) {
        const toSave = this._sanitize(profile || this._profile || this._defaultProfile());
        this._profile = toSave;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('[PlayerProfileService] Error saving profile:', e);
        }
        return toSave;
    }

    addCoins(amount) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return this.loadOrCreate();
        const profile = this.loadOrCreate();
        profile.currency.coins = Math.max(0, profile.currency.coins + value);
        profile.currency.lifetimeEarned = Math.max(0, profile.currency.lifetimeEarned + value);
        return this.save(profile);
    }

    spendCoins(amount) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return false;
        const profile = this.loadOrCreate();
        if (profile.currency.coins < value) return false;
        profile.currency.coins = Math.max(0, profile.currency.coins - value);
        profile.currency.lifetimeSpent = Math.max(0, profile.currency.lifetimeSpent + value);
        this.save(profile);
        return true;
    }

    ownSkin(id, pricePaid = 0) {
        if (!id) return this.loadOrCreate();
        const profile = this.loadOrCreate();
        if (!profile.skins.owned[id]) {
            profile.skins.owned[id] = { ownedAt: this._nowIso(), pricePaid: Number(pricePaid) || 0 };
            this.save(profile);
        }
        return profile;
    }

    equipSkin(id) {
        if (!id) return false;
        const profile = this.loadOrCreate();
        if (!profile.skins.owned[id]) return false;
        profile.skins.equipped = id;
        this.save(profile);

        return true;
    }

    /**
     * DEBUG: Resets owned skins to only 'default'.
     * Used for testing the purchase flow.
     */
    debugResetSkins() {
        const profile = this.loadOrCreate();
        const now = this._nowIso();
        profile.skins = {
            equipped: 'default',
            owned: { default: { ownedAt: now, pricePaid: 0 } }
        };
        this.save(profile);
        return profile;
    }
}

export default new PlayerProfileService();
