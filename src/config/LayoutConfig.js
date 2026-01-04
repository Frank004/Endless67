/**
 * LayoutConfig.js
 * 
 * Configuración centralizada del layout del juego.
 * Define dimensiones y posiciones de componentes UI y stage.
 * 
 * Principios:
 * - Single Responsibility: Solo configuración de layout
 * - DRY: Valores centralizados
 * - Separation of Concerns: Layout separado de gameplay
 */

export const LAYOUT_CONFIG = {
    // ─────────────────────────────────────────────────────────────
    // AD BANNER
    // ─────────────────────────────────────────────────────────────
    adBanner: {
        height: 50,           // Altura del banner de ads
        position: 'top',      // Posición: siempre arriba
        sticky: true,         // Sticky: siempre visible
        backgroundColor: 0x1a1a1a, // Color de fondo del ad
        textColor: '#888888', // Color del texto placeholder
        text: 'Ad Space (50px)' // Texto placeholder
    },

    // ─────────────────────────────────────────────────────────────
    // STAGE FLOOR
    // ─────────────────────────────────────────────────────────────
    stageFloor: {
        height: 32,           // Altura del piso del stage (1 tile de 32px)
        color: 0x4a4a4a,      // Color del piso
        yOffset: 0,           // Offset desde el fondo (ad ahora está arriba)
        visible: true         // Visible al inicio del juego
    },

    // ─────────────────────────────────────────────────────────────
    // GAME STAGE
    // ─────────────────────────────────────────────────────────────
    gameStage: {
        // Altura efectiva del stage (pantalla completa, ad banner está arriba)
        // Se calcula dinámicamente: window.innerHeight (ad no resta altura del stage)
        getEffectiveHeight: (screenHeight) => screenHeight,

        // Y inicial para el spawn del player (sobre el StageFloor)
        getPlayerSpawnY: (screenHeight) => {
            const floorY = screenHeight - 32; // Posición del floor (al fondo)
            return floorY - 16; // Centro del player sobre el floor (32px/2)
        },

        // Y inicial para el primer slot (160px arriba del StageFloor)
        getFirstSlotY: (screenHeight) => {
            const floorY = screenHeight - 32; // Posición del floor (al fondo)
            return floorY - 160; // 160px arriba del floor
        }
    },

    // ─────────────────────────────────────────────────────────────
    // LAVA
    // ─────────────────────────────────────────────────────────────
    lava: {
        // Y inicial de la lava (fondo de la pantalla completa)
        getInitialY: (screenHeight) => screenHeight,

        // La lava debe cubrir el StageFloor cuando sube
        // No necesita ajuste especial, solo sube desde el fondo
        coverFloor: true
    }
};

/**
 * Calcula todas las posiciones del layout basado en la altura de pantalla
 * @param {number} screenHeight - Altura de la pantalla
 * @returns {Object} Objeto con todas las posiciones calculadas
 */
export function calculateLayout(screenHeight) {
    const adHeight = LAYOUT_CONFIG.adBanner.height;
    const floorHeight = LAYOUT_CONFIG.stageFloor.height;
    // Ad banner está arriba, así que el stage usa toda la altura
    const effectiveHeight = screenHeight;

    return {
        // Ad Banner (arriba)
        adY: 0,
        adHeight: adHeight,

        // Stage Floor (al fondo, sin restar ad porque está arriba)
        floorY: screenHeight - floorHeight,
        floorHeight: floorHeight,

        // Player Spawn (sobre el floor)
        playerSpawnY: screenHeight - floorHeight - 16,

        // First Slot (160px arriba del floor)
        firstSlotY: screenHeight - floorHeight - 160,

        // Lava Initial (al fondo de la pantalla)
        lavaInitialY: screenHeight,

        // Effective Stage Height (toda la pantalla, ad está arriba)
        stageHeight: effectiveHeight
    };
}
