import GameState from '../core/GameState.js';
import { UIHelpers } from '../utils/UIHelpers.js';

export class Settings extends Phaser.Scene {
    // ... existing constructor ...

    create() {
        // ... existing code ...

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
