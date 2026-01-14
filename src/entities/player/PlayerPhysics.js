
import { PLAYER_CONFIG } from '../../config/PlayerConfig.js';
import { ASSETS } from '../../config/AssetKeys.js';

export class PlayerPhysics {
    /**
     * @param {Phaser.GameObjects.Sprite} player - The player game object
     */
    constructor(player) {
        this.player = player;
        this.scene = player.scene;
    }

    init() {
        const player = this.player;
        const scene = this.scene;

        // Configuración física
        // player.body.setGravityY(PLAYER_CONFIG.GRAVITY_Y); // Removing double gravity (World + Local)
        player.body.setBounce(0);

        const hasAtlas = scene.textures.exists(ASSETS.PLAYER);

        // Body Size tuning
        if (hasAtlas) {
            const spriteWidth = player.displayWidth || 32;
            const spriteHeight = player.displayHeight || 32;

            const bodyWidth = PLAYER_CONFIG.BODY.WIDTH;
            const bodyHeight = Math.max(PLAYER_CONFIG.BODY.MIN_HEIGHT, spriteHeight - PLAYER_CONFIG.BODY.OFFSET_Y_MARGIN);

            player.body.setSize(bodyWidth, bodyHeight);

            // Centering offset
            const offsetX = (spriteWidth - bodyWidth) / 2;
            const offsetY = spriteHeight - bodyHeight;
            player.body.setOffset(offsetX, offsetY);
        } else {
            // Placeholder logic
            player.body.setSize(32, 48);
        }

        player.body.setDragX(PLAYER_CONFIG.DRAG_X);
        player.body.setMaxVelocity(PLAYER_CONFIG.MAX_VELOCITY.X, PLAYER_CONFIG.MAX_VELOCITY.Y);
    }

    jump(velocityY) {
        this.player.body.setVelocityY(velocityY);
    }

    stop() {
        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);
    }
}
