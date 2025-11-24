export class UIManager {
    constructor(scene) {
        this.scene = scene;
    }

    createUI() {
        const scene = this.scene;
        const isMobile = scene.isMobile;

        // UI - Ajustar márgenes para móvil
        const scoreX = isMobile ? 20 : 10;
        const scoreY = isMobile ? 20 : 10;
        scene.scoreText = scene.add.text(scoreX, scoreY, 'SCORE: 0', { fontSize: '24px', color: '#ffd700', fontStyle: 'bold' }).setScrollFactor(0).setDepth(100);
        scene.heightText = scene.add.text(scoreX, scoreY + 30, 'ALTURA: ' + scene.currentHeight + 'm', { fontSize: '14px', color: '#fff' }).setScrollFactor(0).setDepth(100);
        scene.uiText = scene.add.text(200, 200, '¡SUBE!', { fontSize: '18px', color: '#00ffff', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // --- PAUSE BUTTON ---
        scene.pauseButton = scene.add.text(370, 10, '⏸', { fontSize: '24px', color: '#ffffff' })
            .setScrollFactor(0).setDepth(150).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu());

        // --- PAUSE MENU OVERLAY ---
        scene.pauseMenuBg = scene.add.rectangle(scene.cameras.main.centerX, scene.cameras.main.centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(200).setVisible(false).setInteractive();

        scene.pauseMenuTitle = scene.add.text(200, 180, 'PAUSA', {
            fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        scene.versionText = scene.add.text(200, 220, 'v0.0.35', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Continue Button
        scene.continueButton = scene.add.text(200, 260, 'CONTINUAR', {
            fontSize: '24px', color: '#00ff00', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu())
            .on('pointerover', function () { this.setColor('#00ffff'); })
            .on('pointerout', function () { this.setColor('#00ff00'); });

        // Sound Toggle Button - Initialize with current state from registry
        const soundEnabled = scene.registry.get('soundEnabled') !== false;
        const soundButtonText = soundEnabled ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
        scene.soundToggleButton = scene.add.text(200, 330, soundButtonText, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => scene.toggleSound()) // Assuming toggleSound remains in Game or moves to Audio
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Joystick Toggle Button - Initialize with current state from registry
        const showJoystick = scene.registry.get('showJoystick') !== false;
        const joystickButtonText = showJoystick ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF';
        scene.joystickToggleButton = scene.add.text(200, 400, joystickButtonText, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => scene.inputManager.toggleJoystickVisual())
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Exit Button
        scene.exitButton = scene.add.text(200, 470, '🚪 SALIR AL MENÚ', {
            fontSize: '24px', color: '#ff6666', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                scene.scene.start('MainMenu');
            })
            .on('pointerover', function () { this.setColor('#ff0000'); })
            .on('pointerout', function () { this.setColor('#ff6666'); });

        // Mobile Controls UI
        if (isMobile) {
            const cameraHeight = scene.cameras.main.height;
            const SPLIT_X = 280;
            let splitLine = scene.add.graphics();
            splitLine.lineStyle(2, 0xffffff, 0.15);
            splitLine.beginPath(); splitLine.moveTo(SPLIT_X, cameraHeight); splitLine.lineTo(SPLIT_X, cameraHeight - 50); splitLine.strokePath();
            splitLine.setScrollFactor(0).setDepth(0);

            const controlY = cameraHeight - 40;
            scene.add.text(140, controlY, '< HOLD & SLIDE >', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            scene.add.text(340, controlY, 'JUMP', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        } else {
            scene.add.text(200, 560, '← → MOVER | SPACE SALTAR', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0);
        }
    }

    update() {
        const scene = this.scene;
        scene.heightText.setText(`ALTURA: ${scene.currentHeight}m`);
    }

    togglePauseMenu() {
        const scene = this.scene;
        scene.isPaused = !scene.isPaused;

        if (scene.isPaused) {
            scene.physics.pause();
            // Update button texts to reflect current registry state
            const soundEnabled = scene.registry.get('soundEnabled') !== false;
            const soundButtonText = soundEnabled ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
            if (scene.soundToggleButton) {
                scene.soundToggleButton.setText(soundButtonText);
            }
            
            const showJoystick = scene.registry.get('showJoystick') !== false;
            const joystickButtonText = showJoystick ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF';
            if (scene.joystickToggleButton) {
                scene.joystickToggleButton.setText(joystickButtonText);
            }
            
            scene.pauseMenuBg.setVisible(true);
            scene.pauseMenuTitle.setVisible(true);
            if (scene.versionText) scene.versionText.setVisible(true);
            scene.continueButton.setVisible(true);
            scene.soundToggleButton.setVisible(true);
            scene.joystickToggleButton.setVisible(true);
            scene.exitButton.setVisible(true);
            scene.pauseButton.setText('▶'); // Play icon
            scene.tweens.pauseAll();
        } else {
            scene.physics.resume();
            scene.pauseMenuBg.setVisible(false);
            scene.pauseMenuTitle.setVisible(false);
            if (scene.versionText) scene.versionText.setVisible(false);
            scene.continueButton.setVisible(false);
            scene.soundToggleButton.setVisible(false);
            scene.joystickToggleButton.setVisible(false);
            scene.exitButton.setVisible(false);
            scene.pauseButton.setText('⏸'); // Pause icon
            scene.tweens.resumeAll();
        }
    }

    trigger67Celebration() {
        const scene = this.scene;
        try {
            scene.isPausedEvent = true;
            scene.physics.pause();
            scene.cameras.main.flash(500, 255, 255, 255);

            if (scene.confettiEmitter) {
                scene.confettiEmitter.setPosition(scene.cameras.main.centerX, scene.cameras.main.scrollY - 50);
                scene.confettiEmitter.explode(80);
            }

            try {
                if (scene.sound && scene.cache.audio.exists('celebration_sfx')) {
                    scene.sound.play('celebration_sfx', { volume: 0.7 });
                }
            } catch (error) {
                console.warn('Error playing celebration sound:', error);
            }

            let t = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.scrollY + 300, '67!', {
                fontFamily: '"Courier New", monospace', fontSize: '100px', color: '#ffd700', fontStyle: 'bold', stroke: '#8B4500', strokeThickness: 10,
                shadow: { offsetX: 6, offsetY: 6, color: '#000000', blur: 0, stroke: true, fill: true }
            }).setOrigin(0.5).setDepth(200);

            scene.tweens.add({ targets: t, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });

            scene.time.delayedCall(1500, () => {
                if (t && t.destroy) t.destroy();
                scene.physics.resume();
                scene.isPausedEvent = false;
            });
        } catch (e) {
            console.error('Error in trigger67Celebration:', e);
            scene.physics.resume();
            scene.isPausedEvent = false;
        }
    }
}
