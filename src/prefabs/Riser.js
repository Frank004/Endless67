import { WALLS } from '../config/GameConstants.js';
import { RiserVisualManager } from '../managers/gameplay/RiserVisualManager.js';

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

        const bodyHeight = 20; // Larger hit area but offset downwards
        const bodyOffsetY = 15; // Positive offset: starts 15px BELOW the visual top edge

        this.body.setSize(physicsWidth, bodyHeight);
        // Offset negativo en X para centrar, offset positivo en Y para bajar la colisión
        this.body.setOffset(-waveOffset, bodyOffsetY);

        // Visual Setup (Handled by Manager)
        this.effect = RiserVisualManager.setup(scene, this, textureKey, pipelineName);
    }

    preUpdate(time, delta) {
        if (super.preUpdate) {
            super.preUpdate(time, delta);
        }

        // Update visual effect if present
        if (this.effect && this.effect.update) {
            this.effect.update(delta);
        }
    }
}
