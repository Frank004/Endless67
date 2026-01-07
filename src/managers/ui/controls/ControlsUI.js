export class ControlsUI {
    constructor(scene) {
        this.scene = scene;
        this.controlTextLeft = null;
        this.controlTextRight = null;
        this.controlTextPC = null;
        this.joystickBase = null;
        this.joystickKnob = null;
    }

    create() {
        const scene = this.scene;
        const isMobile = scene.isMobile;
        const centerX = scene.cameras.main.centerX;

        // Joystick UI (created here but controlled by InputManager)
        this.joystickBase = scene.add.image(0, 0, 'joystick_base').setAlpha(0.5).setScrollFactor(0).setDepth(999).setVisible(false);
        this.joystickKnob = scene.add.image(0, 0, 'joystick_knob').setAlpha(0.8).setScrollFactor(0).setDepth(1000).setVisible(false);

        // Alias for scene compatibility
        scene.joystickBase = this.joystickBase;
        scene.joystickKnob = this.joystickKnob;

        // Positions based on the 32px Floor at the bottom of the gameplay stage
        // Ad banner está arriba, así que el floor va al fondo sin restar adHeight
        const floorHeight = 32;
        const effectiveHeight = scene.scale.height; // Ad banner está arriba, no resta altura
        const controlY = effectiveHeight - (floorHeight / 2); // Center of the 32px floor

        // Mobile Controls UI
        if (isMobile) {
            const cameraWidth = scene.cameras.main.width;
            // Dynamic split based on game width (70% for mobile)
            const SPLIT_X = Math.round(cameraWidth * 0.70);

            let splitLine = scene.add.graphics();
            splitLine.lineStyle(2, 0xffffff, 0.15);
            splitLine.beginPath(); splitLine.moveTo(SPLIT_X, effectiveHeight); splitLine.lineTo(SPLIT_X, effectiveHeight - floorHeight); splitLine.strokePath();
            splitLine.setScrollFactor(0).setDepth(100);

            // Left side text: center of left area (SPLIT_X / 2)
            const leftTextX = Math.round(SPLIT_X / 2);
            // Right side text: center of right area (SPLIT_X + (cameraWidth - SPLIT_X) / 2)
            const rightTextX = Math.round(SPLIT_X + (cameraWidth - SPLIT_X) / 2);

            this.controlTextLeft = scene.add.text(leftTextX, controlY, '< HOLD & SLIDE >', { fontSize: '12px', color: '#333', alpha: 0.8 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
            this.controlTextRight = scene.add.text(rightTextX, controlY, 'JUMP', { fontSize: '12px', color: '#333', alpha: 0.8 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

            scene.controlTextLeft = this.controlTextLeft;
            scene.controlTextRight = this.controlTextRight;
            scene.controlSplitLine = splitLine; // Keep reference to hide it later
        } else {
            this.controlTextPC = scene.add.text(centerX, controlY, '← → MOVE | SPACE JUMP', { fontSize: '12px', color: '#f5f5f5ff', alpha: 0.8 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
            scene.controlTextPC = this.controlTextPC;
        }
    }

    setGameStartUI() {
        if (this.controlTextLeft) this.controlTextLeft.setVisible(false);
        if (this.controlTextRight) this.controlTextRight.setVisible(false);
        if (this.controlTextPC) this.controlTextPC.setVisible(false);
        if (this.scene.controlSplitLine) this.scene.controlSplitLine.setVisible(false);
    }

    showJumpFeedback(x, y) {
        const scene = this.scene;
        let feedback = scene.add.image(x, y, 'jump_feedback')
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

    // Joystick methods
    showJoystick(x, y, visible) {
        if (this.joystickBase && this.joystickKnob) {
            this.joystickBase.setPosition(x, y);
            this.joystickKnob.setPosition(x, y);
            if (visible) {
                this.joystickBase.setVisible(true);
                this.joystickKnob.setVisible(true);
            }
        }
    }

    updateJoystickKnob(x, y) {
        if (this.joystickKnob) {
            this.joystickKnob.setPosition(x, y);
        }
    }

    hideJoystick() {
        if (this.joystickBase) this.joystickBase.setVisible(false);
        if (this.joystickKnob) this.joystickKnob.setVisible(false);
    }
}
