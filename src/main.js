import { Boot } from './Scenes/Boot.js';
import { Preloader } from './Scenes/Preloader.js';
import { Game } from './Scenes/Game.js';
import { MainMenu } from './Scenes/MainMenu.js';
import { Leaderboard } from './Scenes/Leaderboard.js';
import { Settings } from './Scenes/Settings.js';
import { Playground } from './Scenes/Playground.js';
import { Store } from './Scenes/Store.js';
import { GAME_CONFIG, UI } from './Config/GameConstants.js';
import { isMobileDevice, getResolution, getHiDpiScale } from './Utils/DeviceDetection.js';

// ─────────────────────────────────────────────────────────────
// Disable verbose logs in production build
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    // Allow re-enabling logs via query (?logs=1) or localStorage flag (enableLogs=1)
    const searchParams = new URLSearchParams(window.location.search || '');
    const forceLogs = searchParams.get('logs') === '1' || window.localStorage?.getItem('enableLogs') === '1';
    const disableLogs = !forceLogs;
    if (disableLogs && window.console) {
        const noop = () => { };
        window.console.log = noop;
        window.console.info = noop;
        window.console.debug = noop;
    }
}

// Detectar dispositivo para configuración inicial
// La detección precisa se hace en Game.js usando Phaser.Device
const isMobile = isMobileDevice();
const baseResolution = getResolution(isMobile, GAME_CONFIG.RESOLUTIONS);
let GAME_WIDTH = baseResolution.width;
let GAME_HEIGHT = baseResolution.height;

// FIX: Dynamic Height for Mobile to avoid letterboxing (black bars)
// iPhone 14+ and modern Androids are taller than 16:9. We extend the height to fit.
if (isMobile && typeof window !== 'undefined') {
    // Use window.inner dimensions (more reliable than body.client in webviews)
    const visibleHeight = window.innerHeight;
    const visibleWidth = window.innerWidth;
    const windowRatio = visibleHeight / visibleWidth;
    const targetHeight = Math.ceil(GAME_WIDTH * windowRatio);
    // Only extend if taller than base (avoid squashing on weird small screens)
    if (targetHeight > GAME_HEIGHT) {
        GAME_HEIGHT = targetHeight;
        console.log(`[Main] Adjusted Mobile Height to ${GAME_HEIGHT} (Ratio: ${windowRatio.toFixed(2)})`);
    }
}
// Usa DPR para render más nítido sin cambiar el tamaño lógico del juego
const DPR = getHiDpiScale();

if (typeof document !== 'undefined') {
    const rootStyle = document.documentElement?.style;
    if (rootStyle) {
        rootStyle.setProperty('--loader-logo-top', `${UI.LOGO.LOADER_TOP_PERCENT}%`);
        rootStyle.setProperty('--loader-logo-offset', `${UI.LOGO.LOADER_OFFSET_PX}px`);
        rootStyle.setProperty('--loader-logo-width', `${UI.LOGO.HTML_WIDTH_VW}vw`);
        rootStyle.setProperty('--loader-logo-max-width', `${UI.LOGO.HTML_MAX_WIDTH_PX}px`);
    }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000',
    pixelArt: true,
    antialias: false, // Force disable antialias
    roundPixels: false,
    resolution: DPR, // HiDPI render; el tamaño lógico se mantiene en GAME_WIDTH/GAME_HEIGHT
    render: {
        pixelArt: true,
        antialias: false,
    },
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },
    input: {
        activePointers: 3,
        gamepad: true  // Enable gamepad plugin
    },
    physics: { default: 'arcade', arcade: { gravity: { y: 1200 }, debug: false } },
    scene: [Boot, Preloader, MainMenu, Game, Leaderboard, Settings, Playground, Store]
};

// Defer Game Initialization to ensure DOM/Viewport is stable (fixes layout glitches)
// 50ms delay helps mobile webviews settle their safe-areas/nav-bars
window.addEventListener('load', () => {
    setTimeout(() => {
        // Start Game with pre-calculated dimensions
        new Phaser.Game(config);
    }, 50);
});
