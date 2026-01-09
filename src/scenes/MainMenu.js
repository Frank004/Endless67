import { UIHelpers } from '../utils/UIHelpers.js';
import { InputManager } from '../managers/input/InputManager.js';
import { MenuNavigation } from '../managers/ui/MenuNavigation.js';
import EventBus, { Events } from '../core/EventBus.js';
import GameState from '../core/GameState.js';

export class MainMenu extends Phaser.Scene {
	constructor() {
		super('MainMenu');
		this.menuNavigation = null;
	}

	create() {
		this.inputManager = new InputManager(this);
		this.inputManager.setupInputs();

		const width = this.cameras.main.width;
		const height = this.cameras.main.height;

		// Background
		this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

		// Title
		// Title
		this.add.image(width / 2, 120, 'game_logo').setScale(0.35);

		// --- BUTTONS ---
		this.buttons = [];

		const startBtn = UIHelpers.createTextButton(this, width / 2, 250, 'START GAME', {
			textColor: '#00ff00',
			fontSize: '28px',
			callback: () => this.scene.start('Game')
		});
		this.buttons.push(startBtn);

		const leaderboardBtn = UIHelpers.createTextButton(this, width / 2, 330, 'LEADERBOARD', {
			textColor: '#00ffff',
			fontSize: '28px',
			callback: () => this.scene.start('Leaderboard')
		});
		this.buttons.push(leaderboardBtn);

		const settingsBtn = UIHelpers.createTextButton(this, width / 2, 410, 'SETTINGS', {
			textColor: '#ffffff',
			fontSize: '28px',
			callback: () => this.scene.start('Settings')
		});
		this.buttons.push(settingsBtn);

		// --- NAVIGATION ---
		this.menuNavigation = new MenuNavigation(this, this.buttons);
		this.menuNavigation.setup();

		// Cleanup on scene shutdown
		this.events.once('shutdown', () => {
			if (this.menuNavigation) this.menuNavigation.cleanup();
		});

		// Version (visible text)
		const versionText = this.add.text(width / 2, height - 30, 'v0.0.42', {
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

	update(time, delta) {
		this.inputManager.update(time, delta);
	}

	showDevButton(width, height) {
		const devBtn = UIHelpers.createTextButton(this, width / 2, height - 80, '👾 DEV MODE', {
			textColor: '#ff0000',
			fontSize: '28px',
			callback: () => this.scene.start('Playground')
		});

		this.tweens.add({
			targets: devBtn.container,
			alpha: { from: 0, to: 1 },
			duration: 500,
			yoyo: true,
			repeat: -1
		});

		// Update Navigation
		this.buttons.push(devBtn);
		this.menuNavigation.updateButtons(this.buttons);
	}
}
