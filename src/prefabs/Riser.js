import { WALLS } from '../config/GameConstants.js';

export class Riser extends Phaser.GameObjects.TileSprite {
    constructor(scene, x, y, width, height, textureKey, pipelineName = 'RiserPipeline') {
        super(scene, x, y, width, height, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0);
        this.setDepth(150); // Alto depth para estar por encima de todo excepto UI (200+)

        // Physics setup
        this.body.allowGravity = false;
        this.body.immovable = true;

        // Body adjustment
        // El body debe ser más ancho que la pantalla para cubrir completamente
        const waveOffset = 20;
        const wallWidth = WALLS.WIDTH;
        const gameWidth = scene.game.config.width;
        // Physics width: ancho completo de la pantalla (sin restar walls para que cubra todo)
        const physicsWidth = gameWidth + (waveOffset * 2);

        const bodyHeight = 10; // Thin body at top
        const bodyOffsetY = -5; // Negative offset to align with visual top

        this.body.setSize(physicsWidth, bodyHeight);
        // Offset negativo para centrar el body más ancho
        this.body.setOffset(-waveOffset, bodyOffsetY);

        // Pipeline - use the specified pipeline for this riser type
        if (scene.game.renderer.type === Phaser.WEBGL) {
            this.setPostPipeline(pipelineName);
        }
    }
}
