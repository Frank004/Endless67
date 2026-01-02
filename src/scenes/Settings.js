import { UIHelpers } from '../utils/UIHelpers.js';

export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

        // Title
        this.add.text(width / 2, 80, 'SETTINGS', {
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button spacing
        const buttonSpacing = 100;
        let buttonY = 200;

        // --- SOUND TOGGLE ---
        const soundEnabled = this.registry.get('soundEnabled') !== false;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIconFrame = soundEnabled ? 'volume-up' : 'volume-mute';

        const soundButton = UIHelpers.createIconButton(this, width / 2, buttonY, soundIconFrame, soundTextStr, {
            callback: () => {
                const currentState = this.registry.get('soundEnabled') !== false;
                const newState = !currentState;
                this.registry.set('soundEnabled', newState);
                // Sync Phaser's sound mute state with registry
                this.sound.mute = !newState;
                this.soundText.setText(newState ? 'SOUND: ON' : 'SOUND: OFF');
                this.soundIcon.setFrame(newState ? 'volume-up' : 'volume-mute');
            }
        });
        this.soundContainer = soundButton.container;
        this.soundText = soundButton.text;
        this.soundIcon = soundButton.icon;
        buttonY += buttonSpacing;

        // --- JOYSTICK TOGGLE ---
        const showJoystick = this.registry.get('showJoystick') !== false;
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        const joystickButton = UIHelpers.createIconButton(this, width / 2, buttonY, 'gamepad', joystickTextStr, {
            callback: () => {
                const newState = !this.registry.get('showJoystick');
                this.registry.set('showJoystick', newState);
                this.joystickText.setText(newState ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
            }
        });
        this.joystickContainer = joystickButton.container;
        this.joystickText = joystickButton.text;
        this.joystickIcon = joystickButton.icon;
        buttonY += buttonSpacing;

        // Back Button
        const backBtn = UIHelpers.createTextButton(this, width / 2, buttonY, 'BACK TO MENU', {
            callback: () => this.scene.start('MainMenu')
        });
        this.backButton = backBtn.container;
    }
}
