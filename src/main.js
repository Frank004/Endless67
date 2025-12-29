import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Leaderboard } from './scenes/Leaderboard.js';
import { Settings } from './scenes/Settings.js';
import { Playground } from './scenes/Playground.js';
import { GAME_CONFIG } from './config/GameConstants.js';
import { isMobileDevice, getResolution } from './utils/DeviceDetection.js';

// Detectar dispositivo para configuración inicial
// La detección precisa se hace en Game.js usando Phaser.Device
const isMobile = isMobileDevice();
const resolution = getResolution(isMobile, GAME_CONFIG.RESOLUTIONS);
const GAME_WIDTH = resolution.width;
const GAME_HEIGHT = resolution.height;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000',
    pixelArt: true,
    roundPixels: true,
    render: {
        pixelArt: true,
        antialias: false,
    },
    parent: 'game-container',
    scale: {
        mode: isMobile ? Phaser.Scale.FIT : Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // En móvil, permitir que se escale para llenar la pantalla manteniendo aspect ratio
        min: {
            width: GAME_WIDTH,
            height: GAME_HEIGHT
        },
        max: {
            width: GAME_WIDTH,
            height: GAME_HEIGHT
        }
    },
    input: { activePointers: 3 },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [Boot, MainMenu, Game, Leaderboard, Settings, Playground]
};

const game = new Phaser.Game(config);
