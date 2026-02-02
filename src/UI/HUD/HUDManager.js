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
        // Ad banner está arriba (Top Banner), necesitamos dejar espacio
        const adBannerHeight = 80;
        const hudBaseY = 90; // Moved UP (was 110) to reduce gap with Ad
        const marginX = 15;

        // 0. Top Gradient for readability (Premium Shadow / Vignette)
        const width = scene.cameras.main.width;
        const shadowHeight = 220; // Más alto para un fade más suave

        // Generar textura procedural si no existe (Efficient 1-time texturing)
        const textureKey = 'hud_shadow_vignette';
        if (!scene.textures.exists(textureKey)) {
            const texture = scene.textures.createCanvas(textureKey, 2, shadowHeight);
            const ctx = texture.context;

            // Linear Gradient Vertical
            const grd = ctx.createLinearGradient(0, 0, 0, shadowHeight);
            grd.addColorStop(0, 'rgba(0,0,0,0.9)');     // Muy oscuro arriba
            grd.addColorStop(0.3, 'rgba(0,0,0,0.6)');   // Oscuridad media en zona Ad
            grd.addColorStop(0.6, 'rgba(0,0,0,0.3)');   // Suave tras el HUD
            grd.addColorStop(1, 'rgba(0,0,0,0)');       // Transparente final

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 2, shadowHeight);
            texture.refresh();
        }

        // Add Image stretching the procedural texture
        const gradient = scene.add.image(0, 0, textureKey)
            .setOrigin(0, 0)
            .setDisplaySize(width, shadowHeight) // Estirar a todo el ancho
            .setScrollFactor(0)
            .setDepth(199)
            .setAlpha(0.95);

        this.hudGradient = gradient;

        // 1. COINS (Currency) - Left
        // CoinCounter internal coords logic: x, y is using SCALE inside? 
        // CoinCounter.js seems to apply scale to the container or children.
        // Assuming we set scale on children or pass scale via constructor NOT possible here.
        // We set scale on container.

        // Scale 0.6 calculation:
        // Original H ~45px -> Scaled ~27px. Half = 13.5.
        // Internal origin is (0, 0.5) so Y IS THE CENTER.
        // We want Center Y to be hudBaseY (110).
        const coinScale = 0.6;
        const coinY = hudBaseY;

        this.scoreContainer = new CoinCounter(scene, marginX, coinY);
        this.scoreContainer.setDepth(201).setScrollFactor(0);
        this.scoreContainer.setScale(coinScale); // Apply scale to container

        if (typeof this.scoreContainer.setName === 'function') {
            this.scoreContainer.setName('hud_score_container');
        }
        scene._hudScoreContainer = this.scoreContainer;

        // 2. HEIGHT (Leaderboard Metric) - Right of Coins
        // Estimate Coin Width Scaled: ~180px * 0.6 = 108px.
        // Let's bring it closer.
        const heightX = marginX + 115;

        // Background Sprite
        this.heightBg = scene.add.image(heightX, hudBaseY, ASSETS.UI_HUD, 'panels/metercounter.png')
            .setOrigin(0, 0.5) // Left-Center origin
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(0.6); // Escala reducida a 0.6

        // Height Text
        this.heightText = scene.add.text(heightX + 10, hudBaseY, 'HEIGHT: ' + (scene.currentHeight || 0) + 'm', {
            fontSize: '10px', // Smaller Font
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);

        // Initial Update
        this.updateScore(scene.totalScore || 0);

        // UI text también debe estar 50px más abajo
        const centerX = scene.cameras.main.centerX;
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
