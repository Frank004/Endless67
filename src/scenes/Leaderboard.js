import { ScoreManager } from '../managers/ScoreManager.js';

export class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
        this.scoreManager = new ScoreManager();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

        // Title
        this.add.text(width / 2, 60, 'TOP 10 SCORES', {
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Headers
        this.add.text(40, 120, 'RANK', { fontSize: '16px', color: '#888' });
        this.add.text(120, 120, 'NAME', { fontSize: '16px', color: '#888' });
        this.add.text(220, 120, 'HEIGHT', { fontSize: '16px', color: '#888' });
        this.add.text(320, 120, 'COINS', { fontSize: '16px', color: '#888' });

        // Scores
        const scores = this.scoreManager.getTopScores();
        let y = 160;

        if (scores.length === 0) {
            this.add.text(width / 2, height / 2, 'NO SCORES YET', {
                fontSize: '20px',
                color: '#444'
            }).setOrigin(0.5);
        } else {
            scores.forEach((score, index) => {
                const color = index === 0 ? '#ffd700' : (index === 1 ? '#c0c0c0' : (index === 2 ? '#cd7f32' : '#ffffff'));

                this.add.text(60, y, `#${index + 1}`, { fontSize: '16px', color: color }).setOrigin(0.5, 0);
                this.add.text(140, y, score.name, { fontSize: '16px', color: color }).setOrigin(0.5, 0);
                this.add.text(245, y, `${score.height}m`, { fontSize: '16px', color: color }).setOrigin(0.5, 0);
                this.add.text(345, y, `${score.coins}`, { fontSize: '16px', color: color }).setOrigin(0.5, 0);

                y += 35;
            });
        }

        // Back Button
        const backBtn = this.add.text(width / 2, height - 60, 'BACK TO MENU', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        backBtn.on('pointerover', () => backBtn.setColor('#00ffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    }
}
