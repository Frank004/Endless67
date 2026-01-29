import GameState from '../Core/GameState.js';
import { UIHelpers } from '../Utils/UIHelpers.js';
import { InputSystem } from '../Systems/Core/InputSystem.js';
import EventBus, { Events } from '../Core/EventBus.js';
import { MenuNavigation } from '../UI/Menus/MenuNavigation.js';

export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        this.inputManager = new InputSystem(this);
        this.inputManager.setupInputs();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        let buttonY = height / 2 - 50;
        const buttonSpacing = 80;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

        // Title
        this.add.text(width / 2, 100, 'SETTINGS', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- AUDIO CONTROLS (Split Music & SFX) ---
        // Music Button (Left)
        const musicButton = UIHelpers.createMusicButton(this, width / 2 - 54, buttonY, { scale: 0.42 });

        // SFX Button (Right)
        const sfxButton = UIHelpers.createSFXButton(this, width / 2 + 54, buttonY, { scale: 0.42 });

        buttonY += buttonSpacing;

        // --- JOYSTICK TOGGLE ---
        const joystickButton = UIHelpers.createJoystickButton(this, width / 2, buttonY);

        buttonY += buttonSpacing;

        // Back Button
        const backCallback = () => this.scene.start('MainMenu');
        const backBtn = UIHelpers.createSpriteButton(this, width / 2, buttonY, 'btn/btn-exit.png', {
            callback: backCallback
        });

        // --- MENU NAVIGATION ---
        this.menuNavigation = new MenuNavigation(this, [
            musicButton, // Nav order: Music -> SFX -> Joystick -> Back
            sfxButton,
            joystickButton,
            backBtn
        ]);
        this.menuNavigation.setup();

        // --- UNIFIED INPUT LISTENING ---
        // Explicit Back handler
        EventBus.on(Events.UI_BACK, backCallback, this);

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            if (this.menuNavigation) this.menuNavigation.cleanup();
            EventBus.off(Events.UI_BACK, backCallback, this);
        });
    }

    update(time, delta) {
        this.inputManager.update(time, delta);
    }
}
