import { UIHelpers } from '../../Utils/UIHelpers.js';

export class ExtraLifeModal extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this.scene = scene;
        this.setDepth(500); // High depth to overlay everything
        this.setScrollFactor(0);
        this.setVisible(false);
        this.scene.add.existing(this);

        this.createUI();
    }

    createUI() {
        const width = 320;
        const height = 450;
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;

        // Overlay (Darken background)
        // Overlay (Darken background & Block Inputs)
        // Interactive to explicitly BLOCK clicks from passing through
        const overlay = this.scene.add.rectangle(centerX, centerY,
            this.scene.cameras.main.width, this.scene.cameras.main.height,
            0x000000, 0.85
        );
        overlay.setInteractive(); // Blocks input to game below
        this.add(overlay);

        // Modal Background (Dark Cyberpunk Style)
        const bg = this.scene.add.rectangle(centerX, centerY, width, height, 0x111111);
        bg.setStrokeStyle(4, 0x00ffff); // Cyan Border
        this.add(bg);

        // Header Background
        const headerBg = this.scene.add.rectangle(centerX, centerY - height / 2 + 40, width, 80, 0x000000);
        this.add(headerBg);

        // "EXTRA LIFE" Title
        const titleText = this.scene.add.text(centerX, centerY - 160, 'EXTRA LIFE', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#00ffff',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#008888',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        }).setOrigin(0.5);
        this.add(titleText);

        // --- ClOSE BUTTON ---
        const closeBtnX = centerX + (width / 2) - 25;
        const closeBtnY = centerY - (height / 2) + 25;

        // Hit Area for Close Button (Transparent Circle on top)
        const closeHitArea = this.scene.add.circle(closeBtnX, closeBtnY, 30, 0xff0000, 0.001); // Almost invisible
        closeHitArea.setInteractive({ useHandCursor: true });

        const closeBtnVisual = this.scene.add.circle(closeBtnX, closeBtnY, 18, 0x333333);
        closeBtnVisual.setStrokeStyle(2, 0xffffff);

        const closeX = this.scene.add.text(closeBtnX, closeBtnY, 'X', {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add(closeBtnVisual);
        this.add(closeX);
        this.add(closeHitArea); // Add LAST to ensure it catches clicks

        closeHitArea.on('pointerdown', () => {
            console.log('[ExtraLifeModal] Close/Skip clicked');
            this.startCloseAnimation();
            if (this.onCloseCallback) this.onCloseCallback();
        });

        // --- ICON AREA ---
        const circleY = centerY - 30;
        const glowRing = this.scene.add.circle(centerX, circleY, 75, 0x00ffff, 0.2);
        this.add(glowRing);

        const imageCircle = this.scene.add.circle(centerX, circleY, 65, 0x000000);
        imageCircle.setStrokeStyle(3, 0xF9C150);
        this.add(imageCircle);

        const heartText = this.scene.add.text(centerX, circleY, '❤️', {
            fontSize: '64px'
        }).setOrigin(0.5);
        this.add(heartText);

        const helpText = this.scene.add.text(centerX, centerY + 65, 'WATCH AD TO\nREVIVE FREE!', {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(helpText);

        // --- REVIVE BUTTON ---
        const playBtnY = centerY + 150;
        const btnWidth = 220;
        const btnHeight = 70;

        // Visual group
        const btnBox = this.scene.add.rectangle(centerX, playBtnY, btnWidth, btnHeight, 0x00aa00);
        btnBox.setStrokeStyle(3, 0xffffff);
        this.add(btnBox);

        const btnShine = this.scene.add.rectangle(centerX, playBtnY - 15, btnWidth, btnHeight / 2, 0xffffff, 0.2);
        this.add(btnShine);

        const btnText = this.scene.add.text(centerX + 15, playBtnY, 'REVIVE', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setOrigin(0.5);
        this.add(btnText);

        const playIcon = this.scene.add.triangle(centerX - 60, playBtnY, 0, 0, 0, 24, 20, 12, 0xffffff);
        this.add(playIcon);

        // Interaction Zone (Added LAST)
        const btnHitZone = this.scene.add.zone(centerX, playBtnY, btnWidth, btnHeight);
        btnHitZone.setInteractive({ useHandCursor: true });
        this.add(btnHitZone);

        btnHitZone.on('pointerdown', () => {
            console.log('[ExtraLifeModal] Revive Clicked');
            // Animate visuals
            this.scene.tweens.add({
                targets: [btnBox, btnShine, btnText, playIcon],
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.handleReviveClick();
                }
            });
        });
    }

    show(onRevive, onClose) {
        this.onReviveCallback = onRevive;
        this.onCloseCallback = onClose;

        this.setVisible(true);
        this.setAlpha(0);
        this.setScale(0.9);
        this.setDepth(3000);

        // Start Animation
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    handleReviveClick() {
        if (this.clicked) return; // Debounce
        this.clicked = true;

        console.log('[ExtraLifeModal] ✅ Processing Revive Click');
        if (this.onReviveCallback) this.onReviveCallback();

        // Clean up input immediately
        this.cleanupInput();
    }

    handleCloseClick() {
        if (this.clicked) return;
        this.clicked = true;
        this.startCloseAnimation();
        if (this.onCloseCallback) this.onCloseCallback();
        this.cleanupInput();
    }

    cleanupInput() {
        this.clicked = false;
    }

    startCloseAnimation() {
        this.cleanupInput(); // Ensure it's gone

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.9,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }
}
