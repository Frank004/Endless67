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
        const isMuted = this.sound.mute;
        this.soundBtn = this.add.text(width / 2, 200, isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.soundBtn.on('pointerdown', () => {
            this.sound.mute = !this.sound.mute;
            this.soundBtn.setText(this.sound.mute ? '🔇 SOUND: OFF' : '🔊 SOUND: ON');
        });

        // --- JOYSTICK TOGGLE ---
        // We need to access a global setting or pass it via registry. 
        // For now, let's use the registry to store preference.
        const showJoystick = this.registry.get('showJoystick') !== false; // Default true

        this.joystickBtn = this.add.text(width / 2, 300, showJoystick ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.joystickBtn.on('pointerdown', () => {
            const newState = !this.registry.get('showJoystick');
            this.registry.set('showJoystick', newState);
            this.joystickBtn.setText(newState ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF');
        });

        // Hover effects
        [this.soundBtn, this.joystickBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setColor('#ffff00'));
            btn.on('pointerout', () => btn.setColor('#ffffff'));
        });

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
