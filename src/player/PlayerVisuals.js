
import { ASSETS } from '../config/AssetKeys.js';
import { REGISTRY_KEYS } from '../config/RegistryKeys.js';
import { PLAYER_CONFIG } from '../config/PlayerConfig.js';

export class PlayerVisuals {
    /**
     * @param {Phaser.GameObjects.Sprite} player - The player game object
     */
    constructor(player) {
        this.player = player;
        this.scene = player.scene;
    }

    init() {
        const scene = this.scene;
        const player = this.player;

        const hasAtlas = scene.textures.exists(ASSETS.PLAYER);
        const usePNG = scene.registry.get(REGISTRY_KEYS.USE_PLAYER_PNG);
        const hasPNG = scene.textures.exists('player_png');

        if (hasAtlas && !usePNG) {
            player.setTexture(ASSETS.PLAYER);
            const frameName = 'IDLE 1.png';
            if (scene.textures.get(ASSETS.PLAYER).has(frameName)) {
                player.setFrame(frameName);
            } else {
                console.warn(`[PlayerVisuals] Frame ${frameName} not found in atlas!`);
            }
        } else if (hasPNG || usePNG) {
            player.setTexture(hasPNG ? 'player_png' : 'player_placeholder');
        } else {
            this._createPlaceholder();
        }
    }

    setFlipX(flipped) {
        this.player.setFlipX(flipped);
    }

    setInvincibilityVisuals(isInvincible) {
        if (isInvincible) {
            this.player.setTint(0xffff00);
            this.scene.tweens.add({
                targets: this.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: -1,
                key: 'invincibility_tween'
            });
        } else {
            this.player.clearTint();
            this.player.alpha = 1;
            const tween = this.scene.tweens.getTweensOf(this.player).find(t => t.data && t.data[0].key === 'invincibility_tween');
            if (tween) tween.stop();
        }
    }

    _createPlaceholder() {
        const scene = this.scene;
        if (!scene.textures.exists('player_placeholder')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x00ff00, 1.0);
            graphics.fillRect(0, 0, 32, 48);
            graphics.generateTexture('player_placeholder', 32, 48);
            graphics.destroy();
        }
        this.player.setTexture('player_placeholder');
    }
}
