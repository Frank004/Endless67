import { PipeDecoration } from './PipeDecoration.js';
import { SignDecoration } from './SignDecoration.js';
import { LampDecoration } from './LampDecoration.js';

/**
 * WallDecorFactory
 * 
 * Gestiona la creación y pooling de decoraciones de pared.
 */
export class WallDecorFactory {
    static pools = {
        PIPE: [],
        SIGN: [],
        LAMP: []
    };

    /**
     * Obtiene una PipeDecoration del pool o crea una nueva.
     * @returns {PipeDecoration}
     */
    static getPipe(scene, config, x, y, side, pattern, tint = 0xffffff) {
        const pool = this.pools.PIPE;
        if (pool.length > 0) {
            const decoration = pool.pop();
            // Validar que la decoración pertenezca a la escena actual
            if (decoration.scene !== scene) {
                // Decoración de una escena anterior destruida, intentar con la siguiente
                return this.getPipe(scene, config, x, y, side, pattern, tint);
            }
            decoration.reset(config, x, y, side, pattern, tint);
            return decoration;
        }
        return new PipeDecoration(scene, config, x, y, side, pattern, tint);
    }

    /**
     * Obtiene una SignDecoration del pool o crea una nueva.
     * @returns {SignDecoration}
     */
    static getSign(scene, config, x, y, side, frame, tint = 0xffffff) {
        const pool = this.pools.SIGN;
        if (pool.length > 0) {
            const decoration = pool.pop();
            if (decoration.scene !== scene) {
                return this.getSign(scene, config, x, y, side, frame, tint);
            }
            decoration.reset(config, x, y, side, frame, tint);
            return decoration;
        }
        return new SignDecoration(scene, config, x, y, side, frame, tint);
    }

    /**
     * Obtiene una LampDecoration del pool o crea una nueva.
     * @returns {LampDecoration}
     */
    static getLamp(scene, config, x, y, side, frame, tint = 0xffffff) {
        const pool = this.pools.LAMP;
        if (pool.length > 0) {
            const decoration = pool.pop();
            if (decoration.scene !== scene) {
                return this.getLamp(scene, config, x, y, side, frame, tint);
            }
            decoration.reset(config, x, y, side, frame, tint);
            return decoration;
        }
        return new LampDecoration(scene, config, x, y, side, frame, tint);
    }

    /**
     * Devuelve una decoración al pool.
     * @param {BaseWallDecoration} decoration 
     */
    static release(decoration) {
        if (!decoration) return;

        decoration.deactivate();

        if (decoration instanceof PipeDecoration) {
            this.pools.PIPE.push(decoration);
        } else if (decoration instanceof SignDecoration) {
            this.pools.SIGN.push(decoration);
        } else if (decoration instanceof LampDecoration) {
            this.pools.LAMP.push(decoration);
        } else {
            // Si es un tipo desconocido, destruir
            decoration.destroy();
        }
    }

    /**
     * Limpia todos los objetos en los pools (llamar al destruir o salir de escena).
     */
    static clearPools() {
        this.pools.PIPE.forEach(d => d.destroy());
        this.pools.SIGN.forEach(d => d.destroy());
        this.pools.LAMP.forEach(d => d.destroy());
        this.pools.PIPE = [];
        this.pools.SIGN = [];
        this.pools.LAMP = [];
    }
}
