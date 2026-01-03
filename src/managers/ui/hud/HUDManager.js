import GameState from '../../core/GameState.js';

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
        const scoreX = 35; // Align with wall
        const scoreY = isMobile ? 20 : 10;
        const centerX = scene.cameras.main.centerX;

        // Semi-transparent background for score
        this.scoreTextBg = scene.add.rectangle(scoreX, scoreY + 12, 130, 28, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(99);

        this.scoreText = scene.add.text(scoreX + 8, scoreY, 'SCORE: 0', {
            fontSize: '20px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(100);

        // Semi-transparent background for height
        this.heightTextBg = scene.add.rectangle(scoreX, scoreY + 42, 110, 22, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(99);

        this.heightText = scene.add.text(scoreX + 8, scoreY + 30, 'HEIGHT: ' + scene.currentHeight + 'm', {
            fontSize: '14px',
            color: '#fff'
        }).setScrollFactor(0).setDepth(100);

        this.uiText = scene.add.text(centerX, 200, 'CLIMB!', {
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
            this.scoreText.setText('SCORE: ' + score);
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
            this.uiText.setText(`GAME OVER\nScore: ${data.score}`);
        }
    }

    hideUIText() {
        if (this.uiText) this.uiText.setVisible(false);
    }
}
