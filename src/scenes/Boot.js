import FluidPipeline from '../pipelines/FluidPipeline.js';
import FlamesPipeline from '../pipelines/FlamesPipeline.js';
import { Leaderboard } from './Leaderboard.js';
import { Settings } from './Settings.js';
import { Playground } from './Playground.js';
import { ASSETS } from '../config/AssetKeys.js';

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
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '1', 'assets/audio/collecting-coins/Several Coins 01.mp3');
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '2', 'assets/audio/collecting-coins/Several Coins 02.mp3');
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '3', 'assets/audio/collecting-coins/Several Coins 03.mp3');
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '1', 'assets/audio/take-damage/Retro Game Low Take Damage.mp3');
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '2', 'assets/audio/take-damage/Retro Game Low Take Damage 2.mp3');
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '3', 'assets/audio/take-damage/Retro Game Low Take Damage 3.mp3');
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '4', 'assets/audio/take-damage/Retro Game Low Take Damage 4.mp3');
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '5', 'assets/audio/take-damage/Retro Game Low Take Damage 5.mp3');
        this.load.audio(ASSETS.LAVA_AMBIENT, 'assets/audio/lava/Lava.mp3');
        this.load.audio(ASSETS.BG_MUSIC, 'assets/audio/bg-music/retro-game-music/Retro hiphop.mp3');
        this.load.audio(ASSETS.LAVA_DROP, 'assets/audio/lava-drop/lava-drop-in.mp3');
        this.load.audio(ASSETS.JUMP_SFX, 'assets/audio/jumps/jumping.mp3');
        this.load.audio(ASSETS.DESTROY_SFX, 'assets/audio/destroy/destroy.mp3');
        this.load.audio(ASSETS.CELEBRATION_SFX, 'assets/audio/celebration/67.mp3');
        this.load.audio(ASSETS.SHOE_BRAKE, 'assets/audio/shoes/shoe-brake.mp3');
        this.load.audio(ASSETS.TRASHCAN_HIT, 'assets/audio/trashcan/trashcan.mp3');
        this.load.audio(ASSETS.TIRE_BOUNCE, 'assets/audio/tire bounce/tirebounce.mp3');

        // --- UI ICONS ---
        this.load.atlas(ASSETS.UI_ICONS, 'assets/ui/icons.png', 'assets/ui/icons.json');

        // --- COIN SPRITE SHEET ---
        // Cargar sprite sheet del coin usando multiatlas (formato TexturePacker)
        this.load.multiatlas(ASSETS.COINS, 'assets/spritesheets/coins.json', 'assets/spritesheets');

        // --- BASKETBALL SPRITE SHEET (POWERUP) ---
        // Cargar sprite sheet del basketball usando multiatlas (formato TexturePacker)
        this.load.multiatlas('basketball', 'assets/spritesheets/basketball.json', 'assets/spritesheets');

        // --- WALLS SPRITESHEET (LEFT/RIGHT) ---
        this.load.multiatlas('walls', 'assets/spritesheets/walls.json', 'assets/spritesheets');
        this.load.multiatlas('floor', 'assets/spritesheets/floor.json', 'assets/spritesheets');
        this.load.multiatlas('platform', 'assets/spritesheets/platform.json', 'assets/spritesheets');
        this.load.multiatlas(ASSETS.PROPS, 'assets/spritesheets/props.json', 'assets/spritesheets');

        // --- PLAYER SPRITES ---
        // Atlas del player
        this.load.multiatlas(ASSETS.PLAYER, 'assets/spritesheets/player.json', 'assets/spritesheets');

        // Register Riser Pipelines
        if (this.game.renderer.type === Phaser.WEBGL) {
            this.renderer.pipelines.addPostPipeline('FluidPipeline', FluidPipeline);
            this.renderer.pipelines.addPostPipeline('FlamesPipeline', FlamesPipeline);
        }
    }

    create() {
        console.log('Boot sequence loaded - Rev 3 (No Wallslide-09)');
        // Generate Textures
        let g = this.make.graphics({ x: 0, y: 0 });

        // Player Sprite - Atlas o placeholder generado
        const atlasLoaded = this.textures.exists(ASSETS.PLAYER);

        // Placeholder (solo si no hay atlas)
        if (!atlasLoaded) {
            const PLAYER_SIZE = 32;
            g.fillStyle(0x00ffff, 1);
            g.fillRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
            g.lineStyle(2, 0xffffff, 0.8);
            g.strokeRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
            g.generateTexture(ASSETS.PLAYER_PLACEHOLDER, PLAYER_SIZE, PLAYER_SIZE);
        }

        // Log del estado
        if (atlasLoaded) {
            console.log('✅ Player atlas disponible (usando frames IDLE)');
        } else {
            console.log('⚠️ Player atlas no encontrado, usando placeholder generado');
        }

        // Registrar animaciones del player (si hay atlas)
        if (atlasLoaded && this.anims) {
            const playerTex = this.textures.get(ASSETS.PLAYER);

            // Helper más robusto para encontrar frames (maneja espacios extra)
            const findFrame = (f) => {
                if (playerTex.has(f)) return f;
                if (playerTex.has(f.trim())) return f.trim();
                console.warn(`Frame no encontrado en Player Atlas: "${f}"`);
                return null;
            };
            const hasFrame = (f) => findFrame(f) !== null;

            const makeAnim = (key, frameNames, frameRate = 10, repeat = -1) => {
                if (this.anims.exists(key)) return;

                const frames = [];
                frameNames.forEach(name => {
                    const realName = findFrame(name);
                    if (realName) {
                        frames.push({ key: ASSETS.PLAYER, frame: realName });
                    }
                });

                if (frames.length > 0) {
                    this.anims.create({ key, frames, frameRate, repeat });
                    console.log(`Animación creada: ${key} (${frames.length} frames)`);
                } else {
                    console.error(`No se pudo crear animación ${key}: Ningún frame válido.`);
                }
            };

            makeAnim('player_idle', ['IDLE 1.png', 'IDLE 2.png', 'IDLE 3.png'], 6, -1);
            makeAnim('player_run', [
                'running-01.png', 'running-02.png', 'running-03.png', 'running-04.png',
                'running-05.png', 'running-06.png', 'running-07.png', 'running-08.png'
            ], 12, -1);
            makeAnim('player_run_stop', ['stop-running-01.png', 'stop-running-02.png', 'stop-running-03.png'], 12, 0);
            makeAnim('player_jump_up', ['jump-01.png', 'jump-02.png', 'jump-03.png'], 12, 0);
            makeAnim('player_jump_side', ['jump-01.png', 'jump-02.png', 'jump-03.png'], 12, 0);
            makeAnim('player_jump_wall', ['jump-03.png'], 10, 0);
            makeAnim('player_double_jump', ['double-jump-01.png', 'double-jump-02.png', 'double-jump-03.png'], 12, 0);
            makeAnim('player_fall_start', ['falling-01.png', 'falling-02.png'], 12, 0);
            makeAnim('player_fall_loop', [
                'falling-04.png', 'falling-05.png', 'falling-06.png',
                'falling-07.png', 'falling-08.png', 'falling-09.png'
            ], 12, -1);
            makeAnim('player_wall_slide_start', [
                'wallslide-01.png', 'wallslide-02.png', 'wallslide-03.png',
                'wallslide-04.png', 'wallslide-05.png'
            ], 12, 0);
            makeAnim('player_wall_slide_loop', ['wallslide-06.png', 'wallslide-07.png', 'wallslide-08.png'], 12, -1);
            makeAnim('player_hit', ['hit-01.png', 'hit-02.png'], 10, 0);
            // Animación de powerup: usa frames dentro del atlas del player (basketball_powerup-01..16)
            const powerFrameOrder = [
                'basketball_powerup-01.png',
                'basketball_powerup-02.png',
                'basketball_powerup-03.png',
                'basketball_powerup-04.png',
                'basketball_powerup-05.png',
                'basketball_powerup-06.png',
                'basketball_powerup-07.png',
                'basketball_powerup-08.png',
                'basketball_powerup-09.png',
                'basketball_powerup-10.png',
                'basketball_powerup-11.png',
                'basketball_powerup-12.png',
                'basketball_powerup-13.png',
                'basketball_powerup-14.png',
                'basketball_powerup-15.png',
                'basketball_powerup-16.png'
            ];
            const powerFrames = powerFrameOrder.filter(hasFrame).flatMap(f => {
                // Duplicar frames 05 y 06 para hold extra
                if (f === 'basketball_powerup-05.png' || f === 'basketball_powerup-06.png') {
                    return [{ key: ASSETS.PLAYER, frame: f }, { key: ASSETS.PLAYER, frame: f }];
                }
                return { key: ASSETS.PLAYER, frame: f };
            });
            if (powerFrames.length > 0 && !this.anims.exists('player_powerup')) {
                this.anims.create({
                    key: 'player_powerup',
                    frames: powerFrames,
                    frameRate: 10,
                    repeat: 0
                });
            }
        }

        // Platform - DIMENSIONES CORRECTAS: 128x32

        // static (Placeholder DEBUG - Green)
        g.clear(); g.fillStyle(0x00ff00, 1);
        g.fillRoundedRect(0, 0, 128, 32, 6);
        g.generateTexture(ASSETS.PLATFORM, 128, 32);
        // moving horizontal (blue)
        g.clear(); g.fillStyle(0x0088ff, 1);
        g.fillRoundedRect(0, 0, 128, 32, 6);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeRoundedRect(0, 0, 128, 32, 6);
        g.generateTexture(ASSETS.PLATFORM_MOVING, 128, 32);

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
        g.generateTexture(ASSETS.ENEMY_SPIKE, 32, 32);

        // Enemy Shooter
        g.clear();
        g.fillStyle(0xff8800, 1);
        g.fillRect(0, 0, 24, 24);
        g.generateTexture(ASSETS.ENEMY_SHOOTER, 24, 24);

        // Enemy Jumper Shooter (New)
        g.clear();
        g.fillStyle(0x9900ff, 1); // Purple
        g.fillRect(0, 0, 24, 24); // Match player size (24x24)
        g.generateTexture(ASSETS.ENEMY_JUMPER_SHOOTER, 24, 24);

        // Proyectil (Rojo brillante)
        g.clear(); g.fillStyle(0xff0000, 1); g.fillCircle(6, 6, 6); g.generateTexture(ASSETS.PROJECTILE, 12, 12);

        // Bloque Laberinto
        g.clear(); g.fillStyle(0x222222, 1); g.fillRect(0, 0, 100, 60);
        g.beginPath(); g.lineStyle(4, 0x444444, 1); g.moveTo(0, 0); g.lineTo(100, 0); g.moveTo(0, 60); g.lineTo(100, 60); g.strokePath();
        g.generateTexture(ASSETS.MAZE_BLOCK, 100, 60);

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
        g.generateTexture(ASSETS.ACID_TEXTURE, riserTextureWidth, riserTextureHeight);

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

        g.generateTexture(ASSETS.FIRE_TEXTURE, riserTextureWidth, riserTextureHeight);

        // UI & FX
        // UI & FX
        g.clear(); g.lineStyle(4, 0xffffff, 0.3); g.strokeCircle(65, 65, 60); g.generateTexture('joystick_base', 130, 130);
        g.clear(); g.fillStyle(0xffffff, 0.5); g.fillCircle(30, 30, 30); g.generateTexture('joystick_knob', 60, 60);
        g.clear(); g.lineStyle(4, 0xffffff, 0.5); g.strokeCircle(40, 40, 38); g.generateTexture('jump_feedback', 80, 80);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6); g.generateTexture(ASSETS.PARTICLE_DUST, 6, 6);
        g.clear(); g.fillStyle(0xffff00, 1); g.fillCircle(3, 3, 3); g.generateTexture(ASSETS.PARTICLE_SPARK, 6, 6);
        g.clear(); g.fillStyle(0xff4400, 1); g.fillCircle(4, 4, 4); g.generateTexture(ASSETS.PARTICLE_BURN, 8, 8);
        // Coin sprite sheet ya cargado desde assets/spritesheets/coins.json
        // No generar textura placeholder, usar el sprite sheet directamente

        // Power Up & Confetti
        g.clear(); g.fillStyle(0xff6600, 1); g.fillCircle(15, 15, 15); g.lineStyle(2, 0x000000, 1); g.strokeCircle(15, 15, 15); g.beginPath(); g.moveTo(15, 0); g.lineTo(15, 30); g.strokePath(); g.beginPath(); g.moveTo(0, 15); g.lineTo(30, 15); g.strokePath(); g.generateTexture(ASSETS.POWERUP_BALL, 30, 30);
        g.clear(); g.fillStyle(0xffdd00, 0.8); g.fillCircle(4, 4, 4); g.generateTexture(ASSETS.PARTICLE_AURA, 8, 8);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8); g.generateTexture(ASSETS.CONFETTI, 8, 8);

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
