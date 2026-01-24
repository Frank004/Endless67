import { BaseWallDecoration } from './BaseWallDecoration.js';

export class PipeDecoration extends BaseWallDecoration {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} config
     * @param {number} x
     * @param {number} y
     * @param {string} side
     * @param {object} pattern - El objeto patrón { midCount, height }
     */
    /**
     * @param {Phaser.Scene} scene
     * @param {object} config
     * @param {number} x
     * @param {number} y
     * @param {string} side
     * @param {object} pattern - El objeto patrón { midCount, height }
     * @param {number} tint - Tinte visual
     */
    constructor(scene, config, x, y, side, pattern, tint = 0xffffff) {
        super(scene, config, x, y, side);
        this.pattern = pattern;
        this.tint = tint;
        this.createVisuals();
    }

    createVisuals() {
        const { midCount } = this.pattern;
        const sprites = this.config.sprites; // { top, mid, bottom } defined in config
        const atlas = this.config.atlas;

        // Container logic
        // El container agrupa los segmentos para moverse juntos
        const pipeSprites = [];
        let relativeY = 0;

        // 1. Top Segment
        // Alineado a la derecha (Origin 1,0) en x=0
        const topSprite = this.scene.add.image(0, relativeY, atlas, sprites.top);
        topSprite.setOrigin(1, 0);
        topSprite.setTint(this.tint);
        pipeSprites.push(topSprite);
        relativeY += 32; // Configurado fix a 32px por ahora

        // 2. Mid Segments
        // Alineado a la izquierda (Origin 0,0) en x=-30 (Ajustado para eliminar offset de 2px)
        // Esto ocupa el espacio visual [-30, ...]
        for (let i = 0; i < midCount; i++) {
            const midSprite = this.scene.add.image(-30, relativeY, atlas, sprites.mid);
            midSprite.setOrigin(0, 0);
            midSprite.setTint(this.tint);
            pipeSprites.push(midSprite);
            relativeY += 32;
        }

        // 3. Bottom Segment
        // Alineado a la derecha (Origin 1,0) en x=0
        const bottomSprite = this.scene.add.image(0, relativeY, atlas, sprites.bottom);
        bottomSprite.setOrigin(1, 0);
        bottomSprite.setTint(this.tint);
        pipeSprites.push(bottomSprite);
        relativeY += 32; // Total height se acumula

        // Crear container en la posición del mundo (this.x, this.y)
        const container = this.scene.add.container(this.x, this.y, pipeSprites);

        // Propiedades del Container
        container.setDepth(this.config.depth);
        if (this.config.alpha !== undefined) container.setAlpha(this.config.alpha);

        // Mirroring y Escala
        // La pared derecha es la base (scale positivo).
        // La pared izquierda requiere mirror (scale X negativo).
        const baseScale = this.config.scale !== undefined ? this.config.scale : 1.0;

        if (this.side === 'left') {
            container.setScale(-baseScale, baseScale);
        } else {
            container.setScale(baseScale);
        }

        this.visualObject = container;

        // Guardar altura real calculada (o usar la del patrón)
        this.height = relativeY; // Debe coincidir con pattern.height
    }

    /**
     * Override getHeight para devolver la altura calculada o del patrón
     */
    getHeight() {
        return this.height || this.pattern.height;
    }

    reset(config, x, y, side, pattern, tint = 0xffffff) {
        super.reset(config, x, y, side);
        this.pattern = pattern;
        this.tint = tint;

        // Limpiar visuales anteriores
        // (Optimización futura: reusar children si el pattern es idéntico)
        if (this.visualObject) {
            this.visualObject.destroy();
            this.visualObject = null;
        }

        this.createVisuals();
    }
}
