import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { MAZE_PATTERNS, MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS_HARD, MAZE_PATTERNS_NUMBERED } from '../data/MazePatterns.js';
import { LEVEL_CONFIG } from '../data/LevelConfig.js';
import { enablePlatformRider } from '../utils/platformRider.js';
import { WALLS } from '../config/GameConstants.js';
import { SLOT_CONFIG } from '../config/SlotConfig.js';
import { MAZE_ROW_HEIGHT } from '../data/MazePatterns.js';
import { ENEMY_SIZE, PATROL_SPEED_DEFAULT } from '../prefabs/Enemy.js';
import { PLATFORM_WIDTH } from '../prefabs/Platform.js';

/**
 * LevelManager - LEGACY
 * 
 * Este archivo se mantiene SOLO para:
 * - spawnPlatform() (usa el pool de plataformas)
 * - Spawn de enemigos (cuando se reactive)
 * - Spawn de mazes (cuando se reactive)
 * 
 * La generación de plataformas se movió a PlatformGenerator
 */
export class LevelManager {
    constructor(scene) {
        this.scene = scene;

        // Level Generation State
        this.lastPlatformY = 500; // 🔴 ÚNICA fuente de verdad para generación
        this.lastPlatformX = null;
        this.consecutiveFailedBatches = 0; // Contador de batches fallidos consecutivos
        
        // Maze State
        this.mazeSequenceRemaining = 0;
        this.currentMazePattern = null;
        this.currentMazeRowIndex = 0;
        this.mazeMirrorX = false;
        this.mazeMirrorY = false;
        this.justFinishedMaze = false;
        this.platformsSinceLastMaze = 0;

        // Zone tracking (maze zones vs platform zones)
        this.currentZoneType = 'platform'; // 'platform' or 'maze'
        this.currentZoneStartY = 500;
        this.minZoneHeight = 800; // Minimum height for a zone before switching

        // Platform tracking for collision detection
        this.activePlatforms = []; // Array of {x, y, width, height}

        // Platform generation constants
        this.MIN_PLATFORM_WIDTH = PLATFORM_WIDTH;
        this.ALLOWED_WIDTHS = [PLATFORM_WIDTH];
        this.MIN_VERTICAL_SPACING = 160; // Distancia vertical mínima entre plataformas
        this.MAX_VERTICAL_SPACING = 320; // Distancia vertical máxima entre plataformas
        this.SAME_LINE_EPS = 32; // Evitar plataformas en el mismo nivel
        this.PLATFORM_HEIGHT = SLOT_CONFIG.platformHeight || 32;
        this.SAFE_ZONE_BUFFER = 200; // Extra space before/after maze
        
        // Horizontal movement constraints
        this.maxHorizontalDelta = 300; // Valor fijo por ahora
    }

    /**
     * Establece la plataforma inicial y prepara el chunk manager.
     */
    primeChunkMode(startX, startY, startWidth = 120) {
        this.lastPlatformX = startX;
        this.lastPlatformY = startY;
        this.registerPlatform(startX, startY, startWidth);
    }

    /**
     * Limpia bloques de maze en un rango Y para evitar solapamientos cuando se genera un nuevo maze.
     * @param {number} yTop - Y superior del rango (valor mayor)
     * @param {number} yBottom - Y inferior del rango (valor menor)
     */
    clearMazeWallsInRange(yTop, yBottom) {
        if (!this.scene.mazeWalls) return;
        this.scene.mazeWalls.children.iterate((wall) => {
            if (!wall) return;
            if (wall.y <= yTop && wall.y >= yBottom) {
                wall.destroy();
            }
        });
    }

    /**
     * Check if a platform at given position would overlap with existing platforms
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Platform width
     * @returns {boolean} - True if overlaps, false if safe
     */
    checkPlatformOverlap(x, y, width) {
        const halfWidth = width / 2;
        const halfHeight = this.PLATFORM_HEIGHT / 2;

        for (let platform of this.activePlatforms) {
            // Calculate bounds
            const thisLeft = x - halfWidth;
            const thisRight = x + halfWidth;
            const thisTop = y - halfHeight;
            const thisBottom = y + halfHeight;

            const otherLeft = platform.x - platform.width / 2;
            const otherRight = platform.x + platform.width / 2;
            const otherTop = platform.y - platform.height / 2;
            const otherBottom = platform.y + platform.height / 2;

            // Check for overlap (AABB collision)
            const overlapsX = thisLeft < otherRight && thisRight > otherLeft;
            const overlapsY = thisTop < otherBottom && thisBottom > otherTop;

            if (overlapsX && overlapsY) {
                return true; // Overlap detected
            }
        }

        return false; // No overlap
    }

