import GameState from '../../Core/GameState.js';
import { ASSETS } from '../../Config/AssetKeys.js';
import { CoinCounter } from './CoinCounter.js';

export class HUDManager {
    constructor(scene) {
        this.scene = scene;
        this.scoreContainer = null;
        this.scoreBg = null;
        this.scoreDigits = null;
        this.heightText = null;
        this.heightTextBg = null;
        this.uiText = null;
        this.labelPaddingX = 8;
        this.labelPaddingY = 6;
    }

    create() {
        const scene = this.scene;
        const isMobile = scene.isMobile;
        const labelPaddingX = this.labelPaddingX;
        const labelPaddingY = this.labelPaddingY;

        // Clean up existing elements to prevent duplication
        // 1. Aggressive Cleanup: Find ALL containers with this name (not just the first one)
        const displayList = scene.children?.list || [];
        const existingContainers = displayList.filter(child => child.name === 'hud_score_container');
        existingContainers.forEach(container => container.destroy());

        // 2. Check by Scene Property (Persistence Safety)
        if (scene._hudScoreContainer && scene._hudScoreContainer.active) {
            scene._hudScoreContainer.destroy();
        }

        if (this.scoreContainer) this.scoreContainer.destroy();
        if (this.heightText) this.heightText.destroy();
        if (this.heightTextBg) this.heightTextBg.destroy(); // Legacy cleanup
        if (this.heightBg) this.heightBg.destroy();         // New bg cleanup
        if (this.uiText) this.uiText.destroy();

        // UI - Position away from left wall
        // Ad banner está arriba (50px), así que el gameplay empieza desde Y=50
        const adBannerHeight = 50;
        const scoreX = 15; // Align with wall (Requested: 15px from edge)

        // Positioning Calculations
        // 1. Height Counter: 10px padding from banner
        const heightY = adBannerHeight + 10;

        // 2. Coin Counter: 5px padding below Height Counter
        // metercounter.png is 33px tall.
        // If heightY is the top-left (Origin 0,0), then bottom is heightY + 33.
        // If heightY is center (Origin 0, 0.5), it's harder. Let's use Origin(0, 0.5) for consistency with Coin.
        // Center Y: Banner(50) + 10(pad) + 16.5(half height) = 76.5
        const heightCenterY = adBannerHeight + 10 + 16.5;

        // Coin Counter Y
        // Start after Height: (50 + 10 + 33) + 5(pad) = 98 (Top edge)
        // coincounter.png is 45px tall. Half is 22.5.
        // Center Y: 98 + 22.5 = 120.5
        const scoreCenterY = (adBannerHeight + 10 + 33 + 5) + 22.5;

        const centerX = scene.cameras.main.centerX;

        // --- PRIMARY: HEIGHT (Main metric for leaderboard) ---
        // Background Sprite
        this.heightBg = scene.add.image(scoreX, heightCenterY, ASSETS.UI_HUD, 'panels/metercounter.png')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(0.8); // Matching requested scale of coin counter

        // Height Text
        // Align inside the sprite. Sprite is 180px wide * 0.8 = 144px.
        // Text should be left-aligned with some padding.
        this.heightText = scene.add.text(scoreX + 8, heightCenterY, 'HEIGHT: ' + (scene.currentHeight || 0) + 'm', {
            fontSize: '12px', // Reduced to fit
            color: '#ffffff', // White
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.45).setScrollFactor(0).setDepth(201);

        // --- SECONDARY: COINS (Currency) ---
        // New Sprite-based Implementation using CoinCounter component
        this.scoreContainer = new CoinCounter(scene, scoreX, scoreCenterY);
        this.scoreContainer.setDepth(201).setScrollFactor(0);
        if (typeof this.scoreContainer.setName === 'function') {
            this.scoreContainer.setName('hud_score_container'); // Prevent duplication
        }
        scene._hudScoreContainer = this.scoreContainer; // Store reference for robust cleanup

        // Initial Update
        this.updateScore(scene.totalScore || 0);

        // UI text también debe estar 50px más abajo
        this.uiText = scene.add.text(centerX, 200 + adBannerHeight, 'JUMP!', {
            fontSize: '18px',
            color: '#00ffff',
            align: 'center',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Alias scene properties for compatibility
        // scene.scoreText = this.scoreText; // Removed
        scene.heightText = this.heightText;
        scene.uiText = this.uiText;
    }

    updateScore(score) {
        if (this.scoreContainer) {
            this.scoreContainer.setValue(score);
        }
    }

    updateHeight(height) {
        if (this.heightText) {
            this.heightText.setText(`HEIGHT: ${height}m`);
            // Bg image is static size, no need to resize like the rectangle
        }
    }

    showGameOver(data) {
        if (this.uiText) {
            this.uiText.setVisible(true);
            this.uiText.setText(`GAME OVER\nHeight: ${data.height}m`);
        }
    }

    hideUIText() {
        if (this.uiText) this.uiText.setVisible(false);
    }
}
