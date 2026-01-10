import { WALL_DECOR_CONFIG, getRandomLightboxFrame, getWallInsetX } from '../../config/WallDecorConfig.js';

/**
 * WallDecorManager.js
 * 
 * Gestiona la generación y limpieza de decoraciones de pared (lightboxes, señales, etc.)
 * 
 * Principios:
 * - Single Responsibility: Solo maneja decoraciones de pared
 * - DRY: Usa configuración centralizada
 * - Separation of Concerns: No maneja slots ni plataformas
 */

export class WallDecorManager {
    constructor(scene) {
        this.scene = scene;
        this.decorations = []; // Array de todas las decoraciones activas
        this.gameWidth = scene.game.config.width;
    }

    /**
     * Genera decoraciones de pared para un slot
     * @param {number} slotY - Posición Y del slot
     * @param {number} slotHeight - Altura del slot
     */
    generateForSlot(slotY, slotHeight) {
        // Verificar probabilidad de spawn
        if (Math.random() > WALL_DECOR_CONFIG.spawnChance) {
            return; // No generar decoraciones en este slot
        }

        // Determinar cantidad de decoraciones
        const { min, max } = WALL_DECOR_CONFIG.perSlot;
        const count = Phaser.Math.Between(min, max);

        // Generar decoraciones
        for (let i = 0; i < count; i++) {
            this.spawnDecoration(slotY, slotHeight, i, count);
        }
    }

    /**
     * Genera una decoración individual
     * @param {number} slotY - Posición Y del slot
     * @param {number} slotHeight - Altura del slot
     * @param {number} index - Índice de la decoración en el slot
     * @param {number} total - Total de decoraciones en el slot
     */
    spawnDecoration(slotY, slotHeight, index, total) {
        // Determinar lado (left o right)
        let side;
        if (total === 1) {
            // Solo 1 decoración: elegir lado aleatoriamente
            side = Math.random() < WALL_DECOR_CONFIG.wallDistribution.left ? 'left' : 'right';
        } else {
            // Múltiples decoraciones: alternar lados
            side = index % 2 === 0 ? 'left' : 'right';
        }

        // Calcular posición Y dentro del slot
        const minGap = WALL_DECOR_CONFIG.minVerticalGap;
        const usableHeight = slotHeight - (minGap * (total - 1));
        const segmentHeight = usableHeight / total;

        // Posición Y con algo de variación aleatoria
        const baseY = slotY + (index * (segmentHeight + minGap)) + (segmentHeight / 2);
        const randomOffset = Phaser.Math.Between(-30, 30); // Variación de ±30px
        const y = baseY + randomOffset;

        // Calcular posición X en el wall inset
        const x = getWallInsetX(side, this.gameWidth);

        // Seleccionar frame aleatorio
        const frame = getRandomLightboxFrame(side);

        // Crear sprite
        const decor = this.scene.add.image(x, y, WALL_DECOR_CONFIG.types.LIGHTBOX.atlas, frame);

        // Configurar propiedades
        decor.setDepth(WALL_DECOR_CONFIG.depth.base);
        decor.setAlpha(WALL_DECOR_CONFIG.types.LIGHTBOX.alpha);
        decor.setScale(WALL_DECOR_CONFIG.types.LIGHTBOX.scale);

        // Ajustar origin según el lado
        if (side === 'left') {
            decor.setOrigin(0, 0.5); // Origen a la izquierda, centrado verticalmente
        } else {
            decor.setOrigin(1, 0.5); // Origen a la derecha, centrado verticalmente
        }

        // Guardar referencia
        this.decorations.push({
            sprite: decor,
            y: y,
            side: side
        });
    }

    /**
     * Limpia decoraciones que están muy por debajo del jugador
     * @param {number} playerY - Posición Y del jugador
     * @param {number} cleanupDistance - Distancia de limpieza (default: 1800)
     */
    cleanup(playerY, cleanupDistance = 1800) {
        // Filtrar decoraciones que están muy abajo
        this.decorations = this.decorations.filter(decor => {
            if (decor.y > playerY + cleanupDistance) {
                // Destruir sprite
                decor.sprite.destroy();
                return false; // Remover del array
            }
            return true; // Mantener en el array
        });
    }

    /**
     * Destruye todas las decoraciones
     */
    destroy() {
        this.decorations.forEach(decor => {
            if (decor.sprite) {
                decor.sprite.destroy();
            }
        });
        this.decorations = [];
    }

    /**
     * Obtiene el número de decoraciones activas
     * @returns {number}
     */
    getCount() {
        return this.decorations.length;
    }
}
