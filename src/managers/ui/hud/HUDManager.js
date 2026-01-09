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

        // UI - Position away from left wall
        // Ad banner está arriba (50px), así que el gameplay empieza desde Y=50
        const adBannerHeight = 50;
        const scoreX = 35; // Align with wall
        const scoreY = (isMobile ? 20 : 10) + adBannerHeight; // 50px debajo del ad banner
        const centerX = scene.cameras.main.centerX;

        // --- PRIMARY: HEIGHT (Main metric for leaderboard) ---
        this.heightTextBg = scene.add.rectangle(scoreX, scoreY + 12, 140, 28, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(200);

        this.heightText = scene.add.text(scoreX + 8, scoreY, 'HEIGHT: ' + (scene.currentHeight || 0) + 'm', {
            fontSize: '20px',
            color: '#ffffff', // White
            fontStyle: 'bold' // Restore bold for standard font visibility
        }).setScrollFactor(0).setDepth(201);

        // --- SECONDARY: COINS (Currency) ---
        this.scoreTextBg = scene.add.rectangle(scoreX, scoreY + 42, 110, 22, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(200);

        this.scoreText = scene.add.text(scoreX + 8, scoreY + 30, 'COINS: 0', {
            fontSize: '14px',
            color: '#ffd700', // Gold
            fontStyle: 'bold' // Restore bold
        }).setScrollFactor(0).setDepth(201);

        // UI text también debe estar 50px más abajo
        this.uiText = scene.add.text(centerX, 200 + adBannerHeight, 'JUMP!', {
            fontSize: '18px',
            color: '#00ffff',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Alias scene properties for compatibility
        scene.scoreText = this.scoreText;
        scene.heightText = this.heightText;
        scene.uiText = this.uiText;
    }

    updateScore(score) {
        if (this.scoreText) {
            this.scoreText.setText('COINS: ' + score);
        }
    }

    updateHeight(height) {
        if (this.heightText) {
            this.heightText.setText(`HEIGHT: ${height}m`);
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
