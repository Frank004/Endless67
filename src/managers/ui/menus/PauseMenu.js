import { UIHelpers } from '../../../utils/UIHelpers.js';
import GameState from '../../../core/GameState.js';
import EventBus, { Events } from '../../../core/EventBus.js';

export class PauseMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.buttons = {};
        this.pauseButton = null;
        this.pauseButtonBg = null;
    }

    create() {
        const scene = this.scene;
        const centerX = scene.cameras.main.centerX;
        const gameWidth = scene.cameras.main.width;

        // --- PAUSE BUTTON ---
        // Ad banner está arriba (50px), así que el gameplay empieza desde Y=50
        const adBannerHeight = 50;
        const pauseButtonY = 40 + adBannerHeight; // 50px debajo del ad banner
        this.pauseButtonBg = scene.add.circle(gameWidth - 16, pauseButtonY, 16, 0x000000, 0.5)
            .setScrollFactor(0).setDepth(200);

        this.pauseButton = scene.add.image(gameWidth - 16, pauseButtonY, 'ui_icons', 'pause')
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true })
            .setScale(0.375)
            .setTint(0xffffff)
            .on('pointerdown', () => this.toggle())
            .on('pointerover', () => this.pauseButtonBg.setFillStyle(0x333333, 0.7))
            .on('pointerout', () => this.pauseButtonBg.setFillStyle(0x000000, 0.5));

        // Alias for compatibility if needed (scene.pauseButton used elsewhere?)
        scene.pauseButton = this.pauseButton;
        scene.pauseButtonBg = this.pauseButtonBg;

        this.createMenuOverlay(centerX);
    }

    createMenuOverlay(centerX) {
        const scene = this.scene;

        // --- PAUSE MENU OVERLAY ---
        this.bg = scene.add.rectangle(scene.cameras.main.centerX, scene.cameras.main.centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(200).setVisible(false).setInteractive();

        this.title = scene.add.text(centerX, 180, 'PAUSE', {
            fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        this.versionText = scene.add.text(centerX, 220, 'v0.0.38', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Button spacing
        const buttonSpacing = 70;
        let buttonY = 280;

        // Continue Button
        const continueBtn = UIHelpers.createTextButton(scene, centerX, buttonY, 'CONTINUE', {
            textColor: '#00ff00',
            hoverColor: '#00ffff',
            callback: () => this.toggle()
        });
        this.buttons.continue = continueBtn;
        this.buttons.continue.container.setVisible(false);
        buttonY += buttonSpacing;

        // Sound Toggle Button
        const soundEnabled = scene.registry.get('soundEnabled') !== false;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIconFrame = soundEnabled ? 'volume-up' : 'volume-mute';

        const soundButton = UIHelpers.createIconButton(scene, centerX, buttonY, soundIconFrame, soundTextStr, {
            callback: () => scene.toggleSound()
        });
        this.buttons.sound = soundButton;
        this.buttons.sound.container.setVisible(false);
        buttonY += buttonSpacing;

        // Joystick Toggle Button
        const showJoystick = scene.registry.get('showJoystick') !== false;
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        const joystickButton = UIHelpers.createIconButton(scene, centerX, buttonY, 'gamepad', joystickTextStr, {
            callback: () => scene.inputManager.toggleJoystickVisual()
        });
        this.buttons.joystick = joystickButton;
        this.buttons.joystick.container.setVisible(false);
        buttonY += buttonSpacing;

        // Exit Button
        const exitButton = UIHelpers.createIconButton(scene, centerX, buttonY, 'door', 'EXIT TO MENU', {
            textColor: '#ff6666',
            hoverColor: '#ff0000',
            iconTint: 0xff6666,
            callback: () => scene.scene.start('MainMenu')
        });
        this.buttons.exit = exitButton;
        this.buttons.exit.container.setVisible(false);

        // Aliases for scene access if needed (or refactor UIManager to use this class properties)
        scene.pauseMenuBg = this.bg;
        scene.pauseMenuTitle = this.title;
        scene.versionText = this.versionText;
        scene.continueButton = this.buttons.continue.container;
        scene.soundToggleContainer = this.buttons.sound.container;
        scene.soundToggleText = this.buttons.sound.text;
        scene.soundToggleIcon = this.buttons.sound.icon;
        scene.joystickToggleContainer = this.buttons.joystick.container;
        scene.joystickToggleText = this.buttons.joystick.text;
        scene.joystickToggleIcon = this.buttons.joystick.icon;
        scene.exitButtonContainer = this.buttons.exit.container;
    }

    toggle() {
        // Refrescar estado actual
        const currentlyPaused = GameState.isPaused;
        if (currentlyPaused) {
            GameState.resume();     // Emitirá GAME_RESUMED
            this.hide();   // Fallback directo
        } else {
            GameState.pause();      // Emitirá GAME_PAUSED
            this.show();   // Fallback directo
        }
    }

    show() {
        const scene = this.scene;

        // Update button icons and text
        const soundEnabled = GameState.soundEnabled;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIcon = soundEnabled ? 'volume-up' : 'volume-mute';

        if (this.buttons.sound) {
            this.buttons.sound.text.setText(soundTextStr);
            this.buttons.sound.icon.setFrame(soundIcon);
        }

        const showJoystick = scene.registry.get('showJoystick') !== false;
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        if (this.buttons.joystick) {
            this.buttons.joystick.text.setText(joystickTextStr);
            this.buttons.joystick.icon.setAlpha(showJoystick ? 1 : 0.5);
        }

        this.bg.setVisible(true);
        this.title.setVisible(true);
        this.versionText.setVisible(true);
        this.buttons.continue.container.setVisible(true);
        this.buttons.sound.container.setVisible(true);
        this.buttons.joystick.container.setVisible(true);
        this.buttons.exit.container.setVisible(true);
        this.pauseButton.setFrame('play'); // Play icon
        scene.tweens.pauseAll();
    }

    hide() {
        const scene = this.scene;
        this.bg.setVisible(false);
        this.title.setVisible(false);
        this.versionText.setVisible(false);
        this.buttons.continue.container.setVisible(false);
        this.buttons.sound.container.setVisible(false);
        this.buttons.joystick.container.setVisible(false);
        this.buttons.exit.container.setVisible(false);
        this.pauseButton.setFrame('pause'); // Pause icon
        scene.tweens.resumeAll();
    }
}
