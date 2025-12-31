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
        if (this.currentKey === key && this.sprite.anims.isPlaying) return;
        if (!this.sprite.anims.animationManager.exists(key)) {
            // Anim no existe todavía: no-op
            return;
        }
        this.currentKey = key;
        this.sprite.anims.play(key, true);
    }

    /**
        * Devuelve el key de anim según estado + estilo
        */
    resolve(state, subStyle = null) {
        switch (state) {
            case 'GROUND':
                return subStyle === 'run' ? ANIM_MANIFEST.GROUND.run : ANIM_MANIFEST.GROUND.idle;
            case 'AIR_RISE':
                if (subStyle === 'wall') return ANIM_MANIFEST.AIR_RISE.wall;
                if (subStyle === 'side') return ANIM_MANIFEST.AIR_RISE.side;
                return ANIM_MANIFEST.AIR_RISE.up;
            case 'AIR_FALL':
                return ANIM_MANIFEST.AIR_FALL;
            case 'WALL_SLIDE':
                return ANIM_MANIFEST.WALL_SLIDE;
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
