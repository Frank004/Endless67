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

        // --- SOUND TOGGLE ---
        // Read sound state from registry (default true if not set)
        const soundEnabled = this.registry.get('soundEnabled') !== false;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIconFrame = soundEnabled ? 'volume-up' : 'volume-mute';

        this.soundBtn = this.add.text(width / 2 + 20, 200, soundTextStr, {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.soundIcon = this.add.image(width / 2 - 80, 200, 'ui_icons', soundIconFrame)
            .setOrigin(0.5).setScale(0.4).setTint(0xffffff);

        this.soundBtn.on('pointerdown', () => {
            const currentState = this.registry.get('soundEnabled') !== false;
            const newState = !currentState;
            this.registry.set('soundEnabled', newState);
            // Sync Phaser's sound mute state with registry
            this.sound.mute = !newState;
            this.soundBtn.setText(newState ? 'SOUND: ON' : 'SOUND: OFF');
            this.soundIcon.setFrame(newState ? 'volume-up' : 'volume-mute');
        });

        // --- JOYSTICK TOGGLE ---
        // We need to access a global setting or pass it via registry. 
        // For now, let's use the registry to store preference.
        const showJoystick = this.registry.get('showJoystick') !== false; // Default true
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        this.joystickBtn = this.add.text(width / 2 + 20, 300, joystickTextStr, {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.joystickIcon = this.add.image(width / 2 - 90, 300, 'ui_icons', 'gamepad')
            .setOrigin(0.5).setScale(0.4).setTint(0xffffff);

        this.joystickBtn.on('pointerdown', () => {
            const newState = !this.registry.get('showJoystick');
            this.registry.set('showJoystick', newState);
            this.joystickBtn.setText(newState ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
        });

        // Hover effects
        this.soundBtn.on('pointerover', () => { this.soundBtn.setColor('#ffff00'); this.soundIcon.setTint(0xffff00); });
        this.soundBtn.on('pointerout', () => { this.soundBtn.setColor('#ffffff'); this.soundIcon.setTint(0xffffff); });

        this.joystickBtn.on('pointerover', () => { this.joystickBtn.setColor('#ffff00'); this.joystickIcon.setTint(0xffff00); });
        this.joystickBtn.on('pointerout', () => { this.joystickBtn.setColor('#ffffff'); this.joystickIcon.setTint(0xffffff); });

        // Back Button
        const backBtn = this.add.text(width / 2, height - 100, 'BACK TO MENU', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        backBtn.on('pointerover', () => backBtn.setColor('#00ffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    }
}
