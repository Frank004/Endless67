import GameState from '../core/GameState.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import { InputSystem } from '../core/systems/InputSystem.js';
import EventBus, { Events } from '../core/EventBus.js';
import { MenuNavigation } from '../managers/ui/MenuNavigation.js';

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

        // --- SOUND TOGGLE ---
        const soundEnabled = this.registry.get('soundEnabled') !== false;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIconFrame = soundEnabled ? 'volume-up' : 'volume-mute';

        const soundButton = UIHelpers.createIconButton(this, width / 2, buttonY, soundIconFrame, soundTextStr, {
            callback: () => {
                const newState = !GameState.soundEnabled;

                // 1. Update GameState (Source of Truth)
                GameState.setSoundEnabled(newState);

                // 2. Update Registry
                this.registry.set('soundEnabled', newState);

                // 3. Update Phaser Sound Manager
                this.sound.mute = !newState;

                // 4. Update UI
                soundButton.text.setText(newState ? 'SOUND: ON' : 'SOUND: OFF');
                soundButton.icon.setFrame(newState ? 'volume-up' : 'volume-mute');
            }
        });

        buttonY += buttonSpacing;

        // --- JOYSTICK TOGGLE ---
        const showJoystick = this.registry.get('showJoystick') !== false;
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        const joystickButton = UIHelpers.createIconButton(this, width / 2, buttonY, 'gamepad', joystickTextStr, {
            callback: () => {
                const newState = !this.registry.get('showJoystick');
                this.registry.set('showJoystick', newState);
                joystickButton.text.setText(newState ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
            }
        });

        buttonY += buttonSpacing;

        // Back Button
        const backCallback = () => this.scene.start('MainMenu');
        const backBtn = UIHelpers.createTextButton(this, width / 2, buttonY, 'BACK TO MENU', {
            callback: backCallback
        });

        // --- MENU NAVIGATION ---
        this.menuNavigation = new MenuNavigation(this, [
            soundButton,
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
