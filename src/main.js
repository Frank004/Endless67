import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';

// Mobile-first: Detectar dispositivo y ajustar altura
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    scene: [Boot, Game]
};

const game = new Phaser.Game(config);
