/**
 * Constants for Store Card layout and styling
 */
export const STORE_CARD_CONSTANTS = {
    // Dimensions
    WIDTH: 140,
    HEIGHT: 168, // Scaled from 160x192 (Ratio 1.2)

    // Styles
    COLORS: {
        YELLOW: '#FBCD00',
        BLACK: '#000000',
        TEXT: '#ffffff',
        DEBUG: 0x00ff00
    },

    // Fonts
    FONTS: {
        PRICE: '12px',
        LABEL: '16px',
        FAMILY: 'monospace'
    },

    // Layout positions
    LAYOUT: {
        RIGHT_ANCHOR_X: 50, // Relative to center (Reduced from 60 for padding)
        LABEL_Y: 60,        // Relative to center
        ICON_PADDING: 8,
        COIN_SCALE: 1.75
    },

    // Assets
    TEXTURES: {
        COMMON: 'cardbox common.png',
        RARE: 'cardbox-rare.png',
        EPIC: 'cardbox-epic.png',
        LEGENDARY: 'cardbox-legend.png',
        BLACKMARKET: 'cardbox-blackmarket.png',
        OWNED: 'cardbox-own.png',
        LOCK: 'lock.png'
    }
};
