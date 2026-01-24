import { UIHelpers } from '../Utils/UIHelpers.js';
import { InputSystem } from '../Systems/Core/InputSystem.js';
import { MenuNavigation } from '../UI/Menus/MenuNavigation.js';
import EventBus, { Events } from '../Core/EventBus.js';
import AudioSystem from '../Systems/Core/AudioSystem.js';
import GameState from '../Core/GameState.js';
import { ASSETS } from '../Config/AssetKeys.js';

export class MainMenu extends Phaser.Scene {
	constructor() {
		super('MainMenu');
		this.menuNavigation = null;
	}

	create() {
		// Hide HTML Loader when Menu is actually ready
		const htmlLoader = document.getElementById('loader');
		if (htmlLoader) {
			htmlLoader.style.display = 'none';
			if (htmlLoader.parentNode) htmlLoader.parentNode.removeChild(htmlLoader);
		}

		// Initialize Audio Manager for this scene to capture interactions
		AudioSystem.setScene(this);
		AudioSystem.setupAudioContextResume();

		this.inputManager = new InputSystem(this);
		this.inputManager.setupInputs();

		const width = this.cameras.main.width;
		const height = this.cameras.main.height;

		// Background
		const bg = this.add.image(width / 2, height / 2, ASSETS.MAIN_BG)
			.setOrigin(0.5);
		// Scale to cover the screen
		const scaleX = width / bg.width;
		const scaleY = height / bg.height;
		bg.setScale(Math.max(scaleX, scaleY));

		// Title
		this.add.image(width / 2, 120, ASSETS.GAME_LOGO).setScale(0.28);

		// --- BUTTONS ---
		this.buttons = [];
		const buttonSpacing = 65;
		const startY = height / 2;

		const startBtn = UIHelpers.createSpriteButton(this, width / 2, startY, 'btn/btn-start.png', {
			callback: () => this.scene.start('Game')
		});
		this.buttons.push(startBtn);

		const leaderboardBtn = UIHelpers.createSpriteButton(this, width / 2, startY + buttonSpacing, 'btn/btn-leaderboard.png', {
			callback: () => this.scene.start('Leaderboard')
		});
		this.buttons.push(leaderboardBtn);

		const skinsBtn = UIHelpers.createSpriteButton(this, width / 2, startY + buttonSpacing * 2, 'btn/btn-vault-store.png', {
			callback: () => this.scene.start('Store')
		});
		this.buttons.push(skinsBtn);

		const settingsBtn = UIHelpers.createSpriteButton(this, width / 2, startY + buttonSpacing * 3, 'btn/btn-setting.png', {
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
		// Version (visible text with background)
		const versionStr = window.GAME_VERSION || 'v0.0.51';
		const versionText = this.add.text(width / 2, height - 30, versionStr, {
			fontSize: '14px',
			color: '#aaaaaa',
			fontFamily: 'monospace'
		}).setOrigin(0.5).setDepth(20);

		const versionBgWidth = versionText.width + 30;
		const versionBgHeight = 26;

		const vBg = this.add.graphics();
		vBg.fillStyle(0x000000, 0.6);
		vBg.fillRoundedRect(-versionBgWidth / 2, -versionBgHeight / 2, versionBgWidth, versionBgHeight, 13);
		vBg.setPosition(width / 2, height - 30);
		vBg.setDepth(19);

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
