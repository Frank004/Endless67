import PlayerProfileService from '../gameplay/PlayerProfileService.js';
import SkinCatalogService from '../gameplay/SkinCatalogService.js';

/**
 * StoreManager - Handles the business logic for the Store.
 * Separates data manipulation from UI rendering.
 */
export class StoreManager {
    constructor() {
        this.catalog = null;
        this.profile = null;
    }

    /**
     * Initializes the manager, loading necessary data.
     * @returns {Promise<{catalog: Object, profile: Object}>}
     */
    async init() {
        this.catalog = await SkinCatalogService.load();
        this.profile = PlayerProfileService.loadOrCreate();
        return {
            catalog: this.catalog,
            profile: this.profile
        };
    }

    /**
     * Gets the list of skins with their current state (owned, equipped, affordability).
     * @returns {Array<Object>}
     */
    getSkinsWithState() {
        if (!this.catalog || !this.profile) return [];

        return this.catalog.skins.map(skin => ({
            ...skin,
            owned: !!this.profile.skins.owned[skin.id],
            equipped: this.profile.skins.equipped === skin.id,
            // We can also calculate if it's affordable here, but UI often updates this dynamically
            canAfford: this.profile.currency.coins >= skin.priceCoins
        }));
    }

    /**
     * Attempts to purchase a skin.
     * @param {string} skinId 
     * @param {number} cost 
     * @returns {Object} Result { success: boolean, reason: string, profile: Object }
     */
    purchaseSkin(skinId, cost) {
        if (PlayerProfileService.spendCoins(cost)) {
            PlayerProfileService.ownSkin(skinId, cost);
            this.profile = PlayerProfileService.loadOrCreate(); // Refresh local profile
            return { success: true, profile: this.profile };
        }
        return { success: false, reason: 'insufficient_funds' };
    }

    /**
     * Equips a skin.
     * @param {string} skinId 
     * @returns {boolean} Success
     */
    equipSkin(skinId) {
        const success = PlayerProfileService.equipSkin(skinId);
        if (success) {
            this.profile = PlayerProfileService.loadOrCreate();
        }
        return success;
    }

    /**
     * Gets total coins.
     * @returns {number}
     */
    getCoins() {
        return this.profile?.currency?.coins || 0;
    }
}
