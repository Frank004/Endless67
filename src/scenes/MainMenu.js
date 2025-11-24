export class MainMenu extends Phaser.Scene {
	constructor() {
		super('MainMenu');
	}

	create() {
		const width = this.cameras.main.width;
		const height = this.cameras.main.height;

		// Background
		this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

		// Title
		this.add.text(width / 2, 120, 'ENDLESS 67', {
			fontSize: '48px',
			color: '#ffd700',
			fontStyle: 'bold',
			stroke: '#8B4500',
			strokeThickness: 6
		}).setOrigin(0.5);

		// --- BUTTONS ---
		const startBtn = this.createButton(width / 2, 250, 'START GAME', '#00ff00', () => this.scene.start('Game'));
		const leaderboardBtn = this.createButton(width / 2, 330, 'LEADERBOARD', '#00ffff', () => this.scene.start('Leaderboard'));
		const settingsBtn = this.createButton(width / 2, 410, 'SETTINGS', '#ffffff', () => this.scene.start('Settings'));

		// Version
		this.add.text(width / 2, height - 30, 'v0.0.34', {
			fontSize: '14px',
			color: '#444'
		}).setOrigin(0.5);
	}

	createButton(x, y, text, color, onClick) {
		const btn = this.add.text(x, y, text, {
			fontSize: '28px',
			color: color,
			backgroundColor: '#333333',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		btn.on('pointerdown', onClick);
		btn.on('pointerover', () => btn.setColor('#ffff00'));
		btn.on('pointerout', () => btn.setColor(color));

		return btn;
	}
}
