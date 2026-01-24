import { ASSETS } from '../../Config/AssetKeys.js';

export class CoinCounter extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        this.setScale(0.8); // Default scale

        // Background
        // Origin 0, 0.5 aligns left-center
        this.bg = scene.add.image(0, 0, ASSETS.UI_HUD, 'panels/coincounter.png').setOrigin(0, 0.5);
        this.add(this.bg);

        // Digits Container
        this.digitsContainer = scene.add.container(0, 0);
        this.add(this.digitsContainer);
    }

    setValue(amount) {
        // Formatting logic
        // < 10,000: Exact
        // >= 10,000: 10k
        // >= 1,000,000: 1m
        // >= 1,000,000,000: 1b

        let formatted = Math.floor(amount).toString();
        let suffix = '';

        if (amount >= 1000000000) {
            formatted = Math.floor(amount / 1000000000).toString();
            suffix = 'b';
        } else if (amount >= 1000000) {
            formatted = Math.floor(amount / 1000000).toString();
            suffix = 'm';
        } else if (amount >= 10000) {
            formatted = Math.floor(amount / 1000).toString();
            suffix = 'k';
        }

        // Clear previous sprites
        this.digitsContainer.removeAll(true);

        const spacing = 1; // Spacing between sprites
        let currentX = 0;

        // 1. Dollar Sign ($)
        const dollar = this.scene.add.image(0, 0, ASSETS.UI_HUD, 'numbers/dollarsign.png').setOrigin(0, 0.5);
        this.digitsContainer.add(dollar);
        currentX += dollar.width + spacing;

        // 2. Digits
        for (let char of formatted) {
            const digit = this.scene.add.image(currentX, 0, ASSETS.UI_HUD, `numbers/${char}.png`).setOrigin(0, 0.5);
            this.digitsContainer.add(digit);
            currentX += digit.width + spacing;
        }

        // 3. Suffix (K, M, B)
        if (suffix) {
            // Suffixes are lowercase in filename (k.png, m.png, b.png)
            const s = this.scene.add.image(currentX, 0, ASSETS.UI_HUD, `numbers/${suffix}.png`).setOrigin(0, 0.5);
            this.digitsContainer.add(s);
            currentX += s.width + spacing;
        }

        // Align Left within the bar
        // We add some padding from the left edge of the bar
        // (e.g. 50px to make room for the icon on the bar)
        const leftPadding = 50;

        this.digitsContainer.x = leftPadding;
    }
}
