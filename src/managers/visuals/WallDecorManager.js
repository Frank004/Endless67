import { WALL_DECOR_CONFIG, getRandomDecorationType, getRandomFrameForType, getWallInsetX } from '../../config/WallDecorConfig.js';

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
        // Verificar si estamos dentro del delay de inicio
        // slotY es negativo (sube hacia arriba), así que verificamos si está por encima del delay
        const stageFloorY = this.scene.scale.height - 32; // Floor Y position
        const distanceFromFloor = stageFloorY - slotY; // Distancia positiva hacia arriba

        if (distanceFromFloor < WALL_DECOR_CONFIG.spawnStartDelay) {
            return; // No generar decoraciones aún (muy cerca del floor)
        }

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
        // Seleccionar tipo de decoración aleatoriamente (con pesos)
        const decorType = getRandomDecorationType();

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

        // Seleccionar frame aleatorio del tipo
        const frame = getRandomFrameForType(decorType, side);

        // Crear sprite
        const decor = this.scene.add.image(x, y, decorType.atlas, frame);

        // Configurar propiedades usando el depth específico del tipo
        decor.setDepth(decorType.depth);
        decor.setAlpha(decorType.alpha);
        decor.setScale(decorType.scale);

        // Ajustar origin según el lado
        if (side === 'left') {
            decor.setOrigin(0, 0.5); // Origen a la izquierda, centrado verticalmente
        } else {
            decor.setOrigin(1, 0.5); // Origen a la derecha, centrado verticalmente
        }

        // Guardar referencia con posición inicial para parallax
        this.decorations.push({
            sprite: decor,
            y: y,
            initialY: y, // Guardar Y inicial para parallax
            side: side,
            type: decorType.name,
            depth: decorType.depth,
            parallaxFactor: this.getParallaxFactor(decorType.depth)
        });
    }

    /**
     * Calcula el factor de parallax basado en el depth
     * Más profundo (depth menor) = parallax más lento
     * @param {number} depth - Depth del objeto
     * @returns {number} Factor de parallax (0-1)
     */
    getParallaxFactor(depth) {
        // Mapear depth a factor de parallax según el layering completo:
        // depth 0 (background) -> 0.1 (casi estático)
        // depth 1 (buildings big) -> 0.2 (muy lento)
        // depth 2 (buildings small) -> 0.3 (lento)
        // depth 3 (big lightboxes) -> 0.4 (medio-lento)
        // depth 4 (regular lightboxes) -> 0.5 (medio)
        // depth 5 (cables blancos) -> 0.6 (medio-rápido)
        // depth 20+ (gameplay) -> 1.0 (sin parallax, se mueve con la cámara)

        if (depth === 0) return 0.1;  // Background - casi estático
        if (depth === 1) return 0.2;  // Buildings big - muy lento
        if (depth === 2) return 0.3;  // Buildings small - lento
        if (depth === 3) return 0.4;  // Big lightboxes - medio-lento
        if (depth === 4) return 0.5;  // Regular lightboxes - medio
        if (depth === 5) return 0.6;  // Cables blancos - medio-rápido
        if (depth === 40) return 0.6; // Cables negros - medio-rápido
        return 1.0; // Gameplay y adelante - sin parallax
    }

    /**
     * Actualiza el parallax de todas las decoraciones
     * Debe llamarse en el update loop de la escena
     * @param {number} cameraY - Posición Y de la cámara
     */
    updateParallax(cameraY) {
        // Usar la posición inicial de la cámara como referencia
        if (this.initialCameraY === undefined) {
            this.initialCameraY = cameraY;
        }

        // Calcular desplazamiento de la cámara
        const cameraDelta = cameraY - this.initialCameraY;

        // Aplicar parallax a cada decoración
        this.decorations.forEach(decor => {
            // Nueva posición Y = posición inicial + (desplazamiento de cámara * factor parallax)
            const newY = decor.initialY + (cameraDelta * decor.parallaxFactor);
            decor.sprite.y = newY;

            // Actualizar Y para cleanup (usar la posición real en pantalla)
            decor.y = newY;
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
