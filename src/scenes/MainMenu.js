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

		// Version (visible text)
		const versionText = this.add.text(width / 2, height - 30, 'v0.0.35', {
			fontSize: '14px',
			color: '#444'
		}).setOrigin(0.5);

		// Invisible larger touch area for easier mobile activation (increased size)
		const touchArea = this.add.rectangle(width / 2, height - 30, 300, 120, 0x000000, 0)
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		// Secret Dev Mode Access
		let clickCount = 0;
		let lastClickTime = 0;

		touchArea.on('pointerdown', () => {
			const now = this.time.now;
			if (now - lastClickTime < 500) {
				clickCount++;
			} else {
				clickCount = 1;
			}
			lastClickTime = now;

			if (clickCount === 5) {
				this.showDevButton(width, height);
			}
		});
	}

	showDevButton(width, height) {
		const devBtn = this.createButton(width / 2, height - 80, '👾 DEV MODE', '#ff0000', () => this.scene.start('Playground'));
		this.tweens.add({
			targets: devBtn,
			alpha: { from: 0, to: 1 },
			duration: 500,
			yoyo: true,
			repeat: -1
		});
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
