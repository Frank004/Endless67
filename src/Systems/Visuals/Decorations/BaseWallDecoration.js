import { ParallaxBehavior } from './ParallaxBehavior.js';

/**
 * BaseWallDecoration
 * 
 * Clase base para todas las decoraciones de pared.
 * Maneja propiedades comunes, lifecycle, y comportamiento parallax.
 */
export class BaseWallDecoration {
    /**
     * @param {Phaser.Scene} scene - La escena del juego
     * @param {object} config - Configuración de la decoración
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {string} side - Lado de la pared ('left' o 'right')
     */
    constructor(scene, config, x, y, side) {
        this.scene = scene;
        this.config = config;
        this.x = x;
        this.y = y;
        this.initialY = y;
        this.side = side;
        this.depth = config.depth;
        this.active = true;

        // El objeto visual principal (Sprite o Container)
        // Las subclases deben crear esto
        this.visualObject = null;

        // Componente de parallax (se inicializa después de crear el visualObject)
        this.parallax = null;
    }

    /**
     * Inicializa el comportamiento parallax
     * @param {number} factor - Factor de movimiento parallax
     */
    initParallax(factor, maxOffset, smoothing) {
        if (this.visualObject) {
            this.parallax = new ParallaxBehavior(this.visualObject, factor, this.y, maxOffset, smoothing);
            this.parallaxFactor = factor;
        }
    }

    /**
     * Actualiza la posición basado en la cámara
     * @param {number} cameraY - Posición Y actual de la cámara
     */
    update(cameraY) {
        if (!this.active) return;

        if (this.parallax) {
            this.y = this.parallax.update(cameraY);
        }
    }

    /**
     * Resetea la decoración para ser reusada desde el pool
     */
    reset(config, x, y, side) {
        this.config = config;
        this.x = x;
        this.y = y;
        this.initialY = y;
        this.side = side;
        this.depth = config.depth;
        this.active = true;
        this.parallaxFactor = 0;

        if (this.parallax) {
            this.parallax.destroy();
            this.parallax = null;
        }

        // Subclases deben override este método y llamar super.reset(...)
    }

    /**
     * Desactiva la decoración sin destruirla (para pooling)
     */
    deactivate() {
        this.active = false;
        if (this.visualObject) {
            this.visualObject.setVisible(false);
            this.visualObject.setActive(false);
        }
        if (this.parallax) {
            this.parallax.destroy();
            this.parallax = null;
        }
    }

    /**
     * Destruye la decoración y sus componentes
     */
    destroy() {
        this.active = false;

        if (this.parallax) {
            this.parallax.destroy();
            this.parallax = null;
        }

        if (this.visualObject) {
            this.visualObject.destroy();
            this.visualObject = null;
        }
    }

    /**
     * Devuelve la altura total de la decoración
     * @returns {number}
     */
    getHeight() {
        return this.visualObject ? this.visualObject.height : 0;
    }

    /**
     * Verifica si la decoración está fuera de los límites para limpieza
     * @param {number} limitY - Límite Y
     * @returns {boolean}
     */
    shouldCleanup(limitY) {
        // Simple check: si la posición actual es mayor al límite
        return this.y > limitY;
    }
}
