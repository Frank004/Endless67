import { UIHelpers } from '../utils/UIHelpers.js';

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

		// Keyboard Navigation Setup
		this.menuButtons = [startBtn, leaderboardBtn, settingsBtn];
		this.selectedButtonIndex = 0;
		this.updateButtonSelection();

		// Keyboard Controls
		this.input.keyboard.on('keydown-UP', () => {
			this.selectedButtonIndex = (this.selectedButtonIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
			this.updateButtonSelection();
		});

		this.input.keyboard.on('keydown-DOWN', () => {
			this.selectedButtonIndex = (this.selectedButtonIndex + 1) % this.menuButtons.length;
			this.updateButtonSelection();
		});

		this.input.keyboard.on('keydown-SPACE', () => {
			this.activateSelectedButton();
		});

		this.input.keyboard.on('keydown-ENTER', () => {
			this.activateSelectedButton();
		});

		// Version (visible text)
		const versionText = this.add.text(width / 2, height - 30, 'v0.0.36', {
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

	updateButtonSelection() {
        // Reset all buttons to default state
        this.menuButtons.forEach((btn, index) => {
            const label = btn.label || btn.list?.find?.(c => c.style);
            const originalColor = btn.getData('originalColor') || '#ffffff';
            if (index === this.selectedButtonIndex) {
                if (label?.setColor) label.setColor('#ffff00');
                btn.setScale(1.1);
            } else {
                if (label?.setColor) label.setColor(originalColor);
                btn.setScale(1.0);
            }
        });
	}

	activateSelectedButton() {
        const selectedButton = this.menuButtons[this.selectedButtonIndex];
        if (selectedButton && selectedButton.getData('onClick')) {
            selectedButton.getData('onClick')();
        }
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
        const { container, text: label } = UIHelpers.createTextButton(this, x, y, text, {
            textColor: color,
            hoverColor: '#ffff00',
            fontSize: '28px'
        });

        container.setData('originalColor', color);
        container.setData('onClick', onClick);
        container.label = label;

        container.off('pointerdown');
        container.on('pointerdown', onClick);

        // Propagate hover to ensure consistent color handling with selection
        container.on('pointerover', () => label.setColor('#ffff00'));
        container.on('pointerout', () => label.setColor(container.getData('originalColor')));

        return container;
    }
}
