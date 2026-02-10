import { ASSETS } from '../../Config/AssetKeys.js';
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
        // Note: Not interactive to avoid blocking clicks underneath, but the modal bg will block.
        const overlay = this.scene.add.rectangle(centerX, centerY,
            this.scene.cameras.main.width, this.scene.cameras.main.height,
            0x000000, 0.85
        );
        this.add(overlay);

        // Modal Background (Sprite-based: top, tiled center, bottom)
        const topFrame = this.scene.textures.getFrame(ASSETS.UI_HUD, 'modal/modal-top.png');
        const bottomFrame = this.scene.textures.getFrame(ASSETS.UI_HUD, 'modal/modal-bottom.png');
        const centerFrame = this.scene.textures.getFrame(ASSETS.UI_HUD, 'modal/modal-center.png');

        const topH = topFrame?.height || 53;
        const bottomH = bottomFrame?.height || 64;
        const centerH = Math.max(0, height - topH - bottomH);

        const top = this.scene.add.image(
            centerX,
            centerY - height / 2 + topH / 2,
            ASSETS.UI_HUD,
            'modal/modal-top.png'
        );
        this.add(top);

        const center = this.scene.add.tileSprite(
            centerX,
            centerY - height / 2 + topH + centerH / 2,
            width,
            centerH,
            ASSETS.UI_HUD,
            'modal/modal-center.png'
        );
        this.add(center);

        const bottom = this.scene.add.image(
            centerX,
            centerY + height / 2 - bottomH / 2,
            ASSETS.UI_HUD,
            'modal/modal-bottom.png'
        );
        this.add(bottom);

        // "EXTRA LIFE" Title
        const titleText = this.scene.add.text(centerX, centerY - 150, 'EXTRA LIFE', {
            fontSize: '36px',
            fontFamily: 'Pixelify Sans',
            color: '#F9C150',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        }).setOrigin(0.5);
        this.add(titleText);

        // --- ClOSE BUTTON ---
        const closeBtnX = centerX + (width / 2) - 25;
        const closeBtnY = centerY - (height / 2) + 25;

        const closeBtn = this.scene.add.image(closeBtnX, closeBtnY, ASSETS.UI_HUD, 'btn-small/btn-small-x.png');
        closeBtn.setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        UIHelpers.applyButtonEffects(closeBtn);
        this.add(closeBtn);

        closeBtn.on('pointerdown', () => {
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

        const helpText = this.scene.add.text(centerX, centerY + 75, 'WATCH AD TO\nREVIVE FREE!', {
            fontSize: '20px',
            fontFamily: 'Pixelify Sans',
            color: '#F9C150',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(helpText);

        // --- REVIVE BUTTON ---
        const playBtnY = centerY + 150;
        const reviveBtn = this.scene.add.image(centerX, playBtnY, ASSETS.UI_HUD, 'btn/btn-revive.png');
        reviveBtn.setOrigin(0.5);
        reviveBtn.setInteractive({ useHandCursor: true });
        UIHelpers.applyButtonEffects(reviveBtn, { enableClick: false });
        this.add(reviveBtn);

        // Interaction Zone (Added LAST)
        reviveBtn.on('pointerdown', () => {
            console.log('[ExtraLifeModal] Revive Clicked');
            // Animate visuals
            this.scene.tweens.add({
                targets: reviveBtn,
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

        // --- MANUAL FAILSAFE INPUT ---
        // Register a direct global listener to bypass any propagation issues
        if (this.failSafeListener) {
            this.scene.input.off('pointerdown', this.failSafeListener);
        }

        const width = 320;
        const height = 450;
        const cx = this.scene.cameras.main.centerX;
        const cy = this.scene.cameras.main.centerY;

        this.failSafeListener = (pointer) => {
            if (!this.visible) return;

            // Check Revive Button (Center Bottom)
            // Center: cx, cy + 150. Size: 220x70
            const rx = cx;
            const ry = cy + 150;
            const rw = 220;
            const rh = 70;

            if (pointer.x >= rx - rw / 2 && pointer.x <= rx + rw / 2 &&
                pointer.y >= ry - rh / 2 && pointer.y <= ry + rh / 2) {
                console.log('✅ [ExtraLifeModal] Failsafe Click: Revive');
                this.handleReviveClick();
                return;
            }

            // Check Close Button (Top Right)
            // Center: cx + 135, cy - 200. Radius ~30
            const closeX = cx + (width / 2) - 25;
            const closeY = cy - (height / 2) + 25;
            const dx = pointer.x - closeX;
            const dy = pointer.y - closeY;
            if (dx * dx + dy * dy <= 40 * 40) { // Generous 40px radius
                console.log('✅ [ExtraLifeModal] Failsafe Click: Close');
                this.handleCloseClick();
                return;
            }
        };

        this.scene.input.on('pointerdown', this.failSafeListener);
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
        if (this.failSafeListener) {
            this.scene.input.off('pointerdown', this.failSafeListener);
            this.failSafeListener = null;
        }
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