    /**
     * Check if platform position is valid (not in walls, proper spacing)
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Platform width
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidPlatformPosition(x, y, width) {
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const halfWidth = width / 2;
        
        // Límites ESTRICTOS - deben ser IDÉNTICOS a los de generateNextRow
        const minX = wallWidth + WALLS.MARGIN + halfWidth + 10;
        const maxX = gameWidth - wallWidth - WALLS.MARGIN - halfWidth - 10;

        // Check wall boundaries - validar centro de plataforma
        if (x < minX || x > maxX) {
            console.warn('❌ VALIDACIÓN FALLÓ: Plataforma fuera de límites:', { 
                x: Math.round(x), 
                y: Math.round(y),
                width, 
                minX: Math.round(minX), 
                maxX: Math.round(maxX),
                leftEdge: Math.round(x - halfWidth),
                rightEdge: Math.round(x + halfWidth),
                wallLeft: Math.round(wallWidth + WALLS.MARGIN),
                wallRight: Math.round(gameWidth - wallWidth - WALLS.MARGIN)
            });
            return false;
        }

        // Check vertical spacing - SOLO validar contra plataformas CERCANAS (dentro de 500px)
        // Esto evita que plataformas muy viejas/lejanas interfieran con la validación
        const VALIDATION_RANGE = 500;
        for (const platform of this.activePlatforms) {
            const dy = platform.y - y; // positivo si la nueva está arriba (más negativo)
            const absDy = Math.abs(dy);
            
            // Solo validar si está dentro del rango de validación
            if (absDy > VALIDATION_RANGE) {
                continue; // Plataforma muy lejos, ignorar
            }
            
            // Rechazar si está muy cerca verticalmente (menos de MIN_VERTICAL_SPACING)
            if (absDy < this.MIN_VERTICAL_SPACING) {
                console.warn('❌ VALIDACIÓN FALLÓ: Plataforma muy cerca verticalmente:', { 
                    newY: Math.round(y), 
                    existingY: Math.round(platform.y), 
                    dy: Math.round(dy),
                    absDy: Math.round(absDy),
                    minRequired: this.MIN_VERTICAL_SPACING 
                });
                return false;
            }
        }

        // Check same-line (aprox) - redundante con el check anterior pero más estricto
        const sameLine = this.activePlatforms.some(p => Math.abs(p.y - y) < this.SAME_LINE_EPS);
        if (sameLine) {
            console.warn('❌ VALIDACIÓN FALLÓ: Plataforma en mismo nivel:', { y: Math.round(y) });
            return false;
        }

        // Check overlap with existing platforms (AABB)
        if (this.checkPlatformOverlap(x, y, width)) {
            console.warn('❌ VALIDACIÓN FALLÓ: Plataforma con overlap AABB:', { x: Math.round(x), y: Math.round(y), width });
            return false;
        }

        return true;
    }

    /**
     * Register a platform in the tracking system
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Platform width
     */
    registerPlatform(x, y, width) {
        this.activePlatforms.push({
            x: x,
            y: y,
            width: width,
            height: this.PLATFORM_HEIGHT
        });
    }

    /**
     * Clean up old platforms from tracking (below player)
     * @param {number} limitY - Y position below which to remove platforms
     */
    cleanupPlatformTracking(limitY) {
        const beforeCount = this.activePlatforms.length;
        this.activePlatforms = this.activePlatforms.filter(p => p.y < limitY);
        const afterCount = this.activePlatforms.length;
        
        if (beforeCount !== afterCount) {
            console.log(`🧹 Limpieza: ${beforeCount - afterCount} plataformas removidas, quedan ${afterCount} activas`);
        }
    }

    /**
     * Check if we should switch from platform zone to maze zone
     * @param {number} currentY - Current generation Y position
     * @returns {boolean} - True if should start maze zone
     */
    shouldStartMazeZone(currentY) {
        // Only switch if we've generated enough platform zone
        const zoneHeight = this.currentZoneStartY - currentY;
        return this.currentZoneType === 'platform' &&
            zoneHeight >= this.minZoneHeight &&
            this.platformsSinceLastMaze > 10;
    }

    /**
     * Start a new maze zone (creates safe buffer before maze)
     * @param {number} startY - Y position where maze will start
     */
    startMazeZone(startY) {
        this.currentZoneType = 'maze';
        this.currentZoneStartY = startY;
    }

    /**
     * End maze zone and start platform zone (creates safe buffer after maze)
     * @param {number} startY - Y position where platforms will resume
     */
    endMazeZone(startY) {
        this.currentZoneType = 'platform';
        this.currentZoneStartY = startY;
    }

