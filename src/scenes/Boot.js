import FluidPipeline from '../pipelines/FluidPipeline.js';
import FlamesPipeline from '../pipelines/FlamesPipeline.js';
import { Leaderboard } from './Leaderboard.js';
import { Settings } from './Settings.js';
import { Playground } from './Playground.js';

/**
 * @phasereditor
 * @scene Boot
 * @width 400
 * @height 600
 * @backgroundColor 0x000000
 */
export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // --- AUDIO ---
        // Estructura compatible con Phaser Editor: assets/audio/
        this.load.audio('coin_sfx_1', 'assets/audio/collecting-coins/Several Coins 01.mp3');
        this.load.audio('coin_sfx_2', 'assets/audio/collecting-coins/Several Coins 02.mp3');
        this.load.audio('coin_sfx_3', 'assets/audio/collecting-coins/Several Coins 03.mp3');
        this.load.audio('damage_sfx_1', 'assets/audio/take-damage/Retro Game Low Take Damage.wav');
        this.load.audio('damage_sfx_2', 'assets/audio/take-damage/Retro Game Low Take Damage 2.wav');
        this.load.audio('damage_sfx_3', 'assets/audio/take-damage/Retro Game Low Take Damage 3.wav');
        this.load.audio('damage_sfx_4', 'assets/audio/take-damage/Retro Game Low Take Damage 4.wav');
        this.load.audio('damage_sfx_5', 'assets/audio/take-damage/Retro Game Low Take Damage 5.wav');
        this.load.audio('lava_ambient', 'assets/audio/lava/Lava.wav');
        this.load.audio('bg_music', 'assets/audio/bg-music/retro-game-music/Retro hiphop.mp3');
        this.load.audio('lava_drop', 'assets/audio/lava-drop/lava-drop-in.wav');
        this.load.audio('jump_sfx', 'assets/audio/jumps/jumping.wav');
        this.load.audio('destroy_sfx', 'assets/audio/destroy/destroy.wav');
        this.load.audio('celebration_sfx', 'assets/audio/celebration/67.WAV');

        // --- UI ICONS ---
        this.load.atlas('ui_icons', 'assets/ui/icons.png', 'assets/ui/icons.json');

        // --- COIN SPRITE SHEET ---
        // Cargar sprite sheet del coin usando multiatlas (formato TexturePacker)
        this.load.multiatlas('coins', 'assets/spritesheets/coins.json', 'assets/spritesheets');
        
        // --- BASKETBALL SPRITE SHEET (POWERUP) ---
        // Cargar sprite sheet del basketball usando multiatlas (formato TexturePacker)
        this.load.multiatlas('basketball', 'assets/spritesheets/basketball.json', 'assets/spritesheets');
        // Overlay del powerup 67 (animación especial)
        this.load.multiatlas('basketball_powerup', 'assets/spritesheets/basketball_powerup.json', 'assets/spritesheets');

        // --- PLAYER SPRITE (PNG Placeholder) ---
        // Cargar PNG si existe. Si no existe, se usará el placeholder generado.
        // Toggle: Cambiar usePlayerPNG en DebugManager para activar/desactivar
        // Ruta esperada: assets/images/player_32x32.png
        try {
            this.load.image('player_png', 'assets/images/player_32x32.png');
        } catch (error) {
            console.warn('Player PNG no encontrado, se usará placeholder generado:', error);
        }

        // Register Riser Pipelines
        if (this.game.renderer.type === Phaser.WEBGL) {
            this.renderer.pipelines.addPostPipeline('FluidPipeline', FluidPipeline);
            this.renderer.pipelines.addPostPipeline('FlamesPipeline', FlamesPipeline);
        }
    }

    create() {
        // Generate Textures
        let g = this.make.graphics({ x: 0, y: 0 });

        // Player Sprite - Toggle entre PNG y placeholder generado
        // Toggle controlado por DebugManager.usePlayerPNG
        // Para cambiar: modifica usePlayerPNG en src/managers/DebugManager.js
        const usePlayerPNG = this.registry.get('usePlayerPNG') !== false; // Default: true (usar PNG si existe)

        // Verificar si el PNG se cargó correctamente
        const pngLoaded = this.textures.exists('player_png');

        // Siempre generar placeholder 'player' como fallback
        const PLAYER_SIZE = 32;
        g.fillStyle(0x00ffff, 1);
        g.fillRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
        g.lineStyle(2, 0xffffff, 0.8);
        g.strokeRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
        g.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);

        // Log del estado
        if (usePlayerPNG && pngLoaded) {
            console.log('✅ Player PNG disponible (32x32px) - Se usará si toggle está activo');
        } else if (!usePlayerPNG) {
            console.log('🎨 Usando Player placeholder generado (toggle desactivado)');
        } else {
            console.log('⚠️ PNG no encontrado, usando placeholder generado');
            console.log('   Coloca tu PNG en: assets/images/player_32x32.png');
        }

        // Platform - DIMENSIONES CORRECTAS: 128x32

        // static (magenta)
        g.clear(); g.fillStyle(0xff00aa, 1);
        g.fillRoundedRect(0, 0, 128, 32, 6);
        g.generateTexture('platform', 128, 32);
        // moving horizontal (blue)
        g.clear(); g.fillStyle(0x0088ff, 1);
        g.fillRoundedRect(0, 0, 128, 32, 6);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeRoundedRect(0, 0, 128, 32, 6);
        g.generateTexture('platform_moving', 128, 32);

        // Enemigos

        // Enemy Spike
        g.clear();
        g.fillStyle(0xff0000, 1);
        g.beginPath();
        g.moveTo(16, 0);
        g.lineTo(32, 32);
        g.lineTo(0, 32);
        g.closePath();
        g.fill();
        g.strokeRoundedRect(32, 32, 32, 8);
        g.generateTexture('enemy_spike', 32, 32);

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

        // Riser textures: usar ancho del juego dinámicamente, altura suficiente para tileable
        const riserTextureWidth = this.game.config.width;
        const riserTextureHeight = 800;

        // Lava texture (rojo/naranja)
        g.clear();
        g.fillStyle(0xcc2200, 0.95);
        g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);

        // Burbujas grandes de lava (oscuras)
        g.fillStyle(0xff6600, 0.8);
        for (let i = 0; i < 25; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(10, 20)
            );
        }

        // Burbujas medianas (brillantes)
        g.fillStyle(0xff8800, 0.7);
        for (let i = 0; i < 30; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(5, 12)
            );
        }

        // Burbujas pequeñas (muy brillantes)
        g.fillStyle(0xffaa00, 0.6);
        for (let i = 0; i < 40; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(2, 6)
            );
        }

        // Micro burbujas dispersas
        g.fillStyle(0xffcc44, 0.5);
        for (let i = 0; i < 50; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(1, 3)
            );
        }
        g.generateTexture('lava_texture', riserTextureWidth, riserTextureHeight);

        // Water texture (azul)
        g.clear();
        g.fillStyle(0x0066cc, 0.85);
        g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);

        // Burbujas grandes de agua (azul oscuro)
        g.fillStyle(0x3399ff, 0.7);
        for (let i = 0; i < 20; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(12, 25)
            );
        }

        // Burbujas medianas (azul claro)
        g.fillStyle(0x66b3ff, 0.6);
        for (let i = 0; i < 35; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(6, 15)
            );
        }

        // Burbujas pequeñas (azul muy claro)
        g.fillStyle(0x99ccff, 0.5);
        for (let i = 0; i < 45; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(3, 8)
            );
        }

        // Burbujas de aire (blanco translúcido)
        g.fillStyle(0xccffff, 0.4);
        for (let i = 0; i < 30; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(2, 5)
            );
        }

        // Micro burbujas dispersas
        g.fillStyle(0xeeffff, 0.3);
        for (let i = 0; i < 60; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(1, 3)
            );
        }
        g.generateTexture('water_texture', riserTextureWidth, riserTextureHeight);

        // Acid texture (verde ácido)
        g.clear();
        g.fillStyle(0x00cc00, 0.9);
        g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);

        // Burbujas grandes de ácido (verde oscuro)
        g.fillStyle(0x66ff33, 0.8);
        for (let i = 0; i < 25; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(8, 18)
            );
        }

        // Burbujas medianas (verde brillante)
        g.fillStyle(0x88ff55, 0.7);
        for (let i = 0; i < 30; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(5, 12)
            );
        }

        // Burbujas pequeñas (verde-amarillo)
        g.fillStyle(0xaaff66, 0.6);
        for (let i = 0; i < 40; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(3, 8)
            );
        }

        // Burbujas de gas tóxico (amarillo-verde)
        g.fillStyle(0xccff88, 0.5);
        for (let i = 0; i < 35; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(2, 6)
            );
        }

        // Micro burbujas dispersas (muy brillantes)
        g.fillStyle(0xeeffaa, 0.4);
        for (let i = 0; i < 50; i++) {
            g.fillCircle(
                Phaser.Math.Between(0, riserTextureWidth),
                Phaser.Math.Between(0, riserTextureHeight),
                Phaser.Math.Between(1, 4)
            );
        }
        g.generateTexture('acid_texture', riserTextureWidth, riserTextureHeight);

        // Fire texture (pixel art style con top irregular como la referencia)
        g.clear();

        const pixelSize = 8; // Tamaño de cada "pixel" para el efecto pixelado
        const flameHeight = riserTextureHeight;

        // Gradiente de fuego (de abajo hacia arriba: amarillo → naranja → rojo)
        // Capa 1: Base amarilla (bottom)
        g.fillStyle(0xffdd00, 1);
        g.fillRect(0, flameHeight * 0.7, riserTextureWidth, flameHeight * 0.3);

        // Capa 2: Naranja medio
        g.fillStyle(0xff8800, 1);
        g.fillRect(0, flameHeight * 0.4, riserTextureWidth, flameHeight * 0.3);

        // Capa 3: Naranja-rojo
        g.fillStyle(0xff4400, 1);
        g.fillRect(0, flameHeight * 0.2, riserTextureWidth, flameHeight * 0.2);

        // Capa 4: Rojo oscuro (top area)
        g.fillStyle(0xcc2200, 1);
        g.fillRect(0, 0, riserTextureWidth, flameHeight * 0.2);

        // Crear el top pixelado irregular (llamas puntiagudas)
        // Dibujar columnas de pixels de diferentes alturas para simular llamas
        for (let x = 0; x < riserTextureWidth; x += pixelSize) {
            // Altura aleatoria para cada columna de llama
            const flameColumnHeight = Phaser.Math.Between(20, 80);
            const numPixels = Math.floor(flameColumnHeight / pixelSize);

            for (let i = 0; i < numPixels; i++) {
                const y = i * pixelSize;

                // Color basado en la altura (más arriba = más rojo, más abajo = más amarillo)
                let color;
                const heightRatio = i / numPixels;

                if (heightRatio < 0.3) {
                    color = 0xff0000; // Rojo brillante en las puntas
                } else if (heightRatio < 0.6) {
                    color = 0xff6600; // Naranja
                } else {
                    color = 0xffaa00; // Naranja-amarillo
                }

                g.fillStyle(color, 1);
                g.fillRect(x, y, pixelSize, pixelSize);
            }
        }

        // Mini partículas de llamas flotantes (pequeños pixels dispersos)
        g.fillStyle(0xffff00, 0.8);
        for (let i = 0; i < 50; i++) {
            const px = Phaser.Math.Between(0, riserTextureWidth);
            const py = Phaser.Math.Between(0, flameHeight);
            g.fillRect(px, py, pixelSize / 2, pixelSize / 2);
        }

        // Partículas rojas más pequeñas
        g.fillStyle(0xff4400, 0.7);
        for (let i = 0; i < 30; i++) {
            const px = Phaser.Math.Between(0, riserTextureWidth);
            const py = Phaser.Math.Between(0, flameHeight * 0.5);
            g.fillRect(px, py, pixelSize / 3, pixelSize / 3);
        }

        g.generateTexture('fire_texture', riserTextureWidth, riserTextureHeight);

        // UI & FX
        // UI & FX
        g.clear(); g.lineStyle(4, 0xffffff, 0.3); g.strokeCircle(65, 65, 60); g.generateTexture('joystick_base', 130, 130);
        g.clear(); g.fillStyle(0xffffff, 0.5); g.fillCircle(30, 30, 30); g.generateTexture('joystick_knob', 60, 60);
        g.clear(); g.lineStyle(4, 0xffffff, 0.5); g.strokeCircle(40, 40, 38); g.generateTexture('jump_feedback', 80, 80);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6); g.generateTexture('particle_dust', 6, 6);
        g.clear(); g.fillStyle(0xffff00, 1); g.fillCircle(3, 3, 3); g.generateTexture('particle_spark', 6, 6);
        g.clear(); g.fillStyle(0xff4400, 1); g.fillCircle(4, 4, 4); g.generateTexture('particle_burn', 8, 8);
        // Coin sprite sheet ya cargado desde assets/spritesheets/coins.json
        // No generar textura placeholder, usar el sprite sheet directamente

        // Power Up & Confetti
        g.clear(); g.fillStyle(0xff6600, 1); g.fillCircle(15, 15, 15); g.lineStyle(2, 0x000000, 1); g.strokeCircle(15, 15, 15); g.beginPath(); g.moveTo(15, 0); g.lineTo(15, 30); g.strokePath(); g.beginPath(); g.moveTo(0, 15); g.lineTo(30, 15); g.strokePath(); g.generateTexture('powerup_ball', 30, 30);
        g.clear(); g.fillStyle(0xffdd00, 0.8); g.fillCircle(4, 4, 4); g.generateTexture('particle_aura', 8, 8);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8); g.generateTexture('confetti', 8, 8);

        // Ocultar el loader cuando el juego esté listo
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }

        // Register new scenes
        if (!this.scene.get('Leaderboard')) this.scene.add('Leaderboard', Leaderboard, false);
        if (!this.scene.get('Settings')) this.scene.add('Settings', Settings, false);
        if (!this.scene.get('Playground')) this.scene.add('Playground', Playground, false);

        this.scene.start('MainMenu');
    }
}
