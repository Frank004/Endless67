import { BaseWallDecoration } from './BaseWallDecoration.js';
import { getLightEmitterConfig } from '../../../config/LightEmitterConfig.js';
import { LightEmitterComponent } from './LightEmitterComponent.js';

export class LampDecoration extends BaseWallDecoration {
    constructor(scene, config, x, y, side, frame, tint = 0xffffff) {
        super(scene, config, x, y, side);
        this.frame = frame;
        this.tint = tint;

        // Component references
        this.lampSprite = null;
        this.lightEmitter = null;

        this.createVisuals();
    }

    createVisuals() {
        const container = this.scene.add.container(this.x, this.y);
        container.setDepth(this.config.depth);
        this.visualObject = container;

        const lightEmitterConfig = getLightEmitterConfig(
            this.config.lightEmitterPreset,
            this.config.lightEmitterOverrides
        );
        this.lightEmitter = new LightEmitterComponent(this.scene, lightEmitterConfig);
        this.lightEmitter.create(container, this.side, { x: 0, y: 0 });

        // C. Lamp Sprite
        this.lampSprite = this.scene.add.image(0, 0, this.config.atlas, this.frame);
        this.lampSprite.setTint(this.tint);
        if (this.side === 'left') {
            this.lampSprite.setOrigin(0, 0.5);
            this.lampSprite.setFlipX(true);
        } else {
            this.lampSprite.setOrigin(1, 0.5);
            this.lampSprite.setFlipX(false);
        }
        container.add(this.lampSprite);

        // Ensure the lamp sprite is on top of the glows and particles
        container.bringToTop(this.lampSprite);
    }

    reset(config, x, y, side, frame, tint = 0xffffff) {
        super.reset(config, x, y, side);
        this.frame = frame;
        this.tint = tint;
        this.interactableId = null; // Reset interactable ID

        const container = this.visualObject;
        container.setPosition(x, y);
        container.setVisible(true);
        container.setActive(true);
        container.setDepth(config.depth);
        container.setAlpha(config.alpha !== undefined ? config.alpha : 1);
        container.setScale(config.scale !== undefined ? config.scale : 1);

        // Update Sprite
        this.lampSprite.setTexture(config.atlas, frame);
        this.lampSprite.setTint(tint);
        if (side === 'left') {
            this.lampSprite.setOrigin(0, 0.5);
            this.lampSprite.setFlipX(true);
        } else {
            this.lampSprite.setOrigin(1, 0.5);
            this.lampSprite.setFlipX(false);
        }

        const lightEmitterConfig = getLightEmitterConfig(
            this.config.lightEmitterPreset,
            this.config.lightEmitterOverrides
        );
        if (this.lightEmitter) {
            this.lightEmitter.setConfig(lightEmitterConfig);
            this.lightEmitter.setSide(side, { x: 0, y: 0 });
            this.lightEmitter.start();
        }

        // Ensure the lamp sprite is on top
        container.bringToTop(this.lampSprite);
    }

    deactivate() {
        super.deactivate();
        if (this.lightEmitter) this.lightEmitter.stop();
    }

    destroy() {
        if (this.lightEmitter) this.lightEmitter.destroy();
        super.destroy();
    }
}
