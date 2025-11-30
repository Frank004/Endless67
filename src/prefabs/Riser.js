import { WALLS } from '../config/GameConstants.js';

export class Riser extends Phaser.GameObjects.TileSprite {
    constructor(scene, x, y, width, height, textureKey, pipelineName = 'RiserPipeline') {
        super(scene, x, y, width, height, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0);
        this.setDepth(50);

        // Physics setup
        this.body.allowGravity = false;
        this.body.immovable = true;

        // Body adjustment
        const waveOffset = 20;
        const wallWidth = WALLS.WIDTH;
        const gameWidth = scene.game.config.width;
        const physicsWidth = gameWidth - (wallWidth * 2);

        const bodyHeight = 10; // Thin body at top
        const bodyOffsetY = -5; // Negative offset to align with visual top

        this.body.setSize(physicsWidth, bodyHeight);
        this.body.setOffset(waveOffset, bodyOffsetY);

        // Pipeline - use the specified pipeline for this riser type
        if (scene.game.renderer.type === Phaser.WEBGL) {
            this.setPostPipeline(pipelineName);
        }
    }
}
