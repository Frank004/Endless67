import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Leaderboard } from './scenes/Leaderboard.js';
import { Settings } from './scenes/Settings.js';
import { Playground } from './scenes/Playground.js';

// Mobile-first: Detectar dispositivo para configuración inicial
// Nota: Phaser.Device se inicializa cuando se carga Phaser, pero para la configuración
// inicial usamos detección básica. La detección precisa se hace en Game.js usando
// this.sys.game.device.os.* que está disponible después de crear el juego.
const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

// Resoluciones estándar:
// - Desktop: 400x600 (mantiene compatibilidad con diseño actual)
// - Mobile: 360x640 (estándar común para móviles Android/iOS portrait 9:16)
const GAME_WIDTH = isMobile ? 360 : 400;
const GAME_HEIGHT = isMobile ? 640 : 600;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: isMobile ? Phaser.Scale.FIT : Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // En móvil, permitir que se escale para llenar la pantalla manteniendo aspect ratio
        min: {
            width: isMobile ? 360 : 400,
            height: isMobile ? 640 : 600
        },
        max: {
            width: isMobile ? 360 : 400,
            height: isMobile ? 640 : 600
        }
    },
    input: { activePointers: 3 },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [Boot, MainMenu, Game, Leaderboard, Settings, Playground]
};

const game = new Phaser.Game(config);
