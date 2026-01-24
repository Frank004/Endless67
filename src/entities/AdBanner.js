export class AdBanner extends Phaser.GameObjects.Container {
    constructor(scene) {
        const width = scene.scale.width;
        const height = 50;
        const x = 0;
        const y = 0; // Posición arriba (top)

        super(scene, x, y);

        // Background
        this.bg = scene.add.rectangle(0, 0, width, height, 0x1a1a1a)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x333333);

        // Text
        this.text = scene.add.text(width / 2, height / 2, 'AD GOES HERE', {
            fontFamily: 'Verdana, sans-serif',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        this.add([this.bg, this.text]);

        // Fixed rendering at the top
        this.setScrollFactor(0);
        this.setDepth(10000);

        scene.add.existing(this);
    }
}
