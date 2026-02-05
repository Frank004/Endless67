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

import { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents } from '@capacitor-community/admob';
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
        this.rewardedAdLoaded = false;
        this.isLoadingAd = false;
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
            console.log('[AdsManager] Running in WEB mode. Ads will be mocked visually.');
            return;
        }

        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                testingDevices: ['YOUR_DEVICE_ID_IF_NEEDED'],
                initializeForTesting: true,
            });
            this.initialized = true;
            console.log('[AdsManager] AdMob Initialized Successfully');

            // Preload the first reward ad
            this.preloadRewardAd();

        } catch (e) {
            console.error('[AdsManager] Failed to initialize AdMob', e);
        }
    }

    /**
     * Preloads a Rewarded Video Ad so it's ready instantly.
     */
    async preloadRewardAd() {
        if (!this.isNative || this.rewardedAdLoaded || this.isLoadingAd) return;

        this.isLoadingAd = true;
        console.log('[AdsManager] Preloading Rewarded Ad...');

        try {
            const adId = this.adUnitIds[this.platform].rewarded;

            await AdMob.prepareRewardVideoAd({
                adId,
                isTesting: true
            });

            this.rewardedAdLoaded = true;
            this.isLoadingAd = false;
            console.log('[AdsManager] Rewarded Ad Preloaded and Ready ✅');

        } catch (e) {
            console.error('[AdsManager] Failed to preload reward ad', e);
            this.isLoadingAd = false;
            // Retry logic could go here (e.g. timeout)
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
            // The AdBanner entity in Game.js handles the visual mock
            console.log(`[AdsManager] [MOCK] Banner ad displayed at top`);
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
            // VISUAL MOCK IMPLEMENTATION FOR WEB
            return this.showMockRewardedAd();
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
                    // Mark as used and try to preload next one
                    this.rewardedAdLoaded = false;
                    this.preloadRewardAd();
                    resolve(rewardEarned);
                });

                const onFailed = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                    console.error('[AdsManager] Ad failed to load/show', error);
                    cleanup();
                    this.rewardedAdLoaded = false;
                    resolve(false); // Fail safe
                });

                // Helper to remove listeners
                const cleanup = () => {
                    onReward.remove();
                    onDismiss.remove();
                    onFailed.remove();
                };

                // Check if loaded, if not try to load NOW (panic load)
                if (!this.rewardedAdLoaded) {
                    console.warn('[AdsManager] Ad not preloaded. Attempting panic load...');
                    await AdMob.prepareRewardVideoAd({ adId, isTesting: true });
                }

                // Show
                await AdMob.showRewardVideoAd();

            } catch (e) {
                console.error('[AdsManager] Error showing rewarded ad', e);
                // Try to preload again for next time
                this.rewardedAdLoaded = false;
                this.preloadRewardAd();
                resolve(false);
            }
        });
    }

    /**
     * Visual mock for rewarded ads (Web only)
     * @private
     */
    showMockRewardedAd() {
        return new Promise((resolve) => {
            console.log('[AdsManager] [MOCK] Showing Visual Ad Overlay...');

            // Create overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            `;

            // Ad label
            const adLabel = document.createElement('div');
            adLabel.textContent = 'Ad';
            adLabel.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: #ffeb3b;
                color: #000;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: bold;
                border-radius: 3px;
            `;

            // Video container
            const videoBox = document.createElement('div');
            videoBox.style.cssText = `
                background: #1a1a1a;
                width: 80%;
                max-width: 400px;
                aspect-ratio: 16/9;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                position: relative;
                overflow: hidden;
            `;

            // Animated "playing video" effect
            const videoText = document.createElement('div');
            videoText.innerHTML = '▶️ TEST REWARDED AD<br><small style="color: #999">Playing automatically...</small>';
            videoText.style.cssText = `
                color: white;
                font-size: 18px;
                text-align: center;
                padding: 20px;
            `;

            // Countdown timer
            const countdown = document.createElement('div');
            countdown.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: bold;
            `;
            let timeLeft = 15; // AdMob typical duration
            countdown.textContent = `${timeLeft}s`;

            // Close button (X) - Initially hidden
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.3);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                font-size: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            `;

            closeBtn.onmouseover = () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.5)';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            };

            // Info text
            const infoText = document.createElement('div');
            infoText.textContent = 'Watch the full ad to earn your reward';
            infoText.style.cssText = `
                color: #999;
                font-size: 14px;
                margin-top: 10px;
            `;

            videoBox.appendChild(videoText);
            videoBox.appendChild(countdown);
            overlay.appendChild(adLabel);
            overlay.appendChild(videoBox);
            overlay.appendChild(closeBtn);
            overlay.appendChild(infoText);
            document.body.appendChild(overlay);

            let canClose = false;

            // Countdown logic
            const countdownInterval = setInterval(() => {
                timeLeft--;
                countdown.textContent = `${timeLeft}s`;

                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    countdown.textContent = '✓ Complete';
                    countdown.style.background = 'rgba(76, 175, 80, 0.9)';

                    // Show close button
                    closeBtn.style.display = 'flex';
                    canClose = true;

                    // Update info
                    infoText.textContent = 'Reward earned! Tap X to close';
                    infoText.style.color = '#4CAF50';
                }
            }, 1000);

            // Event handlers
            const cleanup = (success) => {
                clearInterval(countdownInterval);
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                console.log(`[AdsManager] [MOCK] Ad ${success ? 'Completed - Reward Granted' : 'Closed Early - No Reward'}`);
                resolve(success);
            };

            closeBtn.onclick = () => {
                cleanup(canClose); // Only grant reward if ad completed
            };

            // Prevent closing early (optional - simulate real ad behavior)
            overlay.onclick = (e) => {
                if (e.target === overlay && !canClose) {
                    // Shake effect to indicate can't close yet
                    overlay.style.animation = 'shake 0.3s';
                    setTimeout(() => {
                        overlay.style.animation = '';
                    }, 300);
                }
            };
        });
    }
}

export default new AdsManager();
