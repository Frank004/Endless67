import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Leaderboard } from './scenes/Leaderboard.js';
import { Settings } from './scenes/Settings.js';
import { Playground } from './scenes/Playground.js';
import { GAME_CONFIG } from './config/GameConstants.js';
import { isMobileDevice, getResolution, getHiDpiScale } from './utils/DeviceDetection.js';

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
const GAME_WIDTH = baseResolution.width;
const GAME_HEIGHT = baseResolution.height;
// Usa DPR para render más nítido sin cambiar el tamaño lógico del juego
const DPR = getHiDpiScale();

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
    input: { activePointers: 3 },
    physics: { default: 'arcade', arcade: { gravity: { y: 1200 }, debug: false } },
    scene: [Boot, MainMenu, Game, Leaderboard, Settings, Playground]
};

const game = new Phaser.Game(config);
