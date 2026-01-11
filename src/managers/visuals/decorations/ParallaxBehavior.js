/**
 * ParallaxBehavior
 * 
 * Comportamiento inyectable que aplica efecto parallax a un objeto.
 * Se puede agregar a cualquier sprite, container o grupo de objetos.
 */
export class ParallaxBehavior {
    /**
     * @param {Phaser.GameObjects.GameObject} target - Objeto al que aplicar parallax
     * @param {number} factor - Factor de parallax (0-1, donde 0 es estático y 1 es sin parallax)
     * @param {number} initialY - Posición Y inicial del objeto
     */
    constructor(target, factor, initialY, maxOffset = 120, smoothing = 0.15) {
        this.target = target;
        this.factor = factor;
        this.initialY = initialY;
        this.initialCameraY = null;
        this.maxOffset = maxOffset;
        this.smoothing = smoothing;
    }

    /**
     * Actualiza la posición del objeto basado en la posición de la cámara
     * @param {number} cameraY - Posición Y actual de la cámara
     */
    update(cameraY) {
        if (!this.target) return this.initialY;

        if (this.initialCameraY === null) {
            this.initialCameraY = cameraY;
        }

        const cameraDelta = cameraY - this.initialCameraY;
        const rawOffset = cameraDelta * (this.factor - 1);
        const clampedOffset = Phaser.Math.Clamp(rawOffset, -this.maxOffset, this.maxOffset);
        const desiredY = this.initialY + clampedOffset;

        if (this.smoothing > 0 && this.smoothing < 1) {
            this.target.y = Phaser.Math.Linear(this.target.y, desiredY, this.smoothing);
        } else {
            this.target.y = desiredY;
        }

        return this.target.y;
    }

    /**
     * Resetea el comportamiento parallax
     */
    reset() {
        this.initialCameraY = null;
        if (this.target) {
            this.target.y = this.initialY;
        }
    }

    /**
     * Destruye el comportamiento (no destruye el target)
     */
    destroy() {
        this.target = null;
    }
}
