import LavaPipeline from '../pipelines/LavaPipeline.js';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // --- AUDIO ---
        this.load.audio('coin_sfx_1', 'Sounds%20FX/Collecting%20coins/Several%20Coins%2001.mp3');
        this.load.audio('coin_sfx_2', 'Sounds%20FX/Collecting%20coins/Several%20Coins%2002.mp3');
        this.load.audio('coin_sfx_3', 'Sounds%20FX/Collecting%20coins/Several%20Coins%2003.mp3');
        this.load.audio('damage_sfx_1', 'Sounds%20FX/take%20damage/Retro%20Game%20Low%20Take%20Damage.wav');
        this.load.audio('damage_sfx_2', 'Sounds%20FX/take%20damage/Retro%20Game%20Low%20Take%20Damage%202.wav');
        this.load.audio('damage_sfx_3', 'Sounds%20FX/take%20damage/Retro%20Game%20Low%20Take%20Damage%203.wav');
        this.load.audio('damage_sfx_4', 'Sounds%20FX/take%20damage/Retro%20Game%20Low%20Take%20Damage%204.wav');
        this.load.audio('damage_sfx_5', 'Sounds%20FX/take%20damage/Retro%20Game%20Low%20Take%20Damage%205.wav');
        this.load.audio('lava_ambient', 'Sounds%20FX/lava/Lava.wav');
        this.load.audio('bg_music', 'Sounds%20FX/bgmusic/retro-game-music/Retro%20hiphop.mp3');
        this.load.audio('lava_drop', 'Sounds%20FX/lavaDrop/lava-drop-in.wav');
        this.load.audio('jump_sfx', 'Sounds%20FX/jumps/jumping.wav');
        this.load.audio('destroy_sfx', 'Sounds%20FX/destroy/destroy.wav');
        this.load.audio('celebration_sfx', 'Sounds%20FX/67/67.WAV');

        // Register Lava Pipeline
        if (this.game.renderer.type === Phaser.WEBGL) {
            this.renderer.pipelines.addPostPipeline('LavaPipeline', LavaPipeline);
        }
    }

    create() {

        // Generate Textures
        let g = this.make.graphics({ x: 0, y: 0 });

        // Player
        g.fillStyle(0x00ffff, 1);
        g.fillRoundedRect(0, 0, 24, 24, 6);
        g.lineStyle(2, 0xffffff, 0.8);
        g.strokeRoundedRect(0, 0, 24, 24, 6);
        g.generateTexture('player', 24, 24);

        // Platform

        // static
        g.clear(); g.fillStyle(0xff00aa, 1);
        g.fillRoundedRect(0, 0, 100, 18, 4);
        g.generateTexture('platform', 100, 18);
        // moving horizontal
        g.clear(); g.fillStyle(0x0088ff, 1);
        g.fillRoundedRect(0, 0, 100, 18, 4);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeRoundedRect(0, 0, 100, 18, 4);
        g.generateTexture('platform_moving', 100, 18);

        // Enemigos

        // Enemy Spike
        g.clear();
        g.fillStyle(0xff0000, 1);
        g.beginPath();
        g.moveTo(10, 0);
        g.lineTo(20, 20);
        g.lineTo(0, 20);
        g.closePath();
        g.fill();
        g.strokeRoundedRect(24, 24, 24, 6);
        g.generateTexture('enemy_spike', 24, 24);

        // Enemy Shooter
        g.clear();
        g.fillStyle(0xff8800, 1);
        g.fillRect(0, 0, 24, 24);
        g.generateTexture('enemy_shooter', 24, 24);

        // Enemy Jumper Shooter (New)
        g.clear();
        g.fillStyle(0x9900ff, 1); // Purple
        g.fillRect(0, 0, 24, 24); // Match player size (24x24)
        g.generateTexture('enemy_jumper_shooter', 24, 24);

        // Proyectil (Rojo brillante)
        g.clear(); g.fillStyle(0xff0000, 1); g.fillCircle(6, 6, 6); g.generateTexture('projectile', 12, 12);

        // Bloque Laberinto
        g.clear(); g.fillStyle(0x222222, 1); g.fillRect(0, 0, 100, 60);
        g.beginPath(); g.lineStyle(4, 0x444444, 1); g.moveTo(0, 0); g.lineTo(100, 0); g.moveTo(0, 60); g.lineTo(100, 60); g.strokePath();
        g.generateTexture('maze_block', 100, 60);

        // Entorno
        g.clear(); g.fillStyle(0x222222, 1); g.fillRect(0, 0, 32, 64); g.generateTexture('wall', 32, 64);
        g.clear(); g.fillStyle(0xcc2200, 0.95); g.fillRect(0, 0, 400, 800); g.fillStyle(0xff6600, 0.8); for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0, 400), Phaser.Math.Between(0, 800), Phaser.Math.Between(5, 15)); g.generateTexture('lava_texture', 400, 800);

        // UI & FX
        // UI & FX
        g.clear(); g.lineStyle(4, 0xffffff, 0.3); g.strokeCircle(65, 65, 60); g.generateTexture('joystick_base', 130, 130);
        g.clear(); g.fillStyle(0xffffff, 0.5); g.fillCircle(30, 30, 30); g.generateTexture('joystick_knob', 60, 60);
        g.clear(); g.lineStyle(4, 0xffffff, 0.5); g.strokeCircle(40, 40, 38); g.generateTexture('jump_feedback', 80, 80);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6); g.generateTexture('particle_dust', 6, 6);
        g.clear(); g.fillStyle(0xffff00, 1); g.fillCircle(3, 3, 3); g.generateTexture('particle_spark', 6, 6);
        g.clear(); g.fillStyle(0xff4400, 1); g.fillCircle(4, 4, 4); g.generateTexture('particle_burn', 8, 8);
        g.clear(); g.fillStyle(0xffd700, 1); g.fillCircle(10, 10, 8); g.generateTexture('coin', 20, 20);

        // Power Up & Confetti
        g.clear(); g.fillStyle(0xff6600, 1); g.fillCircle(15, 15, 15); g.lineStyle(2, 0x000000, 1); g.strokeCircle(15, 15, 15); g.beginPath(); g.moveTo(15, 0); g.lineTo(15, 30); g.strokePath(); g.beginPath(); g.moveTo(0, 15); g.lineTo(30, 15); g.strokePath(); g.generateTexture('powerup_ball', 30, 30);
        g.clear(); g.fillStyle(0xffdd00, 0.8); g.fillCircle(4, 4, 4); g.generateTexture('particle_aura', 8, 8);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8); g.generateTexture('confetti', 8, 8);

        // Ocultar el loader cuando el juego esté listo
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }

        this.scene.start('Game');
    }
}
