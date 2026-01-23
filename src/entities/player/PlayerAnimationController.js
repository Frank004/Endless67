import { ANIM_MANIFEST } from './animationManifest.js';

/**
 * Encapsula la lógica de reproducir animaciones sin reiniciar si ya están corriendo.
 * Es no-op seguro cuando las animaciones no existen (placeholder).
 */
export class PlayerAnimationController {
    constructor(sprite) {
        this.sprite = sprite;
        this.currentKey = null;
    }

    setFacing(dir) {
        if (!this.sprite) return;
        if (dir < 0) this.sprite.setFlipX(true);
        else if (dir > 0) this.sprite.setFlipX(false);
    }

    play(key) {
        if (!this.sprite || !this.sprite.anims) return;
        if (!key) return;

        // Check if the SAME animation is already playing (use sprite's actual state, not tracked state)
        const currentlyPlaying = this.sprite.anims.currentAnim?.key;
        if (currentlyPlaying === key && this.sprite.anims.isPlaying) return;

        if (!this.sprite.anims.animationManager.exists(key)) {
            return;
        }

        this.currentKey = key;
        this.sprite.anims.play(key, true);
    }

    playOnceThen(key, nextKey) {
        if (!this.sprite || !this.sprite.anims) return;
        if (!key) return;
        const anims = this.sprite.anims;
        const manager = anims.animationManager;
        if (!manager.exists(key)) return;
        // No espejar powerup (contiene números)
        if (key === ANIM_MANIFEST.POWERUP) {
            this.sprite.setFlipX(false);
        }
        this.currentKey = key;
        this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this._onComplete);
        this._onComplete = (anim) => {
            if (anim.key !== key) return;
            this.currentKey = null;
            if (nextKey && manager.exists(nextKey)) {
                this.play(nextKey);
            }
        };
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this._onComplete);
        anims.play(key, true);
    }

    /**
     * Reproduce una animación sin loop y se queda en su último frame (o uno custom).
     */
    playOnceHoldLast(key, holdFrameName = null) {
        if (!this.sprite || !this.sprite.anims) return;
        if (!key) return;
        const anims = this.sprite.anims;
        const manager = anims.animationManager;
        if (!manager.exists(key)) return;
        this.currentKey = key;
        this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this._onCompleteHold);
        this._onCompleteHold = (anim) => {
            if (anim.key !== key) return;
            this.currentKey = null;
            const animObj = manager.get(key);
            const lastFrame = animObj?.getLastFrame() || animObj?.frames?.[animObj.frames.length - 1];
            const frameToHold = (holdFrameName && this.sprite.texture.has(holdFrameName))
                ? holdFrameName
                : lastFrame?.frame?.name;
            if (frameToHold) {
                this.sprite.anims.stop();
                this.sprite.setFrame(frameToHold);
            }
        };
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this._onCompleteHold);
        anims.play(key);
    }

    /**
        * Devuelve el key de anim según estado + estilo
        */
    resolve(state, subStyle = null) {
        switch (state) {
            case 'GROUND':
                if (subStyle === 'run') return ANIM_MANIFEST.GROUND.run;
                if (subStyle === 'run_stop') return ANIM_MANIFEST.GROUND.runStop;
                return ANIM_MANIFEST.GROUND.idle;
            case 'AIR_RISE':
                if (subStyle === 'wall') return ANIM_MANIFEST.AIR_RISE.wall;
                if (subStyle === 'side') return ANIM_MANIFEST.AIR_RISE.side;
                if (subStyle === 'double') return ANIM_MANIFEST.AIR_RISE.double;
                return ANIM_MANIFEST.AIR_RISE.up;
            case 'AIR_FALL':
                if (subStyle === 'start') return ANIM_MANIFEST.AIR_FALL.start;
                if (subStyle === 'loop') return ANIM_MANIFEST.AIR_FALL.loop;
                return ANIM_MANIFEST.AIR_FALL.loop; // Fallback
            case 'WALL_SLIDE':
                if (subStyle === 'start') return ANIM_MANIFEST.WALL_SLIDE.start;
                if (subStyle === 'loop') return ANIM_MANIFEST.WALL_SLIDE.loop;
                return ANIM_MANIFEST.WALL_SLIDE.loop;
            case 'POWERUP_CUTSCENE':
                return ANIM_MANIFEST.POWERUP;
            case 'HIT':
                return ANIM_MANIFEST.HIT;
            case 'GOAL':
                return ANIM_MANIFEST.GOAL;
            default:
                return null;
        }
    }
}
