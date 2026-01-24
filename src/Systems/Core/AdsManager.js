/**
 * AdsManager
 * Handles integration with AdMob via Capacitor.
 * 
 * RESPONSIBILITIES:
 * - Initialize AdMob
 * - Show/Hide Banners
 * - Show Rewarded Videos
 * - Handle "Mock" ads for Web/Dev environment
 */

import { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

class AdsManager {
    constructor() {
        this.initialized = false;
        this.isNative = Capacitor.isNativePlatform();
        this.bannerActive = false;

        // TEST IDs - Safe for development
        // NOTE: Replace these with REAL IDs from AdMob Console before production release
        this.adUnitIds = {
            android: {
                banner: 'ca-app-pub-3940256099942544/6300978111', // Test Banner
                rewarded: 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded
            },
            ios: {
                banner: 'ca-app-pub-3940256099942544/2934735716', // Test Banner
                rewarded: 'ca-app-pub-3940256099942544/1712485313' // Test Rewarded
            }
        };

        this.platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    }

    /**
     * Initializes the AdMob plugin.
     * Should be called early in the game lifecycle (e.g. Preloader or MainMenu).
     */
    async init() {
        if (this.initialized) return;

        console.log(`[AdsManager] Initializing. Native: ${this.isNative}`);

        if (!this.isNative) {
            this.initialized = true;
            console.log('[AdsManager] Running in WEB mode. Ads will be mocked.');
            return;
        }

        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                testingDevices: ['YOUR_DEVICE_ID_IF_NEEDED'], // Optional: Add device ID for real ads in test mode
                initializeForTesting: true,
            });
            this.initialized = true;
            console.log('[AdsManager] AdMob Initialized Successfully');
        } catch (e) {
            console.error('[AdsManager] Failed to initialize AdMob', e);
        }
    }

    /**
     * Shows a banner ad at the specified position.
     * @param {string} position 'TOP_CENTER' | 'BOTTOM_CENTER'
     */
    async showBanner(position = 'TOP_CENTER') {
        if (this.bannerActive) return;

        if (!this.isNative) {
            this.bannerActive = true;
            // The AdBanner prefab in Game.js already handles the visual placeholder
            console.log(`[AdsManager] [MOCK] Native Banner would populate TOP area`);
            return;
        }

        try {
            const adId = this.adUnitIds[this.platform].banner;
            const bannerOptions = {
                adId: adId,
                adSize: BannerAdSize.BANNER,
                position: BannerAdPosition[position],
                margin: 0,
                isTesting: true
            };

            await AdMob.showBanner(bannerOptions);
            this.bannerActive = true;
        } catch (e) {
            console.error('[AdsManager] Failed to show banner', e);
        }
    }

    /**
     * Hides the banner ad.
     */
    async hideBanner() {
        if (!this.bannerActive) return;

        if (!this.isNative) {
            this.bannerActive = false;
            console.log('[AdsManager] [MOCK] Hiding Banner');
            return;
        }

        try {
            await AdMob.hideBanner();
            await AdMob.removeBanner(); // Ensure it's fully removed to save resources
            this.bannerActive = false;
        } catch (e) {
            console.error('[AdsManager] Failed to hide banner', e);
        }
    }

    /**
     * Shows a Rewarded Video Ad.
     * @returns {Promise<boolean>} params.success: true if user watched full video, false otherwise.
     */
    async showReviveReward() {
        console.log('[AdsManager] Requesting Rewarded Video');

        if (!this.isNative) {
            // MOCK IMPLEMENTATION
            return new Promise((resolve) => {
                const confirmed = window.confirm("[DEV MOCK] Watch Ad to Revive?\n\n(Click OK to simulate 'Watched', Cancel to simulate 'Skipped')");
                if (confirmed) {
                    console.log('[AdsManager] [MOCK] Ad Loading...');
                    setTimeout(() => {
                        console.log('[AdsManager] [MOCK] Ad Finished! Reward Granted.');
                        resolve(true); // User watched
                    }, 1500); // Fake load time
                } else {
                    console.log('[AdsManager] [MOCK] Ad Cancelled.');
                    resolve(false);
                }
            });
        }

        // NATIVE IMPLEMENTATION
        return new Promise(async (resolve) => {
            try {
                const adId = this.adUnitIds[this.platform].rewarded;

                // Prepare Event Listeners
                let rewardEarned = false;

                // Subscribe to Reward Event
                const onReward = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
                    console.log('[AdsManager] User earned reward', reward);
                    rewardEarned = true;
                });

                // Subscribe to Dismiss Event (to resolve promise)
                const onDismiss = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    console.log('[AdsManager] Ad dismissed');
                    cleanup();
                    resolve(rewardEarned);
                });

                const onFailed = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                    console.error('[AdsManager] Ad failed to load', error);
                    cleanup();
                    resolve(false); // Fail safe
                });

                // Helper to remove listeners
                const cleanup = () => {
                    onReward.remove();
                    onDismiss.remove();
                    onFailed.remove();
                };

                // Load and Show
                await AdMob.prepareRewardVideoAd({ adId, isTesting: true });
                await AdMob.showRewardVideoAd();

            } catch (e) {
                console.error('[AdsManager] Error showing rewarded ad', e);
                resolve(false);
            }
        });
    }
}

export default new AdsManager();
