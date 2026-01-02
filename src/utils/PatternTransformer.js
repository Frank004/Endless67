/**
 * PatternTransformer.js
 * 
 * Utilidad para transformar patrones de plataformas.
 * Aplica transformaciones de espejo horizontal, vertical y ambos.
 * 
 * Principios:
 * - Single Responsibility: Solo transformaciones geométricas
 * - Pure Functions: Sin efectos secundarios
 * - Immutable: No modifica el patrón original
 */

import { SLOT_CONFIG, getPlatformBounds } from '../config/SlotConfig.js';

export class PatternTransformer {
    constructor(gameWidth = null) {
        // Usar gameWidth dinámico si se proporciona, sino usar el valor por defecto
        this.gameWidth = gameWidth || SLOT_CONFIG.gameWidth;
        this.wallWidth = SLOT_CONFIG.wallWidth;
        this.centerX = this.gameWidth / 2;
        this.platformWidth = SLOT_CONFIG.platformWidth;
    }
    
    /**
     * Actualiza el gameWidth dinámicamente (útil cuando cambia el tamaño del juego)
     * @param {number} gameWidth - Nuevo ancho del juego
     */
    setGameWidth(gameWidth) {
        if (!gameWidth || gameWidth === this.gameWidth) return;
        this.gameWidth = gameWidth;
        this.centerX = gameWidth / 2;
    }

    /**
     * Aplica transformación a un patrón
     * @param {Array} platforms - Array de {x, y}
     * @param {string} transform - 'none', 'mirrorX', 'mirrorY', 'mirrorXY'
     * @returns {Array} Patrón transformado (nuevo array)
     */
    transform(platforms, transform = 'none') {
        switch (transform) {
            case 'mirrorX':
                return this.mirrorHorizontal(platforms);
            case 'mirrorY':
                return this.mirrorVertical(platforms);
            case 'mirrorXY':
                return this.mirrorBoth(platforms);
            case 'none':
            default:
                return [...platforms]; // Copia del array
        }
    }

    /**
     * Espejo horizontal (flip izquierda ↔ derecha)
     * @param {Array} platforms - Array de plataformas
     * @returns {Array} Plataformas con X invertido
     */
    mirrorHorizontal(platforms) {
        return platforms.map(plat => ({
            x: this.gameWidth - plat.x,  // Invertir X respecto al ancho del juego
            y: plat.y                     // Y se mantiene igual
        }));
    }

    /**
     * Espejo vertical (flip arriba ↔ abajo)
     * @param {Array} platforms - Array de plataformas
     * @returns {Array} Plataformas con Y invertido y orden reverso
     */
    mirrorVertical(platforms) {
        // Encontrar Y mínimo y máximo del patrón
        const yValues = platforms.map(p => p.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const centerY = (minY + maxY) / 2;

        // Invertir Y respecto al centro del patrón
        const mirrored = platforms.map(plat => ({
            x: plat.x,
            y: centerY - (plat.y - centerY)
        }));

        // Invertir orden para mantener secuencia lógica (de arriba hacia abajo)
        return mirrored.reverse();
    }

    /**
     * Espejo en ambos ejes (flip horizontal + vertical)
     * @param {Array} platforms - Array de plataformas
     * @returns {Array} Plataformas con X e Y invertidos
     */
    mirrorBoth(platforms) {
        const mirroredX = this.mirrorHorizontal(platforms);
        return this.mirrorVertical(mirroredX);
    }

    /**
     * Aplica transformación aleatoria basada en pesos
     * @param {Array} platforms - Patrón original
     * @param {Object} weights - Pesos de probabilidad {none, mirrorX, mirrorY, mirrorXY}
     * @returns {Object} { platforms: Array, transform: string }
     */
    randomTransform(platforms, weights = null) {
        const defaultWeights = {
            none: 0.4,      // 40%
            mirrorX: 0.3,   // 30%
            mirrorY: 0.15,  // 15%
            mirrorXY: 0.15  // 15%
        };

        const w = weights || defaultWeights;
        const transform = this.weightedRandom([
            { value: 'none', weight: w.none },
            { value: 'mirrorX', weight: w.mirrorX },
            { value: 'mirrorY', weight: w.mirrorY },
            { value: 'mirrorXY', weight: w.mirrorXY }
        ]);

        return {
            platforms: this.transform(platforms, transform),
            transform: transform
        };
    }

    /**
     * Selección aleatoria ponderada
     * @param {Array} options - Array de {value, weight}
     * @returns {*} Valor seleccionado
     */
    weightedRandom(options) {
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;

        for (const option of options) {
            random -= option.weight;
            if (random <= 0) {
                return option.value;
            }
        }

        return options[0].value; // Fallback
    }

    /**
     * Valida que todas las plataformas estén dentro de los límites del juego
     * @param {Array} platforms - Array de plataformas
     * @returns {boolean} true si todas están dentro de límites
     */
    validate(platforms) {
        const bounds = getPlatformBounds(this.gameWidth);
        
        return platforms.every(plat => {
            const isValid = plat.x >= bounds.minX && plat.x <= bounds.maxX;
            if (!isValid) {
                console.warn(`⚠️ Plataforma fuera de límites: x=${plat.x} (min=${bounds.minX}, max=${bounds.maxX})`);
            }
            return isValid;
        });
    }

    /**
     * Ajusta plataformas que estén fuera de límites (clamp)
     * @param {Array} platforms - Array de plataformas
     * @returns {Array} Plataformas ajustadas
     */
    clampToBounds(platforms) {
        const bounds = getPlatformBounds(this.gameWidth);
        
        return platforms.map(plat => {
            const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, plat.x));
            return {
                x: clampedX,
                y: plat.y
            };
        });
    }
}