    /**
     * Genera un grupo de plataformas (batch) con spacing garantizado
     * @param {number} startY - Y inicial del grupo
     * @param {number} count - Número de plataformas en el grupo (default 6)
     * @returns {Array} Array de plataformas generadas exitosamente
     */
    generatePlatformBatch(startY, count = 6) {
        const scene = this.scene;
        const height = scene.currentHeight;
        const config = this.difficultyManager.getConfig(height);
        
        console.log('📦 Generando batch de plataformas:', { startY, count, currentHeight: height });
        
        const generatedPlatforms = [];
        let currentY = startY;
        let platformsGenerated = 0;
        let totalAttempts = 0;
        const maxAttemptsPerPlatform = 5;
        
        // Generar exactamente 'count' plataformas
        while (platformsGenerated < count) {
            let platformSpawned = false;
            let attemptForThisPlatform = 0;
            
            // Calcular la próxima Y (decrementar SOLO una vez por plataforma)
            const dy = Phaser.Math.Between(this.MIN_VERTICAL_SPACING, this.MAX_VERTICAL_SPACING);
            const targetY = currentY - dy;
            
            // Intentar hasta 5 veces encontrar una X válida para esta Y
            while (!platformSpawned && attemptForThisPlatform < maxAttemptsPerPlatform) {
                attemptForThisPlatform++;
                totalAttempts++;
                
                // Seleccionar ancho aleatorio
                const width = Phaser.Utils.Array.GetRandom(this.ALLOWED_WIDTHS);
                const halfWidth = width / 2;
                
                // Calcular límites horizontales ESTRICTOS
                const gameWidth = scene.cameras.main.width;
                const wallWidth = WALLS.WIDTH;
                const centerX = scene.cameras.main.centerX;
                const minX = wallWidth + WALLS.MARGIN + halfWidth + 10;
                const maxX = gameWidth - wallWidth - WALLS.MARGIN - halfWidth - 10;
                
                // Calcular posición X
                let x;
                const lastX = generatedPlatforms.length > 0 ? generatedPlatforms[generatedPlatforms.length - 1].x : this.lastPlatformX;
                
                if (lastX !== null && this.difficultyManager.shouldApplyZigzag(height)) {
                    // Zigzag pattern
                    if (lastX < centerX) {
                        x = Phaser.Math.Between(Math.max(minX, centerX), maxX);
                    } else {
                        x = Phaser.Math.Between(minX, Math.min(maxX, centerX));
                    }
                } else {
                    // Random placement
                    if (lastX === null) {
                        x = Phaser.Math.Between(minX, maxX);
                    } else {
                        const dynamicMinX = Math.max(minX, lastX - this.maxHorizontalDelta);
                        const dynamicMaxX = Math.min(maxX, lastX + this.maxHorizontalDelta);
                        x = Phaser.Math.Between(dynamicMinX, dynamicMaxX);
                    }
                }
                
                // Clamp final ESTRICTO
                x = Phaser.Math.Clamp(x, minX, maxX);
                
                // 🔴 VALIDACIÓN CRÍTICA: Verificar que la posición es válida
                if (!this.isValidPlatformPosition(x, targetY, width)) {
                    console.warn(`  ⚠️ Intento ${attemptForThisPlatform}/${maxAttemptsPerPlatform} para plataforma ${platformsGenerated + 1}: Posición inválida`, { x: Math.round(x), y: Math.round(targetY), width });
                    continue; // Reintentar con nueva X en la MISMA targetY
                }
                
                // Determinar si es móvil
                const isMoving = this.difficultyManager.shouldPlatformMove(height);
                const speed = this.difficultyManager.getMovingPlatformSpeed(height);
                
                // Spawnear plataforma
                const plat = this.spawnPlatform(x, targetY, width, isMoving, speed);
                
                if (plat && plat.active) {
                    // ✅ Plataforma spawneada exitosamente
                    platformSpawned = true;
                    
                    // Registrar INMEDIATAMENTE para que las siguientes validaciones la consideren
                    this.registerPlatform(x, targetY, width);
                    this.lastPlatformY = targetY;
                    this.lastPlatformX = x;
                    this.platformsSinceLastMaze++;
                    
                    generatedPlatforms.push({ x, y: targetY, width, platform: plat });
                    platformsGenerated++;
                    
                    // Actualizar currentY para la PRÓXIMA plataforma
                    currentY = targetY;
                    
                    console.log(`  ✅ Plataforma ${platformsGenerated}/${count}:`, { 
                        x: Math.round(x), 
                        y: Math.round(targetY), 
                        width, 
                        dy,
                        leftEdge: Math.round(x - halfWidth),
                        rightEdge: Math.round(x + halfWidth),
                        attempts: attemptForThisPlatform
                    });
                    
                    // 🔴 TEMPORALMENTE DESACTIVADO: Enemigos y mazes para debug de plataformas
                    const SPAWN_ENEMIES = false;
                    
                    // Spawn coins/enemies en plataformas del batch
                    if (SPAWN_ENEMIES && this.difficultyManager.shouldSpawnEnemy(height)) {
                        const enemyType = this.difficultyManager.getEnemyType(height);
                        if (enemyType === 'patrol') {
                            this.spawnPatrol(plat);
                        } else if (enemyType === 'shooter') {
                            this.spawnShooter(plat);
                        } else {
                            this.spawnJumperShooter(plat);
                        }
                    } else {
                        // Spawn coin
                        const now = scene.time.now;
                        const shouldSpawnPowerup = this.difficultyManager.shouldSpawnPowerup(
                            height,
                            scene.lastPowerupSpawnHeight || 0,
                            scene.lastPowerupTime || 0,
                            now
                        );

                        if (shouldSpawnPowerup) {
                            const powerup = scene.powerups.create(x, targetY - 50, 'powerup_ball');
                            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
                            scene.lastPowerupSpawnHeight = scene.currentHeight;
                            scene.lastPowerupTime = now;
                        } else {
                            let canSpawnCoin = true;
                            scene.coins.children.iterate(c => {
                                if (c.active && Math.abs(c.y - (targetY - 40)) < 80) canSpawnCoin = false;
                            });

                            if (canSpawnCoin && Phaser.Math.Between(0, 100) < 80) {
                                const coin = scene.coins.create(x, targetY - 40, 'coin');
                                enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                            }
                        }
                    }
                } else {
                    console.error(`  ❌ Plataforma falló al spawnear del pool:`, { x, y: targetY, width });
                }
            }
            
            // Si no se pudo spawnear después de maxAttempts, ABORTAR el batch completo
            if (!platformSpawned) {
                console.error(`❌ No se pudo generar plataforma ${platformsGenerated + 1} después de ${maxAttemptsPerPlatform} intentos.`);
                console.error(`   Abortando batch. Plataformas generadas hasta ahora: ${generatedPlatforms.length}`);
                console.error(`   Debug: targetY=${Math.round(targetY)}, activePlatforms=${this.activePlatforms.length}`);
                
                // 🔴 ABORTAR: No avanzar currentY ni contar como generada
                // Esto causará que el batch retorne con menos plataformas
                break; // Salir del while loop
            }
        }
        
        console.log(`✅ Batch completado: ${generatedPlatforms.length}/${count} plataformas generadas en ${totalAttempts} intentos totales`);
        
        return generatedPlatforms;
    }

