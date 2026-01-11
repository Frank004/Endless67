/**
 * DecorRules.js
 * 
 * Reglas centralizadas para la colocación de decoraciones de pared.
 */

export const DecorRules = {

    /**
     * Verifica si una decoración del mismo tipo está demasiado cerca.
     * @param {number} y - Posición Y propuesta
     * @param {string} type - Tipo de decoración
     * @param {Array} existingDecorations - Array de decoraciones existentes en el slot/activo
     * @param {number} minDistance - Distancia mínima requerida
     * @returns {boolean} - True si está demasiado cerca (violación), False si es válido
     */
    isTooCloseToSameType(y, type, existingDecorations, minDistance) {
        for (const decor of existingDecorations) {
            // Asumimos que decor tiene propiedades { y, type }
            // Esto soporta tanto el objeto decorData antiguo como las nuevas instancias de BaseWallDecoration
            const decorType = decor.type || (decor.config ? decor.config.name : null);

            if (decorType === type) {
                const distance = Math.abs(y - decor.y);
                if (distance < minDistance) {
                    return true; // Demasiado cerca
                }
            }
        }
        return false;
    },

    /**
     * Verifica solapamiento vertical entre rangos.
     * Útil para objetos largos como Pipes.
     * @param {number} y - Posición Y inicial
     * @param {number} height - Altura del objeto
     * @param {string} side - Lado de la pared ('left' o 'right')
     * @param {string} type - Tipo (para filtrar contra qué comparar, usualmente 'PIPE')
     * @param {Array} existingDecorations - Array de decoraciones
     * @param {number} margin - Margen extra de seguridad
     * @returns {boolean} - True si hay solapamiento
     */
    checkVerticalOverlap(y, height, side, type, existingDecorations, margin = 0) {
        // Rango propuesto: [start, end]
        const proposedStart = y - margin;
        const proposedEnd = y + height + margin;

        for (const decor of existingDecorations) {
            // Verificar lado y tipo
            const decorSide = decor.side;
            const decorType = decor.type || (decor.config ? decor.config.name : null);

            if (decorSide === side && decorType === type) {
                // Obtener rango del existente
                const existingY = decor.y;
                let existingHeight = 0;

                // Soporte para decorData o instancias de clase
                if (typeof decor.getHeight === 'function') {
                    existingHeight = decor.getHeight();
                } else {
                    existingHeight = decor.height || 0;
                }

                const existingStart = existingY;
                const existingEnd = existingY + existingHeight;

                // Verificar intersección
                if (proposedStart < existingEnd && proposedEnd > existingStart) {
                    return true; // Solapamiento
                }
            }
        }
        return false;
    },

    /**
     * Verifica si se ha alcanzado la altura suficiente para spawnear.
     * @param {number} currentHeight - Altura/distancia actual
     * @param {number} minHeight - Altura mínima requerida
     * @returns {boolean} - True si es seguro spawnear
     */
    hasEnoughHeight(currentHeight, minHeight) {
        return currentHeight >= minHeight;
    }
};
