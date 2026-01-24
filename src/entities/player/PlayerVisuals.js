
import { ASSETS } from '../../Config/AssetKeys.js';
import { PLAYER_CONFIG } from '../../Config/PlayerConfig.js';

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

        if (hasAtlas) {
            player.setTexture(ASSETS.PLAYER);

            // Robust frame lookup to handle skin folders (e.g. "IDLE/idle-01.png" vs "idle-01.png")
            const findFrame = (requestedName) => {
                const texture = scene.textures.get(ASSETS.PLAYER);
                if (texture.has(requestedName)) return requestedName;

                // Normalization: Remove folders, usage lowercase, remove separators
                const normalize = (name) => name.split('/').pop().toLowerCase().replace(/[\s\-_]/g, '');
                const reqNorm = normalize(requestedName);

                const found = texture.getFrameNames().find(fn => normalize(fn) === reqNorm);
                return found || null;
            };

            const frameName = findFrame('idle-01.png');

            if (frameName) {
                player.setFrame(frameName);
            } else {
                console.warn(`[PlayerVisuals] Frame idle-01.png not found in atlas!`);
            }
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

    update() {
        const body = this.player.body;
        if (!body) return;

        // Sprite Flipper logic (restored from legacy Player.js)
        // Flip based on velocity
        if (body.velocity.x < -10) {
            this.setFlipX(true);
        } else if (body.velocity.x > 10) {
            this.setFlipX(false);
        }

        // Also ensure correct flip during wall slides if applicable
        // The Velocity logic handles jump-off correctly:
        // Jump Right -> Vel > 0 -> Flip False (Face Right)
        // Jump Left -> Vel < 0 -> Flip True (Face Left)
    }
}