    spawnPlatform(x, y, width, isMoving, speed = 100) {
        const scene = this.scene;

        // Clamp center X to safe bounds to avoid spawning outside walls
        const halfWidth = width / 2;
        const minCenter = WALLS.WIDTH + WALLS.MARGIN + halfWidth;
        const maxCenter = scene.cameras.main.width - WALLS.WIDTH - WALLS.MARGIN - halfWidth;
        let clampedX = Phaser.Math.Clamp(x, minCenter, maxCenter);
        const verbose = this.scene?.registry?.get('showSlotLogs');
        if (clampedX !== x && verbose) {
            console.warn(`LevelManager: clamping platform center ${x} -> ${clampedX}`);
        }
        x = clampedX;

        // Spawn desde el pool
        const p = scene.platformPool.spawn(x, y, width, isMoving, speed);

        // Asegurar que está en el physics world (ya debería estar por el constructor)
        if (!p.body) {
            scene.physics.add.existing(p);
        }

        // Agregar al grupo legacy para compatibilidad (colisiones, etc.)
        // Phaser groups pueden contener objetos que no fueron creados con group.create()
        if (scene.platforms) {
            scene.platforms.add(p, true); // true = addToScene = false (ya está en la escena)
        }

        this.logPlatformPlacement(p.x, p.y, width, isMoving);

        // Seguridad extra: si por alguna razón quedó fuera de los límites, reubicar al centro seguro
        const leftEdge = p.x - halfWidth;
        const rightEdge = p.x + halfWidth;
        const minEdge = WALLS.WIDTH;
        const maxEdge = scene.cameras.main.width - WALLS.WIDTH;
        if (leftEdge < minEdge || rightEdge > maxEdge) {
            const safeX = Phaser.Math.Clamp(p.x, minCenter, maxCenter);
            p.x = safeX;
            if (p.body) {
                p.body.updateFromGameObject();
                p.body.setVelocityX(isMoving ? p.body.velocity.x : 0);
            }
            if (verbose) {
                console.warn(`LevelManager: repositioned platform to safe center ${safeX} (was ${x})`);
            }
        }
        return p;
    }

