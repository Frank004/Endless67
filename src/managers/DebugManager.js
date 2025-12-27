import DebugRuler from './DebugRuler.js';

export class DebugManager {
    constructor(scene) {
        this.scene = scene;
        // DEBUG SETTINGS
        this.debugStartHeight = 0; // Set to > 0 to start at that height
        this.enableTestEnemies = false; // Set to true to spawn test enemies
        this.enableLavaDelay = false; // Give player time to react at start
        
        // PLAYER SPRITE TOGGLE
        // true = usar PNG placeholder (assets/images/player_32x32.png)
        // false = usar placeholder generado programáticamente
        this.usePlayerPNG = false; // Cambiar a false para usar placeholder generado
        
        // PLAYER HITBOX VISUAL DEBUG
        // true = mostrar hitbox rosa del player
        // false = ocultar hitbox
        this.showPlayerHitbox = false; // Cambiar a false para ocultar hitbox

        // Ruler overlay
        this.rulerEnabled = true;
        this.ruler = null;
    }

    applyDebugSettings() {
        const scene = this.scene;

        // Apply Height Offset
        if (this.debugStartHeight > 0) {
            scene.heightOffset = this.debugStartHeight;
            scene.currentHeight = this.debugStartHeight;
        }

        // Apply Lava Delay
        if (this.enableLavaDelay && scene.riserManager && scene.riserManager.riser) {
            // Move lava further down (e.g., 1500px below player instead of 500px)
            // This gives the player a few seconds while the lava catches up
            scene.riserManager.riser.y = scene.player.y + 1500;
        }

        // Spawn Test Enemies if enabled
        if (this.enableTestEnemies) {
            this.spawnTestEnemies();
        }
        
        // Setup Player Hitbox Visual Debug
        if (this.showPlayerHitbox && scene.player) {
            this.setupPlayerHitboxVisual(scene.player);
        }

        // Setup Ruler
        if (this.rulerEnabled) {
            this.ensureRuler();
            this.ruler.setEnabled(true);
        }
    }
    
    setupPlayerHitboxVisual(player) {
        const scene = this.scene;
        
        // Crear gráfico para el hitbox visual
        const hitboxGraphics = scene.add.graphics();
        hitboxGraphics.setDepth(1000); // Por encima del player (depth 20)
        
        // Función para actualizar el hitbox visual
        const updateHitbox = () => {
            if (!player || !player.active || !player.body) {
                hitboxGraphics.clear();
                return;
            }
            
            hitboxGraphics.clear();
            
            // Dibujar el hitbox del body de física en color rosa
            const body = player.body;
            const x = body.x;
            const y = body.y;
            const width = body.width;
            const height = body.height;
            
            // Color rosa/rosa (#FF69B4 o similar)
            hitboxGraphics.lineStyle(2, 0xFF69B4, 1); // Rosa brillante, 2px de grosor
            hitboxGraphics.strokeRect(x, y, width, height);
            
            // Opcional: relleno semi-transparente para mejor visibilidad
            hitboxGraphics.fillStyle(0xFF69B4, 0.2); // Rosa con 20% de opacidad
            hitboxGraphics.fillRect(x, y, width, height);
            
            // Dibujar el tamaño del sprite visual también (opcional, en otro color)
            const spriteX = player.x - (player.width / 2);
            const spriteY = player.y - (player.height / 2);
            hitboxGraphics.lineStyle(1, 0x00FFFF, 0.5); // Cian para el sprite visual
            hitboxGraphics.strokeRect(spriteX, spriteY, player.width, player.height);
        };
        
        // Guardar referencia para actualizar en el update loop
        this.playerHitboxGraphics = hitboxGraphics;
        this.updateHitboxCallback = updateHitbox;
        
        // Actualizar inmediatamente
        updateHitbox();
    }
    
    updateHitboxVisual() {
        if (this.showPlayerHitbox && this.updateHitboxCallback && this.scene.player) {
            this.updateHitboxCallback();
        } else if (this.playerHitboxGraphics) {
            this.playerHitboxGraphics.clear();
        }
    }
    
    togglePlayerHitbox(show) {
        this.showPlayerHitbox = show;
        const scene = this.scene;
        
        if (show && scene.player && !this.playerHitboxGraphics) {
            this.setupPlayerHitboxVisual(scene.player);
        } else if (!show && this.playerHitboxGraphics) {
            this.playerHitboxGraphics.destroy();
            if (this.updateHitboxCallback) {
                scene.events.off('update', this.updateHitboxCallback);
            }
            this.playerHitboxGraphics = null;
            this.updateHitboxCallback = null;
        }
    }

    spawnTestEnemies() {
        const scene = this.scene;
        const levelManager = scene.levelManager;

        // Start generating much higher to leave room for test enemies
        levelManager.lastPlatformY = -500;

        let platforms = [];
        let attempts = 0;

        // Generate rows until we have at least 3 platforms
        while (platforms.length < 3 && attempts < 10) {
            // We need generateNextRow to return the platform it created.
            // Currently LevelManager.generateNextRow returns 'null' or doesn't return the platform explicitly 
            // if it spawns a coin or gap.
            // We might need to modify LevelManager or just inspect the group.

            let initialCount = scene.platforms.getLength();
            levelManager.generateNextRow();
            let newCount = scene.platforms.getLength();

            if (newCount > initialCount) {
                // A platform was added
                platforms.push(scene.platforms.getLast(true));
            }
            attempts++;
        }

        // --- TEST ENEMIES ---
        // Spawn enemies on the generated platforms
        if (platforms.length > 0) {
            // Jumper Shooter Enemy (Closest to player)
            levelManager.spawnJumperShooter(platforms[0]);
        }

        if (platforms.length > 1) {
            // Shooter Enemy (Middle)
            levelManager.spawnShooter(platforms[1]);
        }

        if (platforms.length > 2) {
            // Spike Enemy (Highest)
            levelManager.spawnSpike(platforms[2]);
        }
    }

    ensureRuler() {
        if (!this.ruler) {
            this.ruler = new DebugRuler(this.scene);
        }
        return this.ruler;
    }

    updateRuler() {
        if (!this.rulerEnabled) return;
        const ruler = this.ensureRuler();
        ruler.update(this.scene.platforms?.getChildren?.() || [], this.scene.player);
    }

    toggleRuler(force = null) {
        this.rulerEnabled = force !== null ? force : !this.rulerEnabled;
        const ruler = this.ensureRuler();
        ruler.setEnabled(this.rulerEnabled);
        console.log(`[DebugRuler] ${this.rulerEnabled ? 'ON' : 'OFF'}`);
    }
}
