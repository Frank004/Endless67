import { Player } from '../objects/Player.js';
import { SpikeEnemy, ShooterEnemy, JumperShooterEnemy } from '../objects/Enemy.js';
import { Projectile } from '../objects/Projectile.js';
import { spawnTestEnemies } from '../utils/TestEnemies.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.input.addPointer(3);
        this.physics.world.setBounds(0, -1000000, 400, 1000000 + 800);
        this.cameras.main.setBackgroundColor('#050505');

        const SPLIT_X = 280;
        this.moveAnchorX = null;
        this.moveAnchorY = null;
        this.joystickVisible = true; // Default to visible

        this.joystickBase = this.add.image(0, 0, 'joystick_base').setAlpha(0.5).setScrollFactor(0).setDepth(999).setVisible(false);
        this.joystickKnob = this.add.image(0, 0, 'joystick_knob').setAlpha(0.8).setScrollFactor(0).setDepth(1000).setVisible(false);

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }

        // Obtener altura de la cámara para posicionar controles
        const cameraHeight = this.cameras.main.height;

        if (this.isMobile) {
            let splitLine = this.add.graphics();
            splitLine.lineStyle(2, 0xffffff, 0.15);
            splitLine.beginPath(); splitLine.moveTo(SPLIT_X, cameraHeight); splitLine.lineTo(SPLIT_X, cameraHeight - 50); splitLine.strokePath();
            splitLine.setScrollFactor(0).setDepth(0);

            // Controles en la parte inferior, usando altura dinámica
            const controlY = cameraHeight - 40; // 40px desde el fondo
            this.add.text(140, controlY, '< HOLD & SLIDE >', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            this.add.text(340, controlY, 'JUMP', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        } else {
            this.add.text(200, 560, '← → MOVER | SPACE SALTAR', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0);
        }

        // --- VARIABLES ---
        this.jumps = 0;
        this.maxJumps = 3;
        this.gameStarted = false;
        this.isGameOver = false;
        this.isPausedEvent = false;
        this.lavaRising = false; // Control para la animación de lava subiendo
        this.totalScore = 0;
        this.currentHeight = 0;
        this.lastPlatformY = 500;
        this.lastWallTouched = null;
        this.wallJumpConsecutive = 0;
        this.mazeSequenceRemaining = 0;
        this.lastMazeSide = 0;
        this.justFinishedMaze = false;

        // POWER UP STATE
        this.isInvincible = false;
        this.powerupTimer = null;
        this.lastPowerupSpawnHeight = -1000;
        this.lastPowerupTime = -15000; // Allow immediate spawn

        // PAUSE & SOUND STATE
        this.isPaused = false;
        this.soundEnabled = true;

        // --- GRUPOS ---
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.coins = this.physics.add.staticGroup();
        this.powerups = this.physics.add.staticGroup();
        this.spikeEnemies = this.physics.add.group({ classType: SpikeEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        this.shooterEnemies = this.physics.add.group({ classType: ShooterEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        this.jumperShooterEnemies = this.physics.add.group({ classType: JumperShooterEnemy, allowGravity: true, immovable: false, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, allowGravity: false, runChildUpdate: true });
        this.mazeWalls = this.physics.add.staticGroup();

        // Paredes en los bordes para móvil
        const gameWidth = this.game.config.width; // 400px
        const wallWidth = 32;
        this.leftWall = this.add.tileSprite(0, 300, wallWidth, 1200, 'wall').setOrigin(0, 0.5).setDepth(60);
        this.rightWall = this.add.tileSprite(gameWidth, 300, wallWidth, 1200, 'wall').setOrigin(1, 0.5).setDepth(60);
        this.physics.add.existing(this.leftWall, true);
        this.physics.add.existing(this.rightWall, true);

        this.player = new Player(this, 200, 400);

        this.spawnPlatform(200, 450, 140, false);

        this.spawnPlatform(200, 450, 140, false);

        // --- TEST ENEMIES (Uncomment to enable) ---
        // spawnTestEnemies(this);

        // --- NORMAL GENERATION (Default) ---
        // If you enable test enemies, you might want to comment this block out to avoid overlap
        this.lastPlatformY = 450;
        for (let i = 0; i < 6; i++) this.generateNextRow();
        // -----------------------------------

        // Lava dentro de las paredes con offset para el efecto wave
        // Las paredes están en x=0 y x=400, cada una de 32px
        // Agregar offset a ambos lados para que el efecto wave no se vea cortado
        const waveOffset = 20; // Offset para el efecto wave en cada lado
        const lavaVisualWidth = gameWidth - (wallWidth * 2) + (waveOffset * 2); // 336 + 40 = 376px (visual)
        const lavaPhysicsWidth = gameWidth - (wallWidth * 2); // 336px (física, dentro de paredes)
        const lavaX = gameWidth / 2; // 200px (centro)

        this.lava = this.add.tileSprite(lavaX, 900, lavaVisualWidth, 800, 'lava_texture').setOrigin(0.5, 0);
        this.physics.add.existing(this.lava);
        this.lava.body.allowGravity = false;
        this.lava.body.immovable = true;
        this.lava.body.setSize(lavaPhysicsWidth, 780);
        // Offset del cuerpo de física para centrarlo (el visual es más ancho)
        this.lava.body.setOffset(waveOffset, 20);
        this.lava.setDepth(50); // Profundidad menor que las paredes para que no se vea por detrás
        this.baseLavaSpeed = -60;
        this.currentLavaSpeed = this.baseLavaSpeed;

        if (this.game.renderer.type === Phaser.WEBGL) {
            this.lava.setPostPipeline('LavaPipeline');
        }

        // --- PARTÍCULAS ---
        this.dustEmitter = this.add.particles(0, 0, 'particle_dust', { lifespan: 400, speed: { min: 50, max: 100 }, scale: { start: 1, end: 0 }, gravityY: 100, emitting: false, depth: 20 });
        this.sparkEmitter = this.add.particles(0, 0, 'particle_spark', { lifespan: 300, speed: { min: 200, max: 400 }, blendMode: 'ADD', scale: { start: 1, end: 0 }, emitting: false, depth: 20 });
        this.burnEmitter = this.add.particles(0, 0, 'particle_burn', { lifespan: 600, speed: { min: 100, max: 300 }, angle: { min: 200, max: 340 }, scale: { start: 1.5, end: 0 }, blendMode: 'ADD', tint: [0xff0000, 0xff8800], emitting: false, depth: 51 });
        this.auraEmitter = this.add.particles(0, 0, 'particle_aura', { speedY: { min: -100, max: -250 }, speedX: { min: -20, max: 20 }, scale: { start: 1.2, end: 0 }, lifespan: 400, blendMode: 'ADD', follow: this.player, emitting: false, depth: 19 });
        this.confettiEmitter = this.add.particles(0, 0, 'confetti', {
            speed: { min: 200, max: 500 }, angle: { min: 180, max: 360 }, gravityY: 300, lifespan: 1200,
            scale: { start: 1.5, end: 0 },
            tint: [0xffd700, 0xffffff, 0xffaa00],
            emitting: false, depth: 200
        });
        // UI - Ajustar márgenes para móvil
        const scoreX = this.isMobile ? 20 : 10; // Más margen en móvil para evitar que se corte
        const scoreY = this.isMobile ? 20 : 10; // Más margen superior en móvil
        this.scoreText = this.add.text(scoreX, scoreY, 'SCORE: 0', { fontSize: '24px', color: '#ffd700', fontStyle: 'bold' }).setScrollFactor(0).setDepth(100);
        this.heightText = this.add.text(scoreX, scoreY + 30, 'ALTURA: 0m', { fontSize: '14px', color: '#fff' }).setScrollFactor(0).setDepth(100);
        this.uiText = this.add.text(200, 200, '¡SUBE!', { fontSize: '18px', color: '#00ffff', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // --- PAUSE BUTTON ---
        this.pauseButton = this.add.text(370, 10, '⏸', { fontSize: '24px', color: '#ffffff' })
            .setScrollFactor(0).setDepth(150).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu());


        // --- PAUSE MENU OVERLAY ---
        this.pauseMenuBg = this.add.rectangle(200, 300, 400, 600, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(200).setVisible(false);

        this.pauseMenuTitle = this.add.text(200, 180, 'PAUSA', {
            fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Continue Button
        this.continueButton = this.add.text(200, 260, 'CONTINUAR', {
            fontSize: '24px', color: '#00ff00', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu())
            .on('pointerover', function () { this.setColor('#00ffff'); })
            .on('pointerout', function () { this.setColor('#00ff00'); });

        // Sound Toggle Button
        this.soundToggleButton = this.add.text(200, 330, '🔊 SONIDO: ON', {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleSound())
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Joystick Toggle Button
        this.joystickToggleButton = this.add.text(200, 400, '🕹️ JOYSTICK: ON', {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleJoystickVisual())
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Controles de teclado para PC
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Inputs táctiles
        this.input.on('pointerdown', (pointer) => {
            if (this.isGameOver || this.isPausedEvent) return;
            if (!this.gameStarted) { this.startGame(); return; }
            if (pointer.x > SPLIT_X) this.handleJump();
        });

        // Inputs de teclado
        this.spaceKey.on('down', () => {
            if (this.isGameOver || this.isPausedEvent) return;
            if (!this.gameStarted) { this.startGame(); return; }
            this.handleJump();
        });

        // --- COLISIONES ---
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        this.physics.add.collider(this.player, this.mazeWalls, this.handleLand, null, this);
        this.physics.add.collider(this.player, this.leftWall, () => this.player.handleWallTouch('left'));
        this.physics.add.collider(this.player, this.rightWall, () => this.player.handleWallTouch('right'));

        // Corrección Proyectiles vs Pared (usando overlap para asegurar destrucción)
        // Usar processCallback para validar antes de procesar
        this.physics.add.overlap(
            this.projectiles,
            this.leftWall,
            this.projectileHitWall,
            (obj1, obj2) => {
                let proj = (obj1.texture && obj1.texture.key === 'projectile') ? obj1 : (obj2.texture && obj2.texture.key === 'projectile' ? obj2 : null);
                return proj && proj.active && !proj.getData('processed');
            },
            this
        );
        this.physics.add.overlap(
            this.projectiles,
            this.rightWall,
            this.projectileHitWall,
            (obj1, obj2) => {
                let proj = (obj1.texture && obj1.texture.key === 'projectile') ? obj1 : (obj2.texture && obj2.texture.key === 'projectile' ? obj2 : null);
                return proj && proj.active && !proj.getData('processed');
            },
            this
        );

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.player, this.spikeEnemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.shooterEnemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.jumperShooterEnemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.jumperShooterEnemies, this.platforms); // Needs to stand on platforms
        this.physics.add.overlap(
            this.player,
            this.projectiles,
            this.hitByProjectile,
            (player, projectile) => {
                // Validar que el proyectil está activo y no ha sido procesado
                return projectile && projectile.active && !projectile.getData('processed');
            },
            this
        );
        this.physics.add.overlap(this.player, this.lava, this.touchLava, null, this);

        this.cameras.main.startFollow(this.player, true, 0, 0.1);

        // --- LAVA AMBIENT SOUND ---
        try {
            if (this.sound && this.cache.audio.exists('lava_ambient')) {
                this.lavaSound = this.sound.add('lava_ambient', { loop: true, volume: 0 });
                this.lavaSound.play();
                console.log('Lava sound started successfully');
            } else {
                console.warn('Lava ambient sound not found in cache');
            }
        } catch (error) {
            console.warn('Error starting lava sound:', error);
        }
    }

    update() {
        if (this.isGameOver) {
            const cameraTop = this.cameras.main.scrollY;
            const cameraBottom = this.cameras.main.scrollY + this.cameras.main.height;

            if (this.lavaRising) {
                // Animación sutil: la lava sube hasta cubrir toda la pantalla
                const targetY = cameraTop - 100; // Cubrir desde arriba de la pantalla

                // Movimiento suave hacia arriba (velocidad sutil)
                if (this.lava.y > targetY) {
                    this.lava.y -= 8; // Velocidad sutil de subida
                } else {
                    this.lava.y = targetY; // Mantener en la posición objetivo
                }
            } else {
                // Antes de que la lava suba, mantenerla en la parte inferior
                const targetY = cameraBottom - 100;

                // Mover la lava hacia la posición objetivo si no está ahí
                if (this.lava.y > targetY) {
                    this.lava.y = Math.max(this.lava.y - 15, targetY);
                } else {
                    this.lava.y = targetY; // Mantener en la posición objetivo
                }
            }

            this.lava.tilePositionY -= 2;
            return;
        }
        if (this.isPausedEvent || this.isPaused) return;
        if (!this.gameStarted) return;

        this.player.update(this.cursors, null, null, this.isMobile); // Simplified update for now

        // --- CONTROLES: TECLADO O TÁCTIL ---
        const SPLIT_X = 280;
        let movePointer = null;
        let keyboardMove = 0;

        // Detectar movimiento por teclado
        if (this.cursors.left.isDown) {
            keyboardMove = -1;
        } else if (this.cursors.right.isDown) {
            keyboardMove = 1;
        }

        // Detectar movimiento táctil (solo si no hay input de teclado o es móvil)
        if (this.isMobile || keyboardMove === 0) {
            this.input.manager.pointers.forEach((pointer) => {
                if (pointer.isDown && pointer.x <= SPLIT_X) movePointer = pointer;
            });
        }

        if (keyboardMove !== 0) {
            // --- MOVIMIENTO POR TECLADO ---
            this.moveAnchorX = null;
            this.joystickBase.setVisible(false);
            this.joystickKnob.setVisible(false);
            this.player.move(keyboardMove);
        } else if (movePointer) {
            // --- USUARIO MOVIENDO (TÁCTIL) ---
            if (this.moveAnchorX === null) {
                this.moveAnchorX = movePointer.x;
                this.moveAnchorY = movePointer.y;

                // Position joystick at touch start
                this.joystickBase.setPosition(this.moveAnchorX, this.moveAnchorY);
                this.joystickKnob.setPosition(this.moveAnchorX, this.moveAnchorY);

                if (this.joystickVisible) {
                    this.joystickBase.setVisible(true);
                    this.joystickKnob.setVisible(true);
                }
            }

            // Calculate delta
            const dx = movePointer.x - this.moveAnchorX;
            const dy = movePointer.y - this.moveAnchorY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40; // Max joystick radius

            // Clamp knob position
            if (dist > maxDist) {
                const angle = Math.atan2(dy, dx);
                this.joystickKnob.x = this.moveAnchorX + Math.cos(angle) * maxDist;
                this.joystickKnob.y = this.moveAnchorY + Math.sin(angle) * maxDist;
            } else {
                this.joystickKnob.setPosition(movePointer.x, movePointer.y);
            }

            // Move player if threshold passed
            if (Math.abs(dx) > 10) {
                this.player.move(dx > 0 ? 1 : -1);
            } else {
                this.player.stop();
            }
        } else {
            this.moveAnchorX = null;
            this.joystickBase.setVisible(false);
            this.joystickKnob.setVisible(false);
            this.player.stop();
        }

        // Lava
        let distanceToLava = this.player.y - this.lava.y;
        let tierSpeed = -60;
        if (this.currentHeight > 1000) tierSpeed = -72;
        if (this.currentHeight > 2000) tierSpeed = -85;
        if (this.currentHeight > 3000) tierSpeed = -100;

        let targetSpeed = tierSpeed;
        if (distanceToLava < -800) targetSpeed = -200;
        else if (distanceToLava < -600) targetSpeed = -140;

        this.currentLavaSpeed = Phaser.Math.Linear(this.currentLavaSpeed, targetSpeed, 0.02);
        this.lava.y += this.currentLavaSpeed * (1 / 60);
        this.lava.tilePositionY -= 1;

        // Update lava sound volume based on distance and viewport visibility
        if (this.lavaSound && this.lavaSound.isPlaying) {
            // Check if lava is visible in the camera viewport
            const cameraBottom = this.cameras.main.scrollY + this.cameras.main.height;
            const lavaTop = this.lava.y;
            const lavaVisible = lavaTop < cameraBottom + 200; // Add 200px buffer

            let lavaTargetVolume = 0;

            if (lavaVisible) {
                // Calculate volume based on distance (closer = louder)
                // Max volume at 100px or closer, fade out by 200px
                if (distanceToLava < 100) {
                    lavaTargetVolume = 1.0; // Maximum volume when very close
                } else if (distanceToLava < 200) {
                    // Linear fade from 1.0 to 0 between 100 and 200 pixels
                    lavaTargetVolume = 1.0 * (1 - (distanceToLava - 100) / 100);
                }
            }

            // Smooth volume transition to avoid abrupt cuts
            const currentLavaVolume = this.lavaSound.volume;
            const newLavaVolume = Phaser.Math.Linear(currentLavaVolume, lavaTargetVolume, 0.05);
            this.lavaSound.setVolume(newLavaVolume);
        }

        // Separate control for background music ducking
        if (this.bgMusic && this.bgMusic.isPlaying) {
            let musicVolume = 0.80; // Default volume
            if (distanceToLava < 100) {
                // Reduce music when lava is very close
                musicVolume = 0.50;
            } else if (distanceToLava < 200) {
                // Gradual transition from 0.50 to 0.80 between 100 and 200 pixels
                const fadeRatio = (distanceToLava - 100) / 100;
                musicVolume = 0.50 + (fadeRatio * 0.30);
            }
            this.bgMusic.setVolume(musicVolume);
        }

        if (this.leftWall && this.leftWall.active && this.leftWall.body) {
            this.leftWall.y = this.cameras.main.scrollY + 300;
            this.leftWall.x = 0; // Mantener en el borde izquierdo
            this.leftWall.body.updateFromGameObject();
        }

        if (this.rightWall && this.rightWall.active && this.rightWall.body) {
            this.rightWall.y = this.cameras.main.scrollY + 300;
            const gameWidth = this.game.config.width; // Usar ancho dinámico
            this.rightWall.x = gameWidth; // Mantener en el borde derecho
            this.rightWall.body.updateFromGameObject();
        }

        if (this.lastPlatformY > this.cameras.main.scrollY - 300) this.generateNextRow();

        const limitY = this.player.y + 900;
        this.platforms.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        this.coins.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        this.powerups.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        this.mazeWalls.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });

        // Enemies and Projectiles clean themselves up in preUpdate

        let h = Math.floor((400 - this.player.y) / 10);
        if (h > this.currentHeight) this.currentHeight = h;
        this.heightText.setText(`ALTURA: ${this.currentHeight}m`);

        this.platforms.children.iterate((plat) => {
            if (plat.getData('isMoving')) {
                if (plat.x < 90) plat.setVelocityX(100);
                else if (plat.x > 310) plat.setVelocityX(-100);
            }
        });
    }

    // --- SISTEMA DE DISPARO ---
    spawnShooter(platform) {
        let ex = platform.x;
        let ey = platform.y - 20;
        let shooter = this.shooterEnemies.get(ex, ey);
        if (shooter) {
            shooter.spawn(ex, ey);
            shooter.startShooting(this.projectiles);
        }
    }

    spawnJumperShooter(platform) {
        let ex = platform.x;
        let ey = platform.y - 50; // Spawn higher to ensure it falls and registers collision
        let jumper = this.jumperShooterEnemies.get(ex, ey);
        if (jumper) {
            jumper.spawn(ex, ey);
            jumper.startBehavior(this.projectiles);
        }
    }

    projectileHitWall(obj1, obj2) {
        // PARANOID CHECK: Identify explicitly
        let projectile = null;
        let wall = null;

        if (obj1.texture && obj1.texture.key === 'projectile') projectile = obj1;
        else if (obj2.texture && obj2.texture.key === 'projectile') projectile = obj2;

        if (obj1.texture && obj1.texture.key === 'wall') wall = obj1;
        else if (obj2.texture && obj2.texture.key === 'wall') wall = obj2;

        // Fallback for wall identification if texture check fails (e.g. tileSprite might behave differently)
        if (!wall) {
            if (obj1 === this.leftWall || obj1 === this.rightWall) wall = obj1;
            else if (obj2 === this.leftWall || obj2 === this.rightWall) wall = obj2;
        }

        // CRITICAL: If we can't find a projectile, or if the "projectile" is actually a wall, ABORT IMMEDIATELY
        if (!projectile) return;
        if (projectile === this.leftWall || projectile === this.rightWall) return;
        if (projectile.texture && projectile.texture.key === 'wall') return;

        // Validar que el proyectil existe y está activo antes de destruirlo
        if (!projectile.active || projectile.getData('processed')) return;

        try {
            // Marcar como procesado ANTES de hacer cualquier cosa
            projectile.setData('processed', true);

            this.sparkEmitter.emitParticleAt(projectile.x, projectile.y, 10);

            // Destruir de forma segura
            if (projectile.active) {
                projectile.setActive(false);
                projectile.setVisible(false);
                projectile.destroy();
            }
        } catch (error) {
            // Silent catch
        }
    }

    hitByProjectile(obj1, obj2) {
        let player = null;
        let projectile = null;

        if (obj1.texture && obj1.texture.key === 'player') player = obj1;
        else if (obj2.texture && obj2.texture.key === 'player') player = obj2;

        if (obj1.texture && obj1.texture.key === 'projectile') projectile = obj1;
        else if (obj2.texture && obj2.texture.key === 'projectile') projectile = obj2;

        // Fallback: assume player is this.player if not found (though overlap should provide it)
        if (!player && (obj1 === this.player || obj2 === this.player)) player = this.player;

        if (!player || !projectile) return;

        // Validar que el proyectil existe, está activo y no ha sido procesado
        if (!projectile.active || projectile.getData('processed')) return;

        try {
            // Marcar como procesado ANTES de hacer cualquier cosa
            projectile.setData('processed', true);

            // Guardar posición y velocidad antes de destruir
            const projX = projectile.x;
            const projVelX = projectile.body ? projectile.body.velocity.x : 0;

            if (this.isInvincible) {
                // Destruir de forma segura
                if (projectile.active) {
                    projectile.setActive(false);
                    projectile.setVisible(false);
                    projectile.destroy();
                }
                this.sparkEmitter.emitParticleAt(projX, projectile.y, 10);
                return;
            }

            // Destruir de forma segura
            if (projectile.active) {
                projectile.setActive(false);
                projectile.setVisible(false);
                projectile.destroy();
            }

            // Play random damage sound
            try {
                const damageKeys = ['damage_sfx_1', 'damage_sfx_2', 'damage_sfx_3', 'damage_sfx_4', 'damage_sfx_5'];
                const randomKey = Phaser.Utils.Array.GetRandom(damageKeys);
                if (this.sound && this.cache.audio.exists(randomKey)) {
                    this.sound.play(randomKey, { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Error playing damage sound:', error);
            }

            let dir = (player.x < projX) ? -1 : 1;
            if (projVelX > 0) dir = 1; else if (projVelX < 0) dir = -1;
            player.setVelocity(dir * 400, -200);
            player.setTint(0xff0000);
            this.cameras.main.shake(100, 0.02);
            this.time.delayedCall(200, () => player.clearTint());
        } catch (error) {
            console.warn('Error handling projectile hit:', error);
        }
    }

    // --- EVENTOS ---
    collectPowerup(player, powerup) {
        powerup.destroy();
        this.isPausedEvent = true;
        this.physics.pause();
        player.setTint(0xffff00);
        this.auraEmitter.start();

        // Play celebration sound immediately
        try {
            if (this.sound && this.cache.audio.exists('celebration_sfx')) {
                this.sound.play('celebration_sfx', { volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing celebration sound:', error);
        }

        // Registrar altura para Cooldown (Moved to spawn time for better distribution control)
        // this.lastPowerupSpawnHeight = this.currentHeight;

        let t = this.add.text(this.cameras.main.centerX, this.cameras.main.scrollY + 200, 'POWERUP 67', {
            fontSize: '40px', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(200);

        this.cameras.main.shake(500, 0.005);
        this.time.delayedCall(2000, () => {
            t.destroy();
            this.physics.resume();
            this.isPausedEvent = false;
            this.activateInvincibility();
        });
    }

    activateInvincibility() {
        this.isInvincible = true;
        if (this.powerupTimer) this.powerupTimer.remove();
        this.powerupTimer = this.time.delayedCall(12000, () => {
            this.deactivatePowerup();
        });
    }

    deactivatePowerup() {
        this.isInvincible = false;
        this.auraEmitter.stop();
        this.player.setTint(0xaaaaaa);
        this.time.delayedCall(200, () => this.player.clearTint());
    }

    toggleJoystickVisual() {
        this.joystickVisible = !this.joystickVisible;
        this.joystickToggleButton.setText(this.joystickVisible ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF');
    }

    togglePauseMenu() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.pauseMenuBg.setVisible(true);
            this.pauseMenuTitle.setVisible(true);
            this.continueButton.setVisible(true);
            this.soundToggleButton.setVisible(true);
            this.joystickToggleButton.setVisible(true);
        } else {
            this.physics.resume();
            this.pauseMenuBg.setVisible(false);
            this.pauseMenuTitle.setVisible(false);
            this.continueButton.setVisible(false);
            this.soundToggleButton.setVisible(false);
            this.joystickToggleButton.setVisible(false);
        }
    }

    trigger67Celebration() {
        try {
            this.isPausedEvent = true;
            this.physics.pause();
            this.cameras.main.flash(500, 255, 255, 255);

            if (this.confettiEmitter) {
                this.confettiEmitter.setPosition(this.cameras.main.centerX, this.cameras.main.scrollY - 50);
                this.confettiEmitter.explode(80);
            }

            // Play celebration sound
            try {
                if (this.sound && this.cache.audio.exists('celebration_sfx')) {
                    this.sound.play('celebration_sfx', { volume: 0.7 });
                }
            } catch (error) {
                console.warn('Error playing celebration sound:', error);
            }

            let t = this.add.text(this.cameras.main.centerX, this.cameras.main.scrollY + 300, '67!', {
                fontFamily: '"Courier New", monospace', fontSize: '100px', color: '#ffd700', fontStyle: 'bold', stroke: '#8B4500', strokeThickness: 10,
                shadow: { offsetX: 6, offsetY: 6, color: '#000000', blur: 0, stroke: true, fill: true }
            }).setOrigin(0.5).setDepth(200);

            this.tweens.add({ targets: t, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });

            this.time.delayedCall(1500, () => {
                if (t && t.destroy) t.destroy();
                this.physics.resume();
                this.isPausedEvent = false;
            });
        } catch (e) {
            console.error('Error in trigger67Celebration:', e);
            // Ensure game resumes if error occurs
            this.physics.resume();
            this.isPausedEvent = false;
        }
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.totalScore += 1;
        this.scoreText.setText('SCORE: ' + this.totalScore);
        let t = this.add.text(player.x, player.y - 30, '+1', { fontSize: '18px', fontStyle: 'bold', color: '#ffff00' }).setDepth(101);
        this.tweens.add({ targets: t, y: player.y - 80, alpha: 0, duration: 600, onComplete: () => t.destroy() });

        // Play random coin sound with pitch variation
        try {
            const soundKeys = ['coin_sfx_1', 'coin_sfx_2', 'coin_sfx_3'];
            const randomKey = Phaser.Utils.Array.GetRandom(soundKeys);
            // Check if sound exists before playing
            if (this.sound && this.cache.audio.exists(randomKey)) {
                // Detune varies pitch: 100 cents = 1 semitone. Range -200 to 200 is +/- 2 semitones.
                const randomDetune = Phaser.Math.Between(-200, 200);
                this.sound.play(randomKey, { detune: randomDetune, volume: 0.6 });
            }
        } catch (error) {
            console.warn('Error playing coin sound:', error);
        }

        let strScore = this.totalScore.toString();
        if (strScore === '67' || strScore.endsWith('67')) {
            this.trigger67Celebration();
        }
    }

    hitEnemy(player, enemy) {
        if (this.isInvincible) {
            enemy.destroy();
            this.sparkEmitter.emitParticleAt(enemy.x, enemy.y, 20);

            // Play destroy sound
            try {
                if (this.sound && this.cache.audio.exists('destroy_sfx')) {
                    this.sound.play('destroy_sfx', { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Error playing destroy sound:', error);
            }

            return;
        }

        // Play random damage sound
        try {
            const damageKeys = ['damage_sfx_1', 'damage_sfx_2', 'damage_sfx_3', 'damage_sfx_4', 'damage_sfx_5'];
            const randomKey = Phaser.Utils.Array.GetRandom(damageKeys);
            if (this.sound && this.cache.audio.exists(randomKey)) {
                this.sound.play(randomKey, { volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing damage sound:', error);
        }

        player.setTint(0xff0000); this.cameras.main.shake(100, 0.01); this.time.delayedCall(200, () => player.clearTint());
        const kickX = Phaser.Math.Between(-300, 300); player.setVelocity(kickX, 300);
    }
    touchLava(player, lava) {
        if (this.isGameOver) return;
        if (this.isInvincible) {
            this.deactivatePowerup(); if (this.powerupTimer) this.powerupTimer.remove();
            player.setVelocityY(-900);
            let t = this.uiText.scene.add.text(player.x, player.y - 50, 'LAVA JUMP!', { fontSize: '18px', color: '#fff', stroke: '#f00', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);
            this.tweens.add({ targets: t, y: player.y - 150, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
            return;
        }

        // Play lava drop sound
        try {
            if (this.sound && this.cache.audio.exists('lava_drop')) {
                this.sound.play('lava_drop', { volume: 0.7 });
            }
        } catch (error) {
            console.warn('Error playing lava drop sound:', error);
        }

        this.isGameOver = true;
        // Emitir partículas de quemado
        this.burnEmitter.emitParticleAt(player.x, player.y, 50);
        // Detener movimiento
        player.setVelocity(0, 0);
        // Hacer que el jugador desaparezca después de un breve momento para ver el splash
        player.setTint(0x000000);
        this.time.delayedCall(300, () => {
            // Ocultar el jugador después de la animación del splash
            player.setVisible(false);
            player.setActive(false);
        });

        // Después de 50ms, activar la animación de lava subiendo
        this.time.delayedCall(50, () => {
            this.lavaRising = true;
        });

        this.physics.pause();
        this.uiText.setText(`GAME OVER\nScore: ${this.totalScore}\nTap or Space to Restart`);
        this.uiText.setVisible(true);
        this.uiText.setDepth(200);
        this.scoreText.setDepth(200);

        this.time.delayedCall(1000, () => {
            const restartFn = () => {
                this.spaceKey.off('down', restartFn);
                this.scene.restart();
            };
            this.input.once('pointerdown', restartFn);
            this.spaceKey.once('down', restartFn);
        });
    }

    handleLand(player, floor) {
        player.handleLand(floor);
    }

    handlePlatformCollision(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) { this.handleLand(player, platform); return; }
        if (platform.getData('isMoving')) {
            if ((player.body.touching.left && platform.body.touching.right) || (player.body.touching.right && platform.body.touching.left)) {
                platform.setVelocityX(platform.body.velocity.x * -1);
            }
        }
    }

    handleJump() {
        // --- APLICAR SPEED BOOST ---
        let boost = this.isInvincible ? 1.25 : 1.0; // 25% Extra Force

        // Play jump sound with random pitch variation
        try {
            if (this.sound && this.cache.audio.exists('jump_sfx')) {
                const randomDetune = Phaser.Math.Between(-300, 300); // Wider range for more variety
                this.sound.play('jump_sfx', { detune: randomDetune, volume: 0.15 });
            }
        } catch (error) {
            console.warn('Error playing jump sound:', error);
        }

        const result = this.player.jump(boost);

        if (result) {
            if (result.type === 'wall_jump') {
                this.sparkEmitter.emitParticleAt(result.x, result.y, 10);
            } else {
                this.dustEmitter.emitParticleAt(result.x, result.y, 10);
            }
        }
    }



    generateNextRow() {
        const height = this.currentHeight;
        const allowMaze = height > 200; const allowMoving = height > 500; const allowSpikes = height > 1000; const allowSpikesMoving = height > 2000;
        const allowShooters = height > 2500;
        const allowJumperShooters = height > 4000;

        if (this.mazeSequenceRemaining > 0) {
            this.spawnMazeRow(this.lastPlatformY, this.lastMazeSide, allowMoving, allowSpikes);
            this.lastMazeSide = (this.lastMazeSide === 0) ? 1 : 0;
            this.mazeSequenceRemaining--; this.lastPlatformY -= 220;
            if (this.mazeSequenceRemaining === 0) this.justFinishedMaze = true; return;
        }

        let startMazeChance = allowMaze ? (height > 1500 ? 45 : 25) : 0;
        if (!this.justFinishedMaze && Phaser.Math.Between(0, 100) < startMazeChance) {
            this.mazeSequenceRemaining = Phaser.Math.Between(3, 6); this.lastMazeSide = Phaser.Math.Between(0, 1);
            this.lastPlatformY -= 200; this.spawnMazeRow(this.lastPlatformY, this.lastMazeSide, allowMoving, allowSpikes);
            this.lastMazeSide = (this.lastMazeSide === 0) ? 1 : 0; this.mazeSequenceRemaining--; this.lastPlatformY -= 220; return;
        }

        let gap = Phaser.Math.Between(150, 200);
        if (this.justFinishedMaze) { this.lastPlatformY -= 200; this.justFinishedMaze = false; } else { this.lastPlatformY -= gap; }
        let width = Phaser.Math.Between(80, 120);
        // Constrain X to be within walls (32px) + padding (10px)
        let minX = 32 + 10 + (width / 2);
        let maxX = 368 - 10 - (width / 2);
        let x = Phaser.Math.Between(minX, maxX);

        if (Phaser.Math.Between(0, 100) < 80) {
            let isMoving = (allowMoving && Phaser.Math.Between(0, 100) < 30);
            let plat = this.spawnPlatform(x, this.lastPlatformY, width, isMoving);
            let enemySpawned = false;

            // Enemy Spawning Logic
            if (!isMoving && allowJumperShooters && Phaser.Math.Between(0, 100) < 25) {
                this.spawnJumperShooter(plat); enemySpawned = true;
            }
            else if (!enemySpawned && !isMoving && allowShooters && Phaser.Math.Between(0, 100) < 30) {
                this.spawnShooter(plat); enemySpawned = true;
            }
            else if (!enemySpawned && allowSpikes && Phaser.Math.Between(0, 100) < 40) {
                if (!isMoving || allowSpikesMoving) { this.spawnSpike(plat); enemySpawned = true; }
            }

            if (!enemySpawned && Phaser.Math.Between(0, 100) < 70) {
                // LOGICA DE COOLDOWN POWERUP
                let powerupChance = 5;
                const timeCooldown = 15000; // 15 seconds
                const heightCooldown = 500; // 500m
                const now = this.time.now;

                if (this.currentHeight - this.lastPowerupSpawnHeight < heightCooldown || now - this.lastPowerupTime < timeCooldown) {
                    powerupChance = 0;
                }

                if (Phaser.Math.Between(0, 100) < powerupChance) {
                    this.powerups.create(x, this.lastPlatformY - 40, 'powerup_ball');
                    this.lastPowerupSpawnHeight = this.currentHeight;
                    this.lastPowerupTime = now;
                }
                else this.coins.create(x, this.lastPlatformY - 40, 'coin');
            }
        } else {
            let coinX = (Phaser.Math.Between(0, 1) === 0) ? 60 : 340; this.coins.create(coinX, this.lastPlatformY, 'coin');
        }
    }

    spawnMazeRow(y, side, allowMoving, allowSpikes) {
        let blockWidth = Phaser.Math.Between(240, 300); let x = (side === 0) ? 0 : 400; let originX = (side === 0) ? 0 : 1; let gapX = (side === 0) ? blockWidth + (400 - blockWidth) / 2 : (400 - blockWidth) / 2;
        let block = this.mazeWalls.create(x, y, 'maze_block'); block.setOrigin(originX, 0.5).setDisplaySize(blockWidth, 60).refreshBody().setDepth(10);

        // Cooldown en laberinto tambien
        let powerupChance = 5;
        const timeCooldown = 15000;
        const heightCooldown = 500;
        const now = this.time.now;

        if (this.currentHeight - this.lastPowerupSpawnHeight < heightCooldown || now - this.lastPowerupTime < timeCooldown) {
            powerupChance = 0;
        }

        if (Phaser.Math.Between(0, 100) < powerupChance) {
            this.powerups.create(gapX, y - 50, 'powerup_ball');
            this.lastPowerupSpawnHeight = this.currentHeight;
            this.lastPowerupTime = now;
        } else this.coins.create(gapX, y - 50, 'coin');
        if (allowSpikes && Phaser.Math.Between(0, 100) < 50) {
            let enemyX = (side === 0) ? blockWidth / 2 : 400 - (blockWidth / 2);
            let enemy = this.spikeEnemies.get(enemyX, y - 40);
            if (enemy) {
                enemy.spawn(enemyX, y - 40);
                enemy.startMoving(enemyX + 40, 1000);
            }
        }
        if (allowMoving && Phaser.Math.Between(0, 100) < 10) this.spawnPlatform(gapX, y + 10, 90, true);
    }

    spawnPlatform(x, y, width, isMoving) {
        let texture = isMoving ? 'platform_moving' : 'platform';
        let p = this.platforms.create(x, y, texture); p.setDisplaySize(width, 18).refreshBody().setDepth(5);
        if (isMoving) { p.setData('isMoving', true); p.setVelocityX(100); } return p;
    }

    spawnSpike(platform) {
        let ex = platform.x; let ey = platform.y - 20;
        let enemy = this.spikeEnemies.get(ex, ey);
        if (enemy) {
            enemy.spawn(ex, ey);

            if (!platform.getData('isMoving')) {
                let range = (platform.displayWidth / 2) - 10;
                enemy.startMoving(ex + range, 1000);
            } else {
                enemy.body.setVelocityX(platform.body.velocity.x);
            }
        }
    }

    togglePauseMenu() {
        if (this.isGameOver || !this.gameStarted) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Show pause menu and stop everything
            this.physics.pause();
            this.pauseMenuBg.setVisible(true);
            this.pauseMenuTitle.setVisible(true);
            this.continueButton.setVisible(true);
            this.soundToggleButton.setVisible(true);
            this.pauseButton.setText('▶');
        } else {
            // Hide pause menu and resume everything
            this.physics.resume();
            this.pauseMenuBg.setVisible(false);
            this.pauseMenuTitle.setVisible(false);
            this.continueButton.setVisible(false);
            this.soundToggleButton.setVisible(false);
            this.pauseButton.setText('⏸');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;

        if (this.soundEnabled) {
            this.sound.setMute(false);
            this.soundToggleButton.setText('🔊 SONIDO: ON');
        } else {
            this.sound.setMute(true);
            this.soundToggleButton.setText('🔇 SONIDO: OFF');
        }
    }

    startGame() {
        this.gameStarted = true;
        this.uiText.setVisible(false);

        // Start background music
        try {
            if (this.sound && this.cache.audio.exists('bg_music') && !this.bgMusic) {
                this.bgMusic = this.sound.add('bg_music', { loop: true, volume: 0.80 });
                this.bgMusic.play();
            }
        } catch (error) {
            console.warn('Error starting background music:', error);
        }
    }
}