    spawnMazeRowFromConfig(y, config, allowMoving, allowSpikes, rowIndex = null, pattern = null, tintColor = null, enemyBudget = null, coinBudget = null) {
        console.log('🧩 spawnMazeRowFromConfig:', { y, type: config.type, rowIndex });
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const centerX = scene.cameras.main.centerX;
        let type = config.type;
        let w1 = config.width;
        let w2 = config.width2 || 0;

        // Handle Horizontal Mirroring
        if (this.mazeMirrorX) {
            if (type === 'left') type = 'right';
            else if (type === 'right') type = 'left';
            else if (type === 'split') {
                let temp = w1; w1 = w2; w2 = temp;
            }
        }

        const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT;

        // Spawn Walls based on type (maze walls are created from screen edges, but items must respect side walls)
        if (type === 'left') {
            let block = scene.mazeWalls.create(0, y, 'maze_block');
            block.setOrigin(0, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10);
            if (tintColor) block.setTint(tintColor);
        } else if (type === 'right') {
            let block = scene.mazeWalls.create(gameWidth, y, 'maze_block');
            block.setOrigin(1, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10);
            if (tintColor) block.setTint(tintColor);
        } else if (type === 'split') {
            let b1 = scene.mazeWalls.create(0, y, 'maze_block');
            b1.setOrigin(0, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10);
            if (tintColor) b1.setTint(tintColor);

            let b2 = scene.mazeWalls.create(gameWidth, y, 'maze_block');
            b2.setOrigin(1, 0.5).setDisplaySize(w2, rowHeight).refreshBody().setDepth(10);
            if (tintColor) b2.setTint(tintColor);
        } else if (type === 'center') {
            let block = scene.mazeWalls.create(centerX, y, 'maze_block');
            block.setOrigin(0.5, 0.5).setDisplaySize(w1, rowHeight).refreshBody().setDepth(10);
            if (tintColor) block.setTint(tintColor);
        }

        // Spawning Items/Enemies - must respect side walls
        let gapX = centerX;
        let gapStart = wallWidth; // Start from left wall
        let gapEnd = gameWidth - wallWidth; // End at right wall

        // Define wall segments for enemy spawning
        let wallSegments = [];

        if (type === 'left') {
            gapStart = Math.max(wallWidth, w1); // Respect left wall
            gapEnd = gameWidth - wallWidth; // Respect right wall
            wallSegments.push({ min: wallWidth, max: Math.min(w1, gameWidth - wallWidth) }); // Wall segment within playable area
        } else if (type === 'right') {
            gapStart = wallWidth; // Respect left wall
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w1); // Respect right wall and maze wall
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w1), max: gameWidth - wallWidth }); // Wall segment within playable area
        } else if (type === 'split') {
            gapStart = Math.max(wallWidth, w1); // Respect left wall
            gapEnd = Math.min(gameWidth - wallWidth, gameWidth - w2); // Respect right wall
            wallSegments.push({ min: wallWidth, max: Math.min(w1, gameWidth - wallWidth) }); // Left wall segment
            wallSegments.push({ min: Math.max(wallWidth, gameWidth - w2), max: gameWidth - wallWidth }); // Right wall segment
        } else if (type === 'center') {
            const leftGapEnd = centerX - w1 / 2;
            const rightGapStart = centerX + w1 / 2;
            const useLeftGap = Phaser.Math.Between(0, 1) === 0;
            gapStart = useLeftGap ? wallWidth : Math.max(wallWidth, rightGapStart); // Respect left wall
            gapEnd = useLeftGap ? Math.min(gameWidth - wallWidth, leftGapEnd) : gameWidth - wallWidth; // Respect right wall
            wallSegments.push({ min: Math.max(wallWidth, leftGapEnd), max: Math.min(gameWidth - wallWidth, rightGapStart) }); // Center wall segment
        }

        if (type !== 'center') {
            gapX = gapStart + (gapEnd - gapStart) / 2;
        } else {
            gapX = gapStart + (gapEnd - gapStart) / 2;
        }

        const gapWidth = Math.max(10, gapEnd - gapStart);
        const gapMargin = Math.min(20, gapWidth * 0.25);
        gapX = Phaser.Math.Clamp(gapX, gapStart + gapMargin, gapEnd - gapMargin);

        // Get Config for current height usando DifficultyManager (fallback seguro)
        const levelConfig = this.difficultyManager
            ? this.difficultyManager.getConfig(scene.currentHeight)
            : (LEVEL_CONFIG.world1?.progression?.[0] || {
                mechanics: { powerups: false, powerupChance: 0 },
                maze: { enemyChance: SLOT_CONFIG?.types?.MAZE?.spawnChances?.enemies ?? 0, enemyCount: { min: 0, max: 2 } }
            });

        // Powerup Logic from Config
        const isDev = scene.registry?.get('isDevMode');
        let powerupChance = levelConfig.mechanics.powerups ? levelConfig.mechanics.powerupChance : 0;
        const timeCooldown = isDev ? 0 : 15000;
        const heightCooldown = isDev ? 0 : 500;
        const now = scene.time.now;

        if (scene.currentHeight - scene.lastPowerupSpawnHeight < heightCooldown || now - scene.lastPowerupTime < timeCooldown) {
            powerupChance = 0;
        }

        if (Phaser.Math.Between(0, 100) < powerupChance) {
            const powerup = scene.powerups.create(gapX, y - 50, 'powerup_ball');
            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
            scene.lastPowerupSpawnHeight = scene.currentHeight;
            scene.lastPowerupTime = now;
        } else {
            // Coins en maze con probabilidad definida en SLOT_CONFIG + bono de maze
            const mazeCoinChance = SLOT_CONFIG?.types?.MAZE?.spawnChances?.coins ?? 0;
            const bonusAvailable = coinBudget && (coinBudget.used < (coinBudget.bonus ?? 0));
            const isDev = scene.registry?.get('isDevMode');
            const chance = isDev ? 1 : mazeCoinChance; // en dev siempre spawnea coin
            if (Phaser.Math.FloatBetween(0, 1) < chance || bonusAvailable) {
                let coin = null;
                if (scene.coinPool) {
                    coin = scene.coinPool.spawn(gapX, y - 50);
                    if (coin && scene.coins) scene.coins.add(coin, true);
                } else if (scene.coins) {
                    coin = scene.coins.create(gapX, y - 50, 'coin');
                }
                if (coin) {
                    enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
                    if (bonusAvailable) {
                        coinBudget.used += 1;
                    }
                }
            }
        }

        // Spawn enemies on WALLS (floors) - with validation
        if (wallSegments.length === 0 || !allowSpikes) {
            return;
        }

        // Enemy Spawning (Patrol Enemies only in maze)
        const mazeSpawnConfig = SLOT_CONFIG?.types?.MAZE?.spawnChances || {};
        const enemyChanceCfg = levelConfig.maze?.enemyChance;
        const enemyCountCfg = levelConfig.maze?.enemyCount ?? mazeSpawnConfig.enemyCount ?? { min: 1, max: 1 };
        const enemyTypes = mazeSpawnConfig.enemyTypes || { patrol: 1 };

        let enemySpawnChance = (enemyChanceCfg !== undefined) ? enemyChanceCfg : (mazeSpawnConfig.enemies ?? 0);
        let maxEnemiesRow = Phaser.Math.Between(enemyCountCfg.min ?? 1, enemyCountCfg.max ?? 1);
        maxEnemiesRow = Math.min(wallSegments.length, maxEnemiesRow);
        if (enemySpawnChance > 0 && maxEnemiesRow < 1) {
            maxEnemiesRow = 1; // asegurar al menos 1 enemigo cuando la chance es > 0
        }

        // SKIP first row (rowIndex === 0) to prevent immediate danger/falling issues
        // Delay enemy spawn to ensure maze walls are fully initialized
        // Row 0 también puede spawnear enemigo; ya tenemos gap central, mantener margen de seguridad en bounds
        // Respeto de presupuesto global por maze
        const mazeBudget = enemyBudget || { target: maxEnemiesRow, spawned: 0 };

        if (rowIndex >= 0 && enemySpawnChance > 0 && mazeBudget.spawned < mazeBudget.target && scene.patrolEnemies.countActive() < maxEnemiesRow) {
            Phaser.Utils.Array.Shuffle(wallSegments);

            scene.time.delayedCall(100, () => {
                const remaining = mazeBudget.target - mazeBudget.spawned;
                const enemiesToSpawn = Math.min(remaining, wallSegments.length);
                for (let i = 0; i < enemiesToSpawn; i++) {
                    let segment = wallSegments[i];

                    if (!segment || !segment.min || !segment.max) continue;

                    let safeMin = segment.min + 20;
                    let safeMax = segment.max - 20;

                    if (safeMax > safeMin + 20) {
                        let enemyX = Phaser.Math.Between(safeMin, safeMax);

                        // Colocar enemigo sobre el bloque del maze (usa altura del bloque)
                        const rowHeight = SLOT_CONFIG?.types?.MAZE?.rowHeight || MAZE_ROW_HEIGHT || 60;
                        const enemyHalfHeight = ENEMY_SIZE / 2;
                        const platformTop = y - rowHeight / 2;
                        const enemyY = platformTop - enemyHalfHeight;

                        // Usar PoolManager
                        // Seleccionar tipo de enemigo
                        const rType = Math.random();
                        const usePatrol = rType < (enemyTypes.patrol ?? 1);
                        if (usePatrol) {
                            const enemy = scene.patrolEnemyPool.spawn(enemyX, enemyY);
                            if (scene.patrolEnemies) scene.patrolEnemies.add(enemy, true);
                            if (enemy && enemy.active && enemy.setPatrolBounds) {
                                const margin = 6;
                                const minBound = safeMin + margin;
                                const maxBound = safeMax - margin;
                                if (minBound < maxBound) {
                                    enemy.setPatrolBounds(minBound, maxBound, PATROL_SPEED_DEFAULT);
                                    enemy.patrol(minBound, maxBound, PATROL_SPEED_DEFAULT);
                                }
                            }
                        } else {
                            const shooter = scene.shooterEnemyPool.spawn(enemyX, enemyY);
                            if (scene.shooterEnemies) scene.shooterEnemies.add(shooter, true);
                            const projectilesGroup = scene.projectilePool || scene.projectiles;
                            if (shooter?.startShooting) shooter.startShooting(projectilesGroup, scene.currentHeight);
                        }

                        mazeBudget.spawned += 1;
                        if (mazeBudget.spawned >= mazeBudget.target) {
                            break;
                        }
                    }
                }
            });
        }
    }

    spawnPatrol(platform) {
        const scene = this.scene;
        if (platform && platform.active === false) return;
        
        // Posición X: centro de la plataforma
        const ex = platform?.x ?? scene.cameras.main.centerX;
        
        // Posición Y: directamente sobre la plataforma
        // platform.y es el CENTRO de la plataforma (altura configurable)
        const platformHalfHeight = (SLOT_CONFIG.platformHeight || 32) / 2;
        const platformTop = platform.y - platformHalfHeight;  // Top de la plataforma
        const enemyHalfHeight = 16;  // Mitad de altura del enemigo (32/2)
        const ey = platformTop - enemyHalfHeight + 1;  // Centro del enemigo (1px más abajo para asegurar contacto)
        
        // Verificar que la posición sea válida
        if (!isFinite(ey) || isNaN(ey)) {
            console.error(`  ❌ ERROR: Posición Y inválida para enemigo: ${ey}`);
            return null;
        }
        
        console.log(`  🎯 SpawnPatrol: platform.y=${platform.y.toFixed(0)}, platformTop=${platformTop.toFixed(0)}, enemy.y=${ey.toFixed(0)}, enemy.bottom=${(ey + enemyHalfHeight).toFixed(0)}`);

        const enemy = scene.patrolEnemyPool.spawn(ex, ey);
        if (enemy) {
            // Configurar límites de patrulla
            const platformHalfWidth = 64; // 128/2
            const enemyHalfWidth = 16;
            const margin = 4;
            const minX = ex - platformHalfWidth + enemyHalfWidth + margin;
            const maxX = ex + platformHalfWidth - enemyHalfWidth - margin;
            enemy.setPatrolBounds(minX, maxX, 60);

            // Verificar que el enemigo tenga body antes de agregarlo
            if (!enemy.body) {
                console.error(`  ❌ ERROR: Enemy no tiene body después del spawn`);
                return null;
            }
            
            // Agregar al grupo de física
            if (scene.patrolEnemies) {
                scene.patrolEnemies.add(enemy, true);
                console.log(`  ✅ Enemy agregado al grupo patrolEnemies, total: ${scene.patrolEnemies.getLength()}, enemy.body.allowGravity=${enemy.body.allowGravity}, enemy.body.immovable=${enemy.body.immovable}`);
            } else {
                console.error(`  ❌ ERROR: scene.patrolEnemies no existe`);
            }
            
            // Verificar que el enemigo esté en el mundo de física
            if (!enemy.scene || !enemy.scene.physics) {
                console.error(`  ❌ ERROR: Enemy no está en un scene con physics`);
            }

            // Iniciar patrulla si ya está activo
            enemy.patrolBehavior.startPatrol(minX, maxX, 60);
        } else {
            console.error(`  ❌ ERROR: Enemy es null después del spawn`);
        }
        
        return enemy;
    }

    spawnShooter(platform) {
        const scene = this.scene;
        try {
            const ex = platform?.x ?? scene.cameras.main.centerX;
            const platY = platform?.y ?? scene.cameras.main.scrollY;
            const platHalfH = (SLOT_CONFIG.platformHeight || 32) / 2;
            const enemyHalfH = 16; // shooter size 32
            const ey = platY - platHalfH - enemyHalfH + 1;

            const shooter = scene.shooterEnemyPool.spawn(ex, ey);
            if (scene.shooterEnemies) {
                scene.shooterEnemies.add(shooter, true);
            }
            const projectilesGroup = scene.projectilePool || scene.projectiles;
            if (shooter?.startShooting) {
                shooter.startShooting(projectilesGroup, scene.currentHeight);
            }
            return shooter;
        } catch (e) {
            console.warn('Error spawning shooter:', e);
        }
    }

    spawnJumperShooter(platform) {
        const scene = this.scene;
        if (platform?.getData && platform.getData('isMoving')) {
            this.spawnPatrol(platform);
            return;
        }
        try {
            const ex = platform?.x ?? scene.cameras.main.centerX;
            const ey = (platform?.y ?? scene.cameras.main.scrollY) - 50;

            const jumper = scene.jumperShooterEnemyPool.spawn(ex, ey);
            if (scene.jumperShooterEnemies) {
                scene.jumperShooterEnemies.add(jumper, true);
            }
            const projectilesGroup = scene.projectilePool || scene.projectiles;
            jumper.startBehavior(projectilesGroup);
            return jumper;
        } catch (e) {
            console.warn('Error spawning jumper shooter:', e);
        }
    }

    /**
     * Cleanup de objetos viejos (plataformas, enemigos, coins, etc.)
     */
    cleanupOnly() {
        const scene = this.scene;
        const limitY = scene.player.y + 900;
        
        // Cleanup plataformas
        const platformsToRemove = scene.platformPool
            .getActive()
            .filter(p => p.y > limitY);
        platformsToRemove.forEach(p => {
            if (scene.platforms) scene.platforms.remove(p);
            scene.platformPool.despawn(p);
        });
        
        // Cleanup enemigos
        const patrolEnemiesToRemove = scene.patrolEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        patrolEnemiesToRemove.forEach(e => {
            if (scene.patrolEnemies) scene.patrolEnemies.remove(e);
            scene.patrolEnemyPool.despawn(e);
        });
        
        const shooterEnemiesToRemove = scene.shooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        shooterEnemiesToRemove.forEach(e => {
            if (scene.shooterEnemies) scene.shooterEnemies.remove(e);
            scene.shooterEnemyPool.despawn(e);
        });
        
        const jumperEnemiesToRemove = scene.jumperShooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        jumperEnemiesToRemove.forEach(e => {
            if (scene.jumperShooterEnemies) scene.jumperShooterEnemies.remove(e);
            scene.jumperShooterEnemyPool.despawn(e);
        });
        
        // Cleanup coins
        scene.coins.children.each(coin => {
            if (coin.active && coin.y > limitY) {
                if (scene.coinPool) scene.coinPool.despawn(coin);
                else coin.destroy();
            }
        });
        
        // Cleanup maze walls (son estáticos, se destruyen cuando quedan muy abajo)
        if (scene.mazeWalls) {
            scene.mazeWalls.children.each(wall => {
                if (wall.active && wall.y > limitY) {
                    wall.destroy();
                }
            });
        }
        
        // Cleanup powerups
        scene.powerups.children.each(powerup => {
            if (powerup.active && powerup.y > limitY) {
                if (scene.powerupPool) scene.powerupPool.despawn(powerup);
                else powerup.destroy();
            }
        });

        // Opcional: podar pools para reducir memoria tras un cleanup grande
        const trimInactive = (pool, keep = 5) => {
            if (pool?.trim) {
                pool.trim(keep);
            }
        };
        // Mantener algunos objetos disponibles pero sin ser agresivos para evitar vaciar el pool en runs largos
        trimInactive(scene.platformPool, 30);
        trimInactive(scene.patrolEnemyPool, 20);
        trimInactive(scene.shooterEnemyPool, 15);
        trimInactive(scene.jumperShooterEnemyPool, 15);
        trimInactive(scene.coinPool, 40);
        trimInactive(scene.powerupPool, 20);
        trimInactive(scene.projectilePool, 40);
    }

    /**
     * ⚠️ DESHABILITADO - Este método ya no se usa
     * La generación de plataformas se movió a PlatformGenerator
     * 
     * Este método se mantiene solo como referencia legacy
     */
    update() {
        // 🔴 SOLO HACER CLEANUP, NO GENERAR PLATAFORMAS
        return this.cleanupOnly();
        
        // 🔴 CRÍTICO: Limpiar plataformas viejas ANTES de generar nuevas
        // Esto asegura que activePlatforms esté limpio para validación
        const limitY = scene.player.y + 900;
        this.cleanupPlatformTracking(limitY);
        
        // Generación por batches: genera grupos de 6 plataformas
        const spawnThreshold = scene.cameras.main.scrollY - 800; // 800px por delante de cámara
        
        // 🔍 DEBUG: Log cada 60 frames (1 segundo aprox)
        if (scene.game.getFrame() % 60 === 0) {
            console.log('🔍 LevelManager.update() - Estado:', {
                playerHeight: Math.round(playerHeight),
                cameraY: Math.round(scene.cameras.main.scrollY),
                spawnThreshold: Math.round(spawnThreshold),
                lastPlatformY: Math.round(this.lastPlatformY),
                gap: Math.round(this.lastPlatformY - spawnThreshold),
                activePlatforms: this.activePlatforms.length,
                poolActive: scene.platformPool.getActive().length
            });
        }
        
        // 🔴 SIMPLIFICADO: Generar SOLO 1 batch por frame para evitar corrupción
        // Usar SOLO lastPlatformY como referencia única de verdad
        
        // Si lastPlatformY está por encima (más positivo) del threshold, generar más
        if (this.lastPlatformY > spawnThreshold) {
            console.log(`📦 Generando batch:`, { 
                lastPlatformY: Math.round(this.lastPlatformY),
                threshold: Math.round(spawnThreshold), 
                gap: Math.round(this.lastPlatformY - spawnThreshold),
                cameraY: Math.round(scene.cameras.main.scrollY),
                playerHeight: Math.round(playerHeight),
                activePlatforms: this.activePlatforms.length,
                consecutiveFailures: this.consecutiveFailedBatches
            });
            
            const startY = this.lastPlatformY;
            const batch = this.generatePlatformBatch(startY, 6);
            
            if (batch.length === 0) {
                this.consecutiveFailedBatches++;
                console.error(`❌ Batch no generó plataformas (fallo ${this.consecutiveFailedBatches} consecutivo)`);
                console.error(`   Debugging: lastPlatformY=${Math.round(this.lastPlatformY)}, activePlatforms=${this.activePlatforms.length}`);
                
                // 🔴 NO FORZAR AVANCE - esto causa plataformas en paredes
                // En su lugar, solo loguear y esperar al siguiente frame
            } else {
                this.consecutiveFailedBatches = 0; // Reset contador en éxito
                console.log(`✅ Batch completado: ${batch.length} plataformas, nueva lastPlatformY: ${Math.round(this.lastPlatformY)}`);
            }
        } else {
            // Ya tenemos suficiente contenido generado
            if (scene.game.getFrame() % 120 === 0) {
                console.log('✅ Suficiente contenido generado');
            }
        }

        // Cleanup plataformas usando PoolManager (despawn en lugar de destroy)
        // Nota: cleanupPlatformTracking ya se hizo al inicio del update()
        const platformsToRemove = scene.platformPool
            .getActive()
            .filter(p => p.y > limitY);

        platformsToRemove.forEach(p => {
            // Remover del grupo legacy
            if (scene.platforms) {
                scene.platforms.remove(p);
            }
            // Despawn al pool
            scene.platformPool.despawn(p);
        });

        // Cleanup enemigos usando PoolManager
        const patrolEnemiesToRemove = scene.patrolEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        patrolEnemiesToRemove.forEach(e => {
            if (scene.patrolEnemies) scene.patrolEnemies.remove(e);
            scene.patrolEnemyPool.despawn(e);
        });

        const shooterEnemiesToRemove = scene.shooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        shooterEnemiesToRemove.forEach(e => {
            if (scene.shooterEnemies) scene.shooterEnemies.remove(e);
            scene.shooterEnemyPool.despawn(e);
        });

        const jumperEnemiesToRemove = scene.jumperShooterEnemyPool
            .getActive()
            .filter(e => e.y > limitY);
        jumperEnemiesToRemove.forEach(e => {
            if (scene.jumperShooterEnemies) scene.jumperShooterEnemies.remove(e);
            scene.jumperShooterEnemyPool.despawn(e);
        });

        // Cleanup proyectiles usando PoolManager
        const projectilesToRemove = scene.projectilePool
            .getActive()
            .filter(p => p.y > limitY || p.x < -50 || p.x > scene.cameras.main.width + 50);
        projectilesToRemove.forEach(p => {
            if (scene.projectiles) scene.projectiles.remove(p);
            scene.projectilePool.despawn(p);
        });

        // Cleanup otros objetos (aún no tienen pooling)
        scene.coins.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.powerups.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
        scene.mazeWalls.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });

        // Update moving platforms (legacy safety)
        if (scene.platforms) {
            const gameWidth = scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;
            const minPlatformX = wallWidth + WALLS.PLATFORM_MARGIN;
            const maxPlatformX = gameWidth - wallWidth - WALLS.PLATFORM_MARGIN;

            scene.platforms.children.iterate((plat) => {
                if (plat && plat.active && plat.getData('isMoving')) {
                    let speed = plat.getData('speed') || 100;
                    if (plat.x < minPlatformX) plat.setVelocityX(speed);
                    else if (plat.x > maxPlatformX) plat.setVelocityX(-speed);
                }
            });
        }
    }

    logPlatformPlacement(x, y, width, isMoving) {
        const scene = this.scene;
        const minX = WALLS.WIDTH + WALLS.MARGIN;
        const maxX = scene.cameras.main.width - WALLS.WIDTH - WALLS.MARGIN;
        const halfWidth = width / 2;

        // Check walls overflow
        if (x - halfWidth < minX || x + halfWidth > maxX) {
            if (this.scene?.registry?.get('showSlotLogs')) {
                console.warn('LevelManager: platform spawned outside wall bounds', { x, width, minX, maxX });
            }
        }

        // Check overlap with coins/powerups (should ride platforms, not be inside)
        this.checkItemOverlap(scene.coins, x, y, width, this.PLATFORM_HEIGHT, 'coin', isMoving);
        this.checkItemOverlap(scene.powerups, x, y, width, this.PLATFORM_HEIGHT, 'powerup', isMoving);
    }

    checkItemOverlap(group, platX, platY, width, height, label, isMoving) {
        if (!group || !group.children || typeof group.children.iterate !== 'function') return;

        const halfW = width / 2;
        const halfH = height / 2;
        const left = platX - halfW;
        const right = platX + halfW;
        const top = platY - halfH;
        const bottom = platY + halfH;

        group.children.iterate((item) => {
            if (!item || !item.active) return;
            const ix = item.x || 0;
            const iy = item.y || 0;
            const overlaps = ix >= left && ix <= right && iy >= top && iy <= bottom;
            if (overlaps) {
                console.warn('LevelManager: platform overlapping item', { type: label, isMoving, platX, platY, itemX: ix, itemY: iy });
            }
        });
    }
}
