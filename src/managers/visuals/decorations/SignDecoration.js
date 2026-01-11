import { BaseWallDecoration } from './BaseWallDecoration.js';

export class SignDecoration extends BaseWallDecoration {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} config
     * @param {number} x
     * @param {number} y
     * @param {string} side
     * @param {string} frame - El frame específico del atlas a usar
     */
    /**
     * @param {Phaser.Scene} scene
     * @param {object} config
     * @param {number} x
     * @param {number} y
     * @param {string} side
     * @param {string} frame - El frame específico del atlas a usar
     * @param {number} tint - Tinte visual
     */
    constructor(scene, config, x, y, side, frame, tint = 0xffffff) {
        super(scene, config, x, y, side);
        this.frame = frame;
        this.tint = tint;
        this.createVisuals();
    }

    createVisuals() {
        // Crear el sprite simple
        const sprite = this.scene.add.image(this.x, this.y, this.config.atlas, this.frame);

        // Configurar propiedades visuales
        sprite.setDepth(this.config.depth);
        sprite.setAlpha(this.config.alpha !== undefined ? this.config.alpha : 1);
        sprite.setScale(this.config.scale !== undefined ? this.config.scale : 1);
        sprite.setTint(this.tint);

        // Alineación según el lado
        if (this.side === 'left') {
            sprite.setOrigin(0, 0.5); // Izquierda: origen 0, centrado vertical
        } else {
            sprite.setOrigin(1, 0.5); // Derecha: origen 1, centrado vertical
        }

        this.visualObject = sprite;
    }

    reset(config, x, y, side, frame, tint = 0xffffff) {
        super.reset(config, x, y, side);
        this.frame = frame;
        this.tint = tint;

        const sprite = this.visualObject;
        sprite.setVisible(true);
        sprite.setActive(true);
        sprite.setPosition(x, y);
        sprite.setTexture(config.atlas, frame);
        sprite.setDepth(config.depth);
        sprite.setAlpha(config.alpha !== undefined ? config.alpha : 1);
        sprite.setScale(config.scale !== undefined ? config.scale : 1);
        sprite.setTint(tint);

        if (side === 'left') {
            sprite.setOrigin(0, 0.5);
        } else {
            sprite.setOrigin(1, 0.5);
        }
    }
}
