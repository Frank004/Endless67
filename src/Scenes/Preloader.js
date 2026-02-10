import AdsManager from '../Systems/Core/AdsManager.js';
import { ASSETS } from '../Config/AssetKeys.js';
import { UI } from '../Config/GameConstants.js';
import { Leaderboard } from './Leaderboard.js';
import { Settings } from './Settings.js';
import { Playground } from './Playground.js';
import { WarmupManager } from '../Systems/Core/WarmupManager.js';
import { registerEnemyAnimations } from '../Utils/animations.js';
import PlayerProfileService from '../Systems/Gameplay/PlayerProfileService.js';
import { SplashScreen } from '@capacitor/splash-screen';


export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Initialize Ads Manager
        AdsManager.init().catch(e => console.error('[Preloader] Ads Init Failed:', e));

        // Establecer ruta base relativa para asegurar carga en GitHub Pages / Netlify / Capacitor
        this.load.setBaseURL('./');

        // CACHE BUSTER
        // Gets version from index.html (e.g., "v0.0.48") to force asset refresh
        const v = window.GAME_VERSION ? `?v=${window.GAME_VERSION}` : '';

        // --- CUSTOM LOADING SCREEN ---

        // --- VISUAL LOADING SCREEN (PHASER) ---
        // Since HTML loader is static, we switch to this animated one immediately.


        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background / Intro Animation
        // Instead of static bg, we play the intro animation
        let introAnimComplete = false;

        if (this.textures.exists(ASSETS.INTRO_ANIM)) {
            // Create animation if not exists
            if (!this.anims.exists('intro_play')) {
                this.anims.create({
                    key: 'intro_play',
                    frames: this.anims.generateFrameNames(ASSETS.INTRO_ANIM, {
                        prefix: 'intro-frame-',
                        start: 1,
                        end: 16,
                        zeroPad: 2,
                        suffix: '.png'
                    }),
                    frameRate: 24, // Optimized for smoother intro
                    repeat: 0
                });
            }

            this.introSprite = this.add.sprite(width / 2, height / 2, ASSETS.INTRO_ANIM, 'intro-frame-01.png')
                .setOrigin(0.5)
                .setScrollFactor(0);

            // COVER STRATEGY: Scale to fit canvas like MainMenu does
            // Asset is 1082x1920, canvas is ~360x640, needs ~0.33 scale
            const scaleX = width / this.introSprite.width;
            const scaleY = height / this.introSprite.height;
            const scale = Math.max(scaleX, scaleY);
            this.introSprite.setScale(scale);

            // TESTING: Animation disabled to verify frame consistency
            // .play('intro_play'); // DEFERRED: Play in create() after load

            // Hide Native Splash NOW - Phaser has taken over rendering
            // This creates a seamless transition: Native Splash (same image) → Phaser Intro
            SplashScreen.hide().catch(() => { });

            // TESTING: Skip animation, go straight to completion after delay
            this.time.delayedCall(1500, () => {
                this.introAnimComplete = true;
                this.checkLoadComplete();
            });

            /* ORIGINAL animation complete handler - DISABLED FOR TESTING
            this.introSprite.on('animationcomplete', () => {
                this.introAnimComplete = true;
                this.scene.start('MainMenu');
            });
            */

            // Keep flag false initially
            this.introAnimComplete = false;
        } else if (this.textures.exists(ASSETS.MAIN_BG)) {
            // Fallback
            const bg = this.add.image(width / 2, height / 2, ASSETS.MAIN_BG).setOrigin(0.5);
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            bg.setScale(Math.max(scaleX, scaleY));
            introAnimComplete = true; // No anim to wait for
        } else {
            introAnimComplete = true;
        }

        // We attach this flag to the scene to check it later
        this.introAnimComplete = introAnimComplete;
        this.isLoadingComplete = false;

        this.checkLoadComplete = () => {
            if (this.isLoadingComplete && (this.introAnimComplete || !this.textures.exists(ASSETS.INTRO_ANIM))) {
                this.scene.start('MainMenu');
            }
        };

        // 3. Loading Animation (Sprites)
        if (this.textures.exists(ASSETS.UI_HUD)) {
            if (!this.anims.exists('loading_anim')) {
                this.anims.create({
                    key: 'loading_anim',
                    frames: this.anims.generateFrameNames(ASSETS.UI_HUD, {
                        prefix: 'loading/loading-',
                        start: 0,
                        end: 7,
                        suffix: '.png'
                    }),
                    frameRate: 10,
                    repeat: -1
                });
            }
            this.loadingSprite = this.add.sprite(width / 2, (height * 0.40) - 30, ASSETS.UI_HUD)
                .play('loading_anim')
                .setScale(0.5);
        }

        // 4. Version (Match MainMenu Style)


        // Progress events (No text update, just internal logic if needed)
        this.load.on('progress', (value) => {
            // No visual update requested
        });

        this.isLoadingComplete = true;

        // --- ALL LOADING DONE ---

        // 1.5 Hide Phaser Loading Sprite
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '1', 'assets/audio/collecting-coins/Several Coins 01.mp3' + v);
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '2', 'assets/audio/collecting-coins/Several Coins 02.mp3' + v);
        this.load.audio(ASSETS.COIN_SFX_PREFIX + '3', 'assets/audio/collecting-coins/Several Coins 03.mp3' + v);
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '1', 'assets/audio/take-damage/Retro Game Low Take Damage.mp3' + v);
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '2', 'assets/audio/take-damage/Retro Game Low Take Damage 2.mp3' + v);
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '3', 'assets/audio/take-damage/Retro Game Low Take Damage 3.mp3' + v);
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '4', 'assets/audio/take-damage/Retro Game Low Take Damage 4.mp3' + v);
        this.load.audio(ASSETS.DAMAGE_SFX_PREFIX + '5', 'assets/audio/take-damage/Retro Game Low Take Damage 5.mp3' + v);

        // Riser Sounds
        this.load.audio(ASSETS.LAVA_AMBIENT, 'assets/audio/riser/Lava.mp3' + v);
        this.load.audio(ASSETS.LAVA_DROP, 'assets/audio/riser/lava-drop.mp3' + v);
        this.load.audio(ASSETS.ACID_AMBIENT, 'assets/audio/riser/acid.MP3' + v);
        this.load.audio(ASSETS.ACID_DROP, 'assets/audio/riser/acid-drop.MP3' + v);
        this.load.audio(ASSETS.FIRE_AMBIENT, 'assets/audio/riser/fire.mp3' + v);
        this.load.audio(ASSETS.FIRE_DROP, 'assets/audio/riser/fire-drop.mp3' + v);
        this.load.audio(ASSETS.WATER_AMBIENT, 'assets/audio/riser/water.MP3' + v);
        this.load.audio(ASSETS.WATER_DROP, 'assets/audio/riser/water-drop.MP3' + v);

        this.load.audio(ASSETS.BG_MUSIC, 'assets/audio/bg-music/retro-game-music/Retro_hiphop.mp3' + v);
        this.load.audio(ASSETS.JUMP_SFX, 'assets/audio/jumps/jumping.mp3' + v);
        this.load.audio(ASSETS.DESTROY_SFX, 'assets/audio/destroy/destroy.mp3' + v);
        this.load.audio(ASSETS.CELEBRATION_SFX, 'assets/audio/celebration/67.mp3' + v);
        this.load.audio(ASSETS.SHOE_BRAKE, 'assets/audio/shoes/shoe-brake.mp3' + v);
        this.load.audio(ASSETS.TRASHCAN_HIT, 'assets/audio/trashcan/trashcan.mp3' + v);
        this.load.audio(ASSETS.TIRE_BOUNCE, 'assets/audio/tire bounce/tirebounce.mp3' + v);
        this.load.audio(ASSETS.WALL_SLIDE, 'assets/audio/slide/slide.MP3' + v);

        // --- ASSETS LOADING ---
        // --- ASSETS LOADING ---
        if (!this.textures.exists(ASSETS.GAME_LOGO)) this.load.image(ASSETS.GAME_LOGO, 'assets/logo.png' + v);
        if (!this.textures.exists(ASSETS.STORE_LOGO)) this.load.image(ASSETS.STORE_LOGO, 'assets/the-vault-store.png' + v);
        // MAIN_BG loaded in Boot
        // UI_HUD loaded in Boot, checking anyway
        if (!this.textures.exists(ASSETS.UI_ICONS)) this.load.atlas(ASSETS.UI_ICONS, 'assets/ui/icons.png' + v, 'assets/ui/icons.json' + v);
        if (!this.textures.exists(ASSETS.UI_HUD)) this.load.multiatlas(ASSETS.UI_HUD, 'assets/ui/ui.json' + v, 'assets/ui');

        if (!this.textures.exists(ASSETS.COINS)) this.load.multiatlas(ASSETS.COINS, 'assets/spritesheets/coins.json' + v, 'assets/spritesheets');
        if (!this.textures.exists('basketball')) this.load.multiatlas('basketball', 'assets/spritesheets/basketball.json' + v, 'assets/spritesheets');
        if (!this.textures.exists('walls')) this.load.multiatlas('walls', 'assets/spritesheets/walls.json' + v, 'assets/spritesheets');
        if (!this.textures.exists('floor')) this.load.multiatlas('floor', 'assets/spritesheets/floor.json' + v, 'assets/spritesheets');
        if (!this.textures.exists('platform')) this.load.multiatlas('platform', 'assets/spritesheets/platform.json' + v, 'assets/spritesheets');
        if (!this.textures.exists(ASSETS.PROPS)) this.load.multiatlas(ASSETS.PROPS, 'assets/spritesheets/props.json' + v, 'assets/spritesheets');
        if (!this.textures.exists(ASSETS.STORE)) this.load.multiatlas(ASSETS.STORE, 'assets/spritesheets/store.json' + v, 'assets/spritesheets');

        // Player Skin - Force Reload to support skin changes
        if (this.textures.exists(ASSETS.PLAYER)) {
            this.textures.remove(ASSETS.PLAYER);
        }

        const profile = PlayerProfileService.loadOrCreate();
        let skinId = profile?.skins?.equipped || 'default';

        // Fallback for mock skins or missing folders
        if (skinId.includes('mock')) {
            skinId = 'default';
        }
        this._equippedSkinId = skinId;

        let texturePath = `assets/skins/${skinId}`;
        // Ensure texturePath has a trailing slash for multiatlas base path
        if (!texturePath.endsWith('/')) {
            texturePath += '/';
        }
        this.load.multiatlas(ASSETS.PLAYER, `${texturePath}player.json${v}`, texturePath);

        if (!this.textures.exists(ASSETS.ENEMY_ATLAS)) this.load.atlas(ASSETS.ENEMY_ATLAS, 'assets/spritesheets/enemy.png' + v, 'assets/spritesheets/enemy.json' + v);
        if (!this.textures.exists(ASSETS.EFFECTS)) this.load.atlas(ASSETS.EFFECTS, 'assets/spritesheets/effects.png' + v, 'assets/spritesheets/effects.json' + v);


    }

    create() {
        // --- TEXTURE GENERATION ---
        let g = this.make.graphics({ x: 0, y: 0 });
        const atlasLoaded = this.textures.exists(ASSETS.PLAYER);

        // Placeholder Player
        if (!atlasLoaded) {
            const PLAYER_SIZE = 32;
            g.fillStyle(0x00ffff, 1);
            g.fillRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
            g.lineStyle(2, 0xffffff, 0.8);
            g.strokeRoundedRect(0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
            g.generateTexture(ASSETS.PLAYER_PLACEHOLDER, PLAYER_SIZE, PLAYER_SIZE);
        }

        // Particle texture for milestone celebrations
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture(ASSETS.PARTICLE, 8, 8);

        // --- ANIMATIONS ---
        if (atlasLoaded && this.anims) {
            const playerTex = this.textures.get(ASSETS.PLAYER);
            const allFrameNames = playerTex.getFrameNames();

            // Robust Frame Finder
            // Normalizes: "IDLE/idle_01.png" -> "idle01png"
            const normalize = (name) => {
                if (!name) return '';
                // Get filename part, ignore folder
                const filename = name.split('/').pop();
                // Lowercase, remove underscores, dashes, spaces
                return filename.toLowerCase().replace(/[\s\-_]/g, '');
            };

            const findFrame = (requestedName, silent = false) => {
                // 1. Exact match (Fastest)
                if (playerTex.has(requestedName)) return requestedName;
                if (playerTex.has(requestedName.trim())) return requestedName.trim();

                // 2. Normalized Fuzzy Match
                // Matches "idle-01.png" with "IDLE/idle_01.png"
                const reqNorm = normalize(requestedName);
                if (!reqNorm) return null;

                const found = allFrameNames.find(fn => normalize(fn) === reqNorm);

                if (found) return found;

                if (!silent) console.warn(`[Preloader] Frame not found in Player Atlas: "${requestedName}"`);
                return null;
            };

            const hasFrame = (f) => findFrame(f, true) !== null;

            const makeAnim = (key, frameNames, frameRate = 10, repeat = -1, silent = false) => {
                if (this.anims.exists(key)) return;
                const frames = [];
                frameNames.forEach(name => {
                    const realName = findFrame(name, silent);
                    if (realName) frames.push({ key: ASSETS.PLAYER, frame: realName });
                });
                if (frames.length > 0) {
                    this.anims.create({ key, frames, frameRate, repeat });
                }
            };

            const requiredFrames = [
                'idle-01.png',
                'idle-02.png',
                'running-01.png',
                'running-02.png',
                'running-03.png',
                'running-04.png',
                'running-05.png',
                'running-06.png',
                'running-07.png',
                'running-08.png',
                'stop-running-01.png',
                'stop-running-02.png',
                'stop-running-03.png',
                'jump-01.png',
                'jump-02.png',
                'falling-01.png',
                'falling-02.png',
                'falling-03.png',
                'falling-04.png',
                'falling-05.png',
                'falling-06.png',
                'falling-07.png',
                'falling-08.png',
                'wallslide-01.png',
                'wallslide-02.png',
                'wallslide-03.png',
                'wallslide-04.png',
                'wallslide-05.png',
                'wallslide-06.png',
                'hit-01.png',
                'hit-02.png',
                'basketball-powerup-01.png',
                'basketball-powerup-02.png',
                'basketball-powerup-03.png',
                'basketball-powerup-04.png',
                'basketball-powerup-05.png',
                'basketball-powerup-06.png',
                'basketball-powerup-07.png',
                'basketball-powerup-08.png',
                'basketball-powerup-09.png'
            ];

            const missingFrames = requiredFrames.filter(frame => !hasFrame(frame));
            const doubleJumpHyphen = ['double-jump-01.png', 'double-jump-02.png', 'double-jump-03.png'];
            const doubleJumpUnderscore = ['double-jump_01.png', 'double-jump_02.png', 'double-jump_03.png'];
            const hasDoubleJump = doubleJumpHyphen.every(hasFrame) || doubleJumpUnderscore.every(hasFrame);
            if (!hasDoubleJump) {
                missingFrames.push(...doubleJumpHyphen);
            }
            if (missingFrames.length) {
                const skinId = this._equippedSkinId || 'default';
                console.warn(`[Preloader] Missing frames for skin "${skinId}":`, missingFrames);
                if (skinId !== 'default') {
                    const fallbackProfile = PlayerProfileService.loadOrCreate();
                    fallbackProfile.skins.equipped = 'default';
                    PlayerProfileService.save(fallbackProfile);
                    this.scene.restart();
                    return;
                }
            }

            const playerAnimKeys = [
                'player_idle',
                'player_run',
                'player_run_stop',
                'player_jump_up',
                'player_jump_side',
                'player_jump_wall',
                'player_double_jump',
                'player_fall_start',
                'player_fall_loop',
                'player_wall_slide_start',
                'player_wall_slide_loop',
                'player_hit',
                ASSETS.POWERUP_ANIM,
                'player_goal'
            ];
            playerAnimKeys.forEach((key) => {
                if (this.anims.exists(key)) {
                    this.anims.remove(key);
                }
            });

            // IDLE: 2 frames, first one 500ms
            if (!this.anims.exists('player_idle')) {
                const idleDef = [
                    { frame: 'idle-01.png', duration: 500 },
                    { frame: 'idle-02.png' }
                ];

                const finalIdleFrames = [];
                idleDef.forEach(def => {
                    const realName = findFrame(def.frame);
                    if (realName) {
                        finalIdleFrames.push({ key: ASSETS.PLAYER, frame: realName, duration: def.duration });
                    }
                });

                if (finalIdleFrames.length > 0) {
                    this.anims.create({ key: 'player_idle', frames: finalIdleFrames, frameRate: 6, repeat: -1 });
                }
            }

            // Standard Animations using normalized lookup
            makeAnim('player_run', ['running-01.png', 'running-02.png', 'running-03.png', 'running-04.png', 'running-05.png', 'running-06.png', 'running-07.png', 'running-08.png'], 12, -1);
            makeAnim('player_run_stop', ['stop-running-01.png', 'stop-running-02.png', 'stop-running-03.png'], 12, 0);

            // Jump animations with fallback for missing jump-03.png
            const jump03Exists = findFrame('jump-03.png', true);
            const jumpFrames = jump03Exists
                ? ['jump-01.png', 'jump-02.png', 'jump-03.png']
                : ['jump-01.png', 'jump-02.png'];
            makeAnim('player_jump_up', jumpFrames, 12, 0);
            makeAnim('player_jump_side', jumpFrames, 12, 0);

            // Wall jump - use last available jump frame
            const wallJumpFrame = jump03Exists ? 'jump-03.png' : 'jump-02.png';
            makeAnim('player_jump_wall', [wallJumpFrame], 10, 0);

            // Double jump with multiple fallback strategies
            // Try with hyphens first, then underscores
            let djFrames = ['double-jump-01.png', 'double-jump-02.png', 'double-jump-03.png'];
            let djExists = djFrames.some(f => findFrame(f, true));

            if (!djExists) {
                // Try with underscores (redjersey skin uses this format)
                djFrames = ['double-jump_01.png', 'double-jump_02.png', 'double-jump_03.png'];
                djExists = djFrames.some(f => findFrame(f, true));
            }

            if (!djExists) {
                // Reuse jump frames if double jump missing
                makeAnim('player_double_jump', jumpFrames, 12, 0);
            } else {
                makeAnim('player_double_jump', djFrames, 12, 0);
            }

            makeAnim('player_fall_start', ['falling-01.png', 'falling-02.png'], 12, 0);
            makeAnim('player_fall_loop', ['falling-03.png', 'falling-04.png', 'falling-05.png', 'falling-06.png', 'falling-07.png', 'falling-08.png'], 12, -1);
            makeAnim('player_wall_slide_start', ['wallslide-01.png', 'wallslide-02.png', 'wallslide-03.png', 'wallslide-04.png', 'wallslide-05.png'], 12, 0);
            makeAnim('player_wall_slide_loop', ['wallslide-04.png', 'wallslide-05.png', 'wallslide-06.png'], 12, -1, true);
            makeAnim('player_hit', ['hit-01.png', 'hit-02.png'], 10, 0);

            // Effects Animations
            if (this.textures.exists(ASSETS.EFFECTS)) {
                // Ensure sorting correct 1-14
                const fxFrames = [];
                for (let i = 1; i <= 14; i++) {
                    fxFrames.push({ key: ASSETS.EFFECTS, frame: `explotion${i}.png` });
                }

                if (!this.anims.exists(ASSETS.EXPLOSION_ANIM)) {
                    this.anims.create({
                        key: ASSETS.EXPLOSION_ANIM,
                        frames: fxFrames,
                        frameRate: 24,
                        hideOnComplete: true,
                        repeat: 0
                    });
                }
            } else {
                console.error('[Preloader] ❌ EFFECTS texture not found!');
            }


            // Powerup Animation (Refactored to 2000ms total)
            const powerFrames = [];

            // 1. INTRO: Frames 01-04 (150ms each = 600ms)
            ['01', '02', '03', '04'].forEach(num => {
                const real = findFrame(`basketball-powerup-${num}.png`);
                if (real) powerFrames.push({ key: ASSETS.PLAYER, frame: real, duration: 150 });
            });

            // 2. LOOP: Frames 05-07 (Repeated 2 times, 185ms each = 1110ms)
            for (let i = 0; i < 2; i++) {
                ['05', '06', '07'].forEach(num => {
                    const real = findFrame(`basketball-powerup-${num}.png`);
                    if (real) powerFrames.push({ key: ASSETS.PLAYER, frame: real, duration: 185 });
                });
            }

            // 3. OUTRO: Frames 08-09 (145ms each = 290ms)
            ['08', '09'].forEach(num => {
                const real = findFrame(`basketball-powerup-${num}.png`);
                if (real) powerFrames.push({ key: ASSETS.PLAYER, frame: real, duration: 145 });
            });

            // Total: 440 + 1320 + 240 = 2000ms

            if (powerFrames.length > 0 && !this.anims.exists(ASSETS.POWERUP_ANIM)) {
                this.anims.create({ key: ASSETS.POWERUP_ANIM, frames: powerFrames, frameRate: 10, repeat: 0 });
            }
        }

        registerEnemyAnimations(this);


        // --- PROCEDURAL TEXTURES ---
        // Platform
        g.clear(); g.fillStyle(0x00ff00, 1); g.fillRoundedRect(0, 0, 128, 32, 6); g.generateTexture(ASSETS.PLATFORM, 128, 32);
        g.clear(); g.fillStyle(0x0088ff, 1); g.fillRoundedRect(0, 0, 128, 32, 6); g.lineStyle(2, 0xffffff, 0.5); g.strokeRoundedRect(0, 0, 128, 32, 6); g.generateTexture(ASSETS.PLATFORM_MOVING, 128, 32);

        // Enemies
        g.clear(); g.fillStyle(0xff0000, 1); g.beginPath(); g.moveTo(16, 0); g.lineTo(32, 32); g.lineTo(0, 32); g.closePath(); g.fill(); g.strokeRoundedRect(32, 32, 32, 8); g.generateTexture(ASSETS.ENEMY_SPIKE, 32, 32);
        g.clear(); g.fillStyle(0xff8800, 1); g.fillRect(0, 0, 24, 24); g.generateTexture(ASSETS.ENEMY_SHOOTER, 24, 24);
        g.clear(); g.fillStyle(0x9900ff, 1); g.fillRect(0, 0, 24, 24); g.generateTexture(ASSETS.ENEMY_JUMPER_SHOOTER, 24, 24);
        g.clear(); g.fillStyle(0xff0000, 1); g.fillCircle(6, 6, 6); g.generateTexture(ASSETS.PROJECTILE, 12, 12);

        // Maze
        g.clear(); g.fillStyle(0x222222, 1); g.fillRect(0, 0, 100, 60); g.beginPath(); g.lineStyle(4, 0x444444, 1); g.moveTo(0, 0); g.lineTo(100, 0); g.moveTo(0, 60); g.lineTo(100, 60); g.strokePath(); g.generateTexture(ASSETS.MAZE_BLOCK, 100, 60);

        // Liquids (Lava, Water, Acid)
        const riserTextureWidth = this.game.config.width;
        const riserTextureHeight = 800;

        // Lava
        g.clear(); g.fillStyle(0xcc2200, 0.95); g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);
        g.fillStyle(0xff6600, 0.8); for (let i = 0; i < 25; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(10, 20));
        g.fillStyle(0xff8800, 0.7); for (let i = 0; i < 30; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(5, 12));
        g.fillStyle(0xffaa00, 0.6); for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(2, 6));
        g.fillStyle(0xffcc44, 0.5); for (let i = 0; i < 50; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(1, 3));
        g.generateTexture('lava_texture', riserTextureWidth, riserTextureHeight);

        // Water
        g.clear(); g.fillStyle(0x0066cc, 0.85); g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);
        g.fillStyle(0x3399ff, 0.7); for (let i = 0; i < 20; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(12, 25));
        g.fillStyle(0x66b3ff, 0.6); for (let i = 0; i < 35; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(6, 15));
        g.fillStyle(0x99ccff, 0.5); for (let i = 0; i < 45; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(3, 8));
        g.fillStyle(0xccffff, 0.4); for (let i = 0; i < 30; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(2, 5));
        g.fillStyle(0xeeffff, 0.3); for (let i = 0; i < 60; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(1, 3));
        g.generateTexture('water_texture', riserTextureWidth, riserTextureHeight);

        // Acid
        g.clear(); g.fillStyle(0x00cc00, 0.9); g.fillRect(0, 0, riserTextureWidth, riserTextureHeight);
        g.fillStyle(0x66ff33, 0.8); for (let i = 0; i < 25; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(8, 18));
        g.fillStyle(0x88ff55, 0.7); for (let i = 0; i < 30; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(5, 12));
        g.fillStyle(0xaaff66, 0.6); for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(3, 8));
        g.fillStyle(0xccff88, 0.5); for (let i = 0; i < 35; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(2, 6));
        g.fillStyle(0xeeffaa, 0.4); for (let i = 0; i < 50; i++) g.fillCircle(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, riserTextureHeight), Phaser.Math.Between(1, 4));
        g.generateTexture(ASSETS.ACID_TEXTURE, riserTextureWidth, riserTextureHeight);

        // Fire (Procedural disabled to use Sprite)
        /*
        g.clear();
        const pixelSize = 8;
        const flameHeight = riserTextureHeight;
        g.fillStyle(0xffdd00, 1); g.fillRect(0, flameHeight * 0.7, riserTextureWidth, flameHeight * 0.3);
        g.fillStyle(0xff8800, 1); g.fillRect(0, flameHeight * 0.4, riserTextureWidth, flameHeight * 0.3);
        g.fillStyle(0xff4400, 1); g.fillRect(0, flameHeight * 0.2, riserTextureWidth, flameHeight * 0.2);
        g.fillStyle(0xcc2200, 1); g.fillRect(0, 0, riserTextureWidth, flameHeight * 0.2);
        for (let x = 0; x < riserTextureWidth; x += pixelSize) {
            const flameColumnHeight = Phaser.Math.Between(20, 80);
            const numPixels = Math.floor(flameColumnHeight / pixelSize);
            for (let i = 0; i < numPixels; i++) {
                const y = i * pixelSize;
                let color;
                const heightRatio = i / numPixels;
                if (heightRatio < 0.3) color = 0xff0000;
                else if (heightRatio < 0.6) color = 0xff6600;
                else color = 0xffaa00;
                g.fillStyle(color, 1);
                g.fillRect(x, y, pixelSize, pixelSize);
            }
        }
        g.fillStyle(0xffff00, 0.8); for (let i = 0; i < 50; i++) g.fillRect(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, flameHeight), pixelSize / 2, pixelSize / 2);
        g.fillStyle(0xff4400, 0.7); for (let i = 0; i < 30; i++) g.fillRect(Phaser.Math.Between(0, riserTextureWidth), Phaser.Math.Between(0, flameHeight * 0.5), pixelSize / 3, pixelSize / 3);
        g.generateTexture(ASSETS.FIRE_TEXTURE, riserTextureWidth, riserTextureHeight);
        */

        // Fallback: Create a simple red texture if sprite fails or for solid body fill under the wave
        // Fire Gradient Texture
        g.clear();
        // Draw Gradient
        // Top: Hex #FFD700 (Gold/Yellow)
        // Middle: Hex #FF8C00 (Dark Orange)
        // Bottom: Hex #FF0000 (Red)

        // We can draw small rects to simulate gradient or use fillGradientStyle if this was a GameObject, 
        // but for generating a texture using Graphics, we have to draw lines or rects.
        // Let's draw 1px high rects interpolating color.

        for (let y = 0; y < riserTextureHeight; y++) {
            const ratio = y / riserTextureHeight;
            let r, gr, b;

            // Interpolate colors: Red (Top) -> Orange (Bottom)
            // Top: Red (255, 0, 0)
            // Bottom: Orange (255, 140, 0)

            r = 255;
            // Green goes from 0 to 140
            gr = Math.floor(ratio * 140);
            b = 0;

            g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
            g.fillRect(0, y, riserTextureWidth, 1);
        }
        g.generateTexture(ASSETS.FIRE_TEXTURE, riserTextureWidth, riserTextureHeight);

        // UI & FX
        g.clear(); g.lineStyle(4, 0xffffff, 0.3); g.strokeCircle(65, 65, 60); g.generateTexture(ASSETS.JOYSTICK_BASE, 130, 130);
        g.clear(); g.fillStyle(0xffffff, 0.5); g.fillCircle(30, 30, 30); g.generateTexture(ASSETS.JOYSTICK_KNOB, 60, 60);
        g.clear(); g.lineStyle(4, 0xffffff, 0.5); g.strokeCircle(40, 40, 38); g.generateTexture(ASSETS.JUMP_FEEDBACK, 80, 80);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6); g.generateTexture(ASSETS.PARTICLE_DUST, 6, 6);
        g.clear(); g.fillStyle(0xffff00, 1); g.fillCircle(3, 3, 3); g.generateTexture(ASSETS.PARTICLE_SPARK, 6, 6);
        g.clear(); g.fillStyle(0xff4400, 1); g.fillCircle(4, 4, 4); g.generateTexture(ASSETS.PARTICLE_BURN, 8, 8);

        // Power Up & Confetti
        g.clear(); g.fillStyle(0xff6600, 1); g.fillCircle(15, 15, 15); g.lineStyle(2, 0x000000, 1); g.strokeCircle(15, 15, 15); g.beginPath(); g.moveTo(15, 0); g.lineTo(15, 30); g.strokePath(); g.beginPath(); g.moveTo(0, 15); g.lineTo(30, 15); g.strokePath(); g.generateTexture(ASSETS.POWERUP_BALL, 30, 30);
        g.clear(); g.fillStyle(0xffdd00, 0.8); g.fillCircle(4, 4, 4); g.generateTexture(ASSETS.PARTICLE_AURA, 8, 8);
        g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8); g.generateTexture(ASSETS.CONFETTI, 8, 8);

        // --- HIDE HTML LOADER NOW ---
        // Reveal the Phaser Preloader (Intro Frame 1 + Loading Spinner)
        const htmlLoader = document.getElementById('loader');
        if (htmlLoader) {
            htmlLoader.style.display = 'none';
            htmlLoader.classList.add('hidden');
        }

        // --- AUDIO LOADING ---safely
        if (!this.scene.get('Leaderboard')) this.scene.add('Leaderboard', Leaderboard, false);
        if (!this.scene.get('Settings')) this.scene.add('Settings', Settings, false);
        if (!this.scene.get('Playground')) this.scene.add('Playground', Playground, false);

        // Warmup Shaders & Particles
        const warmup = new WarmupManager(this);
        warmup.warmup().then(() => {
            this.isLoadingComplete = true;

            // --- ALL LOADING DONE ---

            // 1.5 Hide Phaser Loading Sprite
            if (this.loadingSprite) {
                this.loadingSprite.destroy();
                this.loadingSprite = null;
            }

            // 2. Start Animation
            if (this.introSprite && this.textures.exists(ASSETS.INTRO_ANIM)) {
                this.introSprite.play('intro_play');
                // The 'animationcomplete' listener set in preload will handle scene switch
            } else {
                // Fallback: Immediate start if no anim
                this.scene.start('MainMenu');
            }
        });
    }
}
