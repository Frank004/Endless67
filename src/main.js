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

// En móvil usar altura completa, en desktop mantener 600px
const gameHeight = isMobile ? window.innerHeight : 600;

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: gameHeight,
    backgroundColor: '#000',
    parent: 'game-container',
    scale: {
        mode: isMobile ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
        autoCenter: isMobile ? Phaser.Scale.CENTER_HORIZONTALLY : Phaser.Scale.CENTER_BOTH
    },
    input: { activePointers: 3 },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [Boot, MainMenu, Game, Leaderboard, Settings, Playground]
};

const game = new Phaser.Game(config);
