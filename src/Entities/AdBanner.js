import { Capacitor } from '@capacitor/core';

export class AdBanner extends Phaser.GameObjects.Container {
    constructor(scene) {
        // If native, don't show mock visual banner (AdMob handles it)
        if (Capacitor.isNativePlatform()) {
            super(scene, 0, 0);
            this.setVisible(false);
            return;
        }

        const width = scene.scale.width;
        const x = 0;
        const y = 0;

        super(scene, x, y);

        const bannerWidth = 320;
        const bannerHeight = 50; // Strict standard height

        // Center horizontal
        const startX = (width - bannerWidth) / 2;

        // Container for the banner graphics specifically (so we can scale it slightly)
        const bannerContainer = scene.add.container(0, 0);

        // Background (White)
        const bg = scene.add.rectangle(startX, 0, bannerWidth, bannerHeight, 0xFFFFFF).setOrigin(0, 0);

        // "Ad" Badge (Small and subtle)
        const badgeBg = scene.add.rectangle(startX, 0, 20, 14, 0xF0AD4E).setOrigin(0, 0);
        const badgeTxt = scene.add.text(startX + 2, 1, 'Ad', { fontSize: '9px', fontFamily: 'Arial', color: '#fff' }).setOrigin(0, 0);

        // Text
        const title = scene.add.text(startX + (bannerWidth / 2), bannerHeight / 2 - 5, 'Test mode', {
            fontSize: '14px',
            color: '#000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = scene.add.text(startX + (bannerWidth / 2), bannerHeight / 2 + 8, '320x50', {
            fontSize: '9px',
            color: '#666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        bannerContainer.add([bg, badgeBg, badgeTxt, title, subtitle]);

        // TRICK: Scale to 90% to force side gaps visual (User Request: "No tan grande y completo")
        // This simulates how it looks on a high-DPI phone where 320px < Screen Width
        bannerContainer.setScale(0.9);
        // Re-center after scale (Approx 0.9 center)
        bannerContainer.x = (width * 0.05);

        this.add(bannerContainer);

        // Mock Ad rotation logic removed for simplicity - just a placeholder now
        this.mockAdTexts = [];

        this.setScrollFactor(0);
        this.setDepth(10000); // Overlay puro
        scene.add.existing(this);
    }

    refreshAd() {
        // No-op
    }

    destroy() {
        if (this.rotationTimer) {
            this.rotationTimer.remove();
        }
        super.destroy();
    }
}
