export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.moveAnchorX = null;
        this.moveAnchorY = null;
        // Read setting from registry (default true)
        this.joystickVisible = scene.registry.get('showJoystick') !== false;

        // Constants
        this.SPLIT_X = 280;
    }

    setupInputs() {
        const scene = this.scene;

        // Joystick UI
        scene.joystickBase = scene.add.image(0, 0, 'joystick_base').setAlpha(0.5).setScrollFactor(0).setDepth(999).setVisible(false);
        scene.joystickKnob = scene.add.image(0, 0, 'joystick_knob').setAlpha(0.8).setScrollFactor(0).setDepth(1000).setVisible(false);

        // Keyboard
        scene.cursors = scene.input.keyboard.createCursorKeys();
        scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Touch Inputs
        scene.input.on('pointerdown', (pointer) => {
            if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || scene.isDevMenuOpen) return;
            if (!scene.gameStarted) { scene.startGame(); return; }
            if (pointer.x > this.SPLIT_X) {
                this.handleJump();
                // Visual feedback for jump
                let feedback = scene.add.image(pointer.x, pointer.y, 'jump_feedback')
                    .setAlpha(0.8).setDepth(1000).setScrollFactor(0);
                scene.tweens.add({
                    targets: feedback,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => feedback.destroy()
                });
            }
        });

        // Keyboard Jump
        scene.spaceKey.on('down', () => {
            if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || scene.isDevMenuOpen) return;
            if (!scene.gameStarted) { scene.startGame(); return; }
            this.handleJump();
        });

        // Add multi-touch support
        scene.input.addPointer(3);
    }

    handleJump() {
        const scene = this.scene;
        // --- APLICAR SPEED BOOST ---
        let boost = scene.isInvincible ? 1.25 : 1.0; // 25% Extra Force

        // Play jump sound with random pitch variation
        try {
            if (scene.sound && scene.cache.audio.exists('jump_sfx')) {
                const randomDetune = Phaser.Math.Between(-300, 300); // Wider range for more variety
                scene.sound.play('jump_sfx', { detune: randomDetune, volume: 0.15 });
            }
        } catch (error) {
            console.warn('Error playing jump sound:', error);
        }

        const result = scene.player.jump(boost);

        if (result) {
            if (result.type === 'wall_jump') {
                scene.sparkEmitter.emitParticleAt(result.x, result.y, 10);
            } else {
                scene.dustEmitter.emitParticleAt(result.x, result.y, 10);
            }
        }
    }

    update() {
        const scene = this.scene;
        if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || !scene.gameStarted || scene.isDevMenuOpen) return;

        let movePointer = null;
        let keyboardMove = 0;

        // Detectar movimiento por teclado
        if (scene.cursors.left.isDown) {
            keyboardMove = -1;
        } else if (scene.cursors.right.isDown) {
            keyboardMove = 1;
        }

        // Detectar movimiento táctil (solo si no hay input de teclado o es móvil)
        if (scene.isMobile || keyboardMove === 0) {
            scene.input.manager.pointers.forEach((pointer) => {
                if (pointer.isDown && pointer.x <= this.SPLIT_X) movePointer = pointer;
            });
        }

        if (keyboardMove !== 0) {
            // --- MOVIMIENTO POR TECLADO ---
            this.moveAnchorX = null;
            scene.joystickBase.setVisible(false);
            scene.joystickKnob.setVisible(false);
            scene.player.move(keyboardMove);
        } else if (movePointer) {
            // --- USUARIO MOVIENDO (TÁCTIL) ---
            if (this.moveAnchorX === null) {
                this.moveAnchorX = movePointer.x;
                this.moveAnchorY = movePointer.y;

                // Position joystick at touch start
                scene.joystickBase.setPosition(this.moveAnchorX, this.moveAnchorY);
                scene.joystickKnob.setPosition(this.moveAnchorX, this.moveAnchorY);

                if (this.joystickVisible) {
                    scene.joystickBase.setVisible(true);
                    scene.joystickKnob.setVisible(true);
                }
            }

            // Calculate delta
            const dx = movePointer.x - this.moveAnchorX;
            const dy = movePointer.y - this.moveAnchorY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40; // Max joystick radius

            // Clamp knob position
            if (dist > maxDist) {
                const angle = Math.atan2(dy, dx);
                scene.joystickKnob.x = this.moveAnchorX + Math.cos(angle) * maxDist;
                scene.joystickKnob.y = this.moveAnchorY + Math.sin(angle) * maxDist;
            } else {
                scene.joystickKnob.setPosition(movePointer.x, movePointer.y);
            }

            // Move player if threshold passed
            if (Math.abs(dx) > 10) {
                scene.player.move(dx > 0 ? 1 : -1);
            } else {
                scene.player.stop();
            }
        } else {
            this.moveAnchorX = null;
            scene.joystickBase.setVisible(false);
            scene.joystickKnob.setVisible(false);
            scene.player.stop();
        }
    }

    toggleJoystickVisual() {
        // Read current state from registry and toggle it
        const currentState = this.scene.registry.get('showJoystick') !== false;
        this.joystickVisible = !currentState;
        const scene = this.scene;

        // Persist state in registry
        scene.registry.set('showJoystick', this.joystickVisible);

        if (this.joystickVisible) {
            scene.joystickToggleButton.setText('🕹️ JOYSTICK: ON');
        } else {
            scene.joystickToggleButton.setText('🕹️ JOYSTICK: OFF');
        }
    }
}
