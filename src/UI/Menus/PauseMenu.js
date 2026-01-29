import { UIHelpers } from '../../Utils/UIHelpers.js';
import { MenuNavigation } from './MenuNavigation.js';
import GameState from '../../Core/GameState.js';
import EventBus, { Events } from '../../Core/EventBus.js';

export class PauseMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.buttons = {};
        this.pauseButton = null;
        this.pauseButtonBg = null;
        this.menuNavigation = null;
    }

    create() {
        const scene = this.scene;
        const centerX = scene.cameras.main.centerX;
        const gameWidth = scene.cameras.main.width;

        // --- PAUSE BUTTON ---
        // Ad banner está arriba (50px), así que el gameplay empieza desde Y=50
        const adBannerHeight = 50;
        const pauseButtonY = 40 + adBannerHeight; // 50px debajo del ad banner
        const pauseButtonX = gameWidth - 16; // Centered in 32px wall (16px from edge)

        this.pauseButton = scene.add.image(pauseButtonX, pauseButtonY, 'ui_hud', 'btn-small/btn-small-pause.png')
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => this.toggle())
            .on('pointerover', () => this.pauseButton.setTint(0xcccccc))
            .on('pointerout', () => this.pauseButton.clearTint());

        // Alias for compatibility if needed (scene.pauseButton used elsewhere?)
        scene.pauseButton = this.pauseButton;

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

        this.versionText = scene.add.text(centerX, 220, window.GAME_VERSION || 'v0.0.52', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Button spacing
        const buttonSpacing = 70;
        let buttonY = 280;

        // Continue Button
        this.buttons.continue = UIHelpers.createSpriteButton(scene, centerX, buttonY, 'btn/btn-continue.png', {
            callback: () => this.toggle()
        });
        this.buttons.continue.container.setVisible(false);
        buttonY += buttonSpacing;

        const soundY = buttonY;

        // Music & SFX Buttons (Side by Side)
        this.buttons.music = UIHelpers.createMusicButton(scene, centerX - 54, soundY, { scale: 0.42 });
        this.buttons.music.container.setVisible(false);

        this.buttons.sfx = UIHelpers.createSFXButton(scene, centerX + 54, soundY, { scale: 0.42 });
        this.buttons.sfx.container.setVisible(false);

        buttonY += buttonSpacing;

        // Joystick Toggle Button
        this.buttons.joystick = UIHelpers.createJoystickButton(scene, centerX, buttonY, { scale: 1.0 });
        this.buttons.joystick.container.setVisible(false);
        buttonY += buttonSpacing;

        // Exit Button
        this.buttons.exit = UIHelpers.createSpriteButton(scene, centerX, buttonY, 'btn/btn-exit.png', {
            callback: () => scene.scene.start('MainMenu')
        });
        this.buttons.exit.container.setVisible(false);

        // Aliases for compatibility
        scene.pauseMenuBg = this.bg;
        scene.pauseMenuTitle = this.title;
        scene.versionText = this.versionText;

        // Setup Navigation Manager
        this.menuNavigation = new MenuNavigation(scene, [
            this.buttons.continue,
            this.buttons.music,
            this.buttons.sfx,
            this.buttons.joystick,
            this.buttons.exit
        ]);
    }

    toggle() {
        console.log('[PauseMenu] Toggle called. GameOver:', GameState.isGameOver, 'Paused:', GameState.isPaused);
        if (GameState.isGameOver) {
            console.log('[PauseMenu] Blocked by Game Over');
            return;
        }

        const currentlyPaused = GameState.isPaused;
        if (currentlyPaused) {
            console.log('[PauseMenu] Resuming');
            GameState.resume();
        } else {
            console.log('[PauseMenu] Pausing');
            GameState.pause();
        }
    }

    show() {
        const scene = this.scene;
        this.updateMenuState();

        this.bg.setVisible(true);
        this.title.setVisible(true);
        this.versionText.setVisible(true);
        // Buttons visibility
        Object.values(this.buttons).forEach(btn => btn.container.setVisible(true));

        this.pauseButton.setTexture('ui_hud', 'btn-small/btn-small-play.png'); // Play icon
        // Removed pauseAll to prevent UI tween lockup

        this.menuNavigation.setup();
    }

    hide() {
        const scene = this.scene;
        this.bg.setVisible(false);
        this.title.setVisible(false);
        this.versionText.setVisible(false);
        // Buttons visibility
        Object.values(this.buttons).forEach(btn => btn.container.setVisible(false));

        this.pauseButton.setTexture('ui_hud', 'btn-small/btn-small-pause.png'); // Pause icon
        // Removed resumeAll

        this.menuNavigation.cleanup();
    }

    updateMenuState() {
        const scene = this.scene;

        // Update Music Button
        if (this.buttons.music) {
            const musicEnabled = scene.registry.get('musicEnabled') !== false;
            this.buttons.music.sprite.setFrame(musicEnabled ? 'btn-mid/music-on.png' : 'btn-mid/music-off.png');
        }

        // Update SFX Button
        if (this.buttons.sfx) {
            const sfxEnabled = scene.registry.get('sfxEnabled') !== false;
            this.buttons.sfx.sprite.setFrame(sfxEnabled ? 'btn-mid/sfx-on.png' : 'btn-mid/sfx-off.png');
        }

        // Update Joystick Button
        if (this.buttons.joystick) {
            const showJoystick = scene.registry.get('showJoystick') !== false;
            this.buttons.joystick.sprite.setFrame(showJoystick ? 'btn/btn-joystick-on.png' : 'btn/btn-joystick-off.png');
        }
    }
}
