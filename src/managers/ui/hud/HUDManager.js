import GameState from '../../../core/GameState.js';

export class HUDManager {
    constructor(scene) {
        this.scene = scene;
        this.scoreText = null;
        this.scoreTextBg = null;
        this.heightText = null;
        this.heightTextBg = null;
        this.uiText = null;
    }

    create() {
        const scene = this.scene;
        const isMobile = scene.isMobile;
        const labelPaddingX = 8;
        const labelPaddingY = 6;

        // UI - Position away from left wall
        // Ad banner está arriba (50px), así que el gameplay empieza desde Y=50
        const adBannerHeight = 50;
        const scoreX = 35; // Align with wall
        const scoreY = (isMobile ? 20 : 10) + adBannerHeight; // 50px debajo del ad banner
        const centerX = scene.cameras.main.centerX;

        // --- PRIMARY: HEIGHT (Main metric for leaderboard) ---
        this.heightText = scene.add.text(scoreX + 8, scoreY, 'HEIGHT: ' + (scene.currentHeight || 0) + 'm', {
            fontSize: '16px',
            color: '#ffffff', // White
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
        this.heightTextBg = scene.add.rectangle(
            this.heightText.x - labelPaddingX,
            this.heightText.y,
            this.heightText.width + labelPaddingX * 2,
            this.heightText.height + labelPaddingY,
            0x000000,
            0.5
        ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(200);

        // --- SECONDARY: COINS (Currency) ---
        this.scoreText = scene.add.text(scoreX + 8, scoreY + 24, 'COINS: 0', {
            fontSize: '12px',
            color: '#ffd700', // Gold
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
        this.scoreTextBg = scene.add.rectangle(
            this.scoreText.x - labelPaddingX,
            this.scoreText.y,
            this.scoreText.width + labelPaddingX * 2,
            this.scoreText.height + labelPaddingY,
            0x000000,
            0.5
        ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(200);

        // UI text también debe estar 50px más abajo
        this.uiText = scene.add.text(centerX, 200 + adBannerHeight, 'JUMP!', {
            fontSize: '18px',
            color: '#00ffff',
            align: 'center',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Alias scene properties for compatibility
        scene.scoreText = this.scoreText;
        scene.heightText = this.heightText;
        scene.uiText = this.uiText;

        this.labelPaddingX = labelPaddingX;
        this.labelPaddingY = labelPaddingY;
    }

    updateScore(score) {
        if (this.scoreText) {
            this.scoreText.setText('COINS: ' + score);
            if (this.scoreTextBg) {
                this.scoreTextBg.setSize(
                    this.scoreText.width + this.labelPaddingX * 2,
                    this.scoreText.height + this.labelPaddingY
                );
                this.scoreTextBg.setPosition(this.scoreText.x - this.labelPaddingX, this.scoreText.y);
            }
        }
    }

    updateHeight(height) {
        if (this.heightText) {
            this.heightText.setText(`HEIGHT: ${height}m`);
            if (this.heightTextBg) {
                this.heightTextBg.setSize(
                    this.heightText.width + this.labelPaddingX * 2,
                    this.heightText.height + this.labelPaddingY
                );
                this.heightTextBg.setPosition(this.heightText.x - this.labelPaddingX, this.heightText.y);
            }
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
