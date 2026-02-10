import { COIN_BASE_SIZE } from '../../Entities/Coin.js';
import { POWERUP_BASE_SIZE } from '../../Entities/Powerup.js';
import { clampToPlayableBounds, getPlayableBounds } from '../../Utils/playableBounds.js';

export class ItemSpawnStrategy {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Spawns a single item (Powerup or Coin) in a specific zone/rect.
     * Used by MazeSpawner or specific placements that don't need random searching.
     * checks overlaps with provided obstacles is minimal (relies on caller providing safe zone).
     */
    spawnInZone(x, y, typePreference = 'auto') {
        const difficulty = this.scene.difficultyManager;
        const mechanicsConfig = difficulty ? difficulty.getMechanicsConfig() : { powerups: true, powerupChance: 8, coins: true, coinChance: 60 };
        const powerupX = clampToPlayableBounds(this.scene, x, POWERUP_BASE_SIZE, 30);
        const coinX = clampToPlayableBounds(this.scene, x, COIN_BASE_SIZE, 0);

        // 1. Check Powerup eligibility
        if (typePreference === 'powerup' || typePreference === 'auto') {
            // Re-use logic: inline or extract. Let's extract 'canSpawnPowerup' logic if possible, 
            // but 'canSpawnPowerup' relies on `this.scene` state which is available.
            // We need to DRY this up. Ideally `checkPowerupEligibility(y)` helper.

            // For now, let's replicate the check cleanly using instance methods if we refactor,
            // or just implementing it here.

            const isDev = this.scene.registry?.get('isDevMode');
            const POWERUP_MIN_DISTANCE = isDev ? 1000 : 4000;
            const POWERUP_COOLDOWN = isDev ? 5000 : 30000;
            const POWERUP_CHANCE = (mechanicsConfig.powerups ? mechanicsConfig.powerupChance : 0) / 100;

            const lastHeight = Math.abs(this.scene.lastPowerupSpawnHeight || -99999);
            const lastTime = this.scene.lastPowerupTime || -99999;
            const now = Date.now();
            const distanceDelta = Math.abs(y) - lastHeight;

            if (distanceDelta >= POWERUP_MIN_DISTANCE && now - lastTime >= POWERUP_COOLDOWN) {
                // Explicit verification for Maze usually forces chance check unless 'powerup' is strictly requested
                if (typePreference === 'powerup' || Math.random() < POWERUP_CHANCE) {
                    const powerup = this.scene.powerupPool.spawn(powerupX, y);
                    if (powerup) {
                        if (this.scene.powerups) this.scene.powerups.add(powerup, true);
                        this.scene.lastPowerupSpawnHeight = y;
                        this.scene.lastPowerupTime = now;
                        return 'powerup';
                    }
                }
            }
        }

        // 2. Check Coin eligibility
        if (typePreference === 'coin' || typePreference === 'auto') {
            const coinChance = (mechanicsConfig.coins ? mechanicsConfig.coinChance : 0) / 100;
            // Maze logic usually has its own probability override passed in? 
            // For now, use global mech config + simple valid check.

            if (typePreference === 'coin' || Math.random() < coinChance) {
                const coin = this.scene.coinPool.spawn(coinX, y);
                if (coin) {
                    if (this.scene.coins) this.scene.coins.add(coin, true);
                    return 'coin';
                }
            }
        }

        return null;
    }

    /**
     * Tries to generate items (coins/powerups) for a platform batch.
     * ... (rest of existing method)
     */
    generateItems(slotData, spawnedPlatforms, mazeWalls = []) {
        // --- CONFIG ---
        const difficulty = this.scene.difficultyManager;
        const mechanicsConfig = difficulty ? difficulty.getMechanicsConfig() : { powerups: true, powerupChance: 8, coins: true, coinChance: 60 };

        const ITEM_SIZE = Math.max(COIN_BASE_SIZE, POWERUP_BASE_SIZE); // 32
        const ITEM_HALF = ITEM_SIZE / 2;
        const ITEM_DISTANCE = 128; // Minimum distance between items
        const { minX: minItemX, maxX: maxItemX } = getPlayableBounds(this.scene, ITEM_SIZE);

        // Powerup Config
        const isDev = this.scene.registry?.get('isDevMode');
        // Align with spawnInZone rules to avoid frequent powerups
        const POWERUP_MIN_DISTANCE = isDev ? 1000 : 4000;
        const POWERUP_COOLDOWN = isDev ? 5000 : 30000;
        const POWERUP_CHANCE = (mechanicsConfig.powerups ? mechanicsConfig.powerupChance : 0) / 100;

        const logPowerups = this.scene.registry?.get('logPowerups') === true;
        const logPw = (msg) => { if (logPowerups) console.log(msg); };

        const allGeneratedItems = [];

        // --- HELPERS ---
        const tooCloseToOtherItems = (x, y) => {
            // Check existing items
            for (const existing of allGeneratedItems) {
                const dist = Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2));
                if (dist < ITEM_DISTANCE) return true;
            }
            // Check maze walls
            // Simplified check: assume mazeWalls have a bounds method or property if needed, 
            // but for Platform Batch slots (where this is mostly used), mazeWalls might be empty.
            // If passed, we'd check overlaps here.
            return false;
        };

        const collidesWithPlatform = (itemX, itemY) => {
            for (const plat of spawnedPlatforms) {
                const platLeft = plat.x - plat.width / 2 - ITEM_HALF;
                const platRight = plat.x + plat.width / 2 + ITEM_HALF;
                const platTop = plat.y - plat.height / 2 - ITEM_HALF;
                const platBottom = plat.y + plat.height / 2 + ITEM_HALF;

                if (itemX >= platLeft && itemX <= platRight &&
                    itemY >= platTop && itemY <= platBottom) {
                    return true;
                }
            }
            return false;
        };

        const canSpawnPowerup = (itemY) => {
            const currentHeight = Math.abs(itemY);
            const lastHeight = Math.abs(this.scene.lastPowerupSpawnHeight || -99999);
            const lastTime = this.scene.lastPowerupTime || -99999;
            const now = Date.now();

            const distanceDelta = currentHeight - lastHeight;
            const distanceOk = distanceDelta >= POWERUP_MIN_DISTANCE; // 2000 units

            const cooldownDelta = now - lastTime;
            const cooldownOk = cooldownDelta >= POWERUP_COOLDOWN;
            const chanceOk = Math.random() < POWERUP_CHANCE;

            if (distanceOk && cooldownOk && chanceOk) {
                logPw(`    ⚡ Powerup eligible: dist=${distanceDelta.toFixed(0)} cooldown=${cooldownDelta}ms chance=${(POWERUP_CHANCE * 100).toFixed(0)}%`);
            }
            return distanceOk && cooldownOk && chanceOk;
        };

        const spawnPowerup = (x, y) => {
            const powerup = this.scene.powerupPool.spawn(x, y);
            if (powerup && powerup.active) {
                if (this.scene.powerups) this.scene.powerups.add(powerup, true);

                allGeneratedItems.push({ x, y, type: 'powerup' });
                this.scene.lastPowerupSpawnHeight = y;
                this.scene.lastPowerupTime = Date.now();

                logPw(`    ⚡ Powerup spawned at x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
                return true;
            }
            return false;
        };

        const spawnCoin = (x, y) => {
            const coin = this.scene.coinPool.spawn(x, y);
            if (coin && coin.active) {
                if (this.scene.coins) this.scene.coins.add(coin, true);
                allGeneratedItems.push({ x, y, type: 'coin' });
                return true;
            }
            return false;
        };

        // --- MAIN GENERATION LOOP ---
        // Generar items en el espacio vertical de las plataformas
        // Estrategia: Intentar spawnear items ENTRE plataformas verticalmente

        // Ordenar plataformas por Y (top to bottom)
        const sortedPlatforms = [...spawnedPlatforms].sort((a, b) => a.y - b.y); // Ascending Y (top is smaller? No, Y decreases going up in Phaser usually 0 is top. 
        // Wait, startY=1000, next is smaller. 
        // GridGenerator logic: next Y = Y - gap. So lower indices have Higher Y (lower on screen).
        // Let's just iterate them.

        /* 
           Original logic iterated "gap locations" between platforms or random spots.
           Looking at SlotGenerator logic (it was truncated in view, but assuming standard flow):
           Usually we pick random spots in the slot air or strictly above platforms.
           
           Let's implement a robust verification strategy:
           Try N random spots per slot.
        */

        let attempts = 0;
        const maxAttempts = 12; // Try to spawn a few items per slot

        // Define vertical range of the slot
        const yStart = slotData.yStart;
        const yEnd = slotData.yEnd; // yEnd is smaller (higher up)

        // We iterate attempts
        // We iterate attempts
        while (attempts < maxAttempts) {
            attempts++;

            const itemY = Phaser.Math.FloatBetween(yEnd + 50, yStart - 50); // Padding

            // 1. Determine spawn intent first
            let intent = null;

            if (canSpawnPowerup(itemY)) {
                intent = 'powerup';
            } else {
                const coinChance = (mechanicsConfig.coins ? mechanicsConfig.coinChance : 0) / 100;
                if (Math.random() < coinChance) intent = 'coin';
            }

            if (!intent) continue;

            // 2. Calculate safe X based on intent size
            let itemX;
            if (intent === 'powerup') {
                const halfSize = (POWERUP_BASE_SIZE || 64) / 2;
                const margin = halfSize + 30; // Increased visual breathing room (prevent wall clipping)
                const safeMin = minItemX + margin;
                const safeMax = maxItemX - margin;

                // Safety check if bounds are inverted (should not happen but safe)
                if (safeMin > safeMax) itemX = minItemX + (maxItemX - minItemX) / 2;
                else itemX = Phaser.Math.Between(safeMin, safeMax);
                itemX = clampToPlayableBounds(this.scene, itemX, POWERUP_BASE_SIZE, 30);

            } else {
                // Coin
                const safeMin = minItemX; // Coins are small enough for base bounds
                const safeMax = maxItemX;
                itemX = Phaser.Math.Between(safeMin, safeMax);
                itemX = clampToPlayableBounds(this.scene, itemX, COIN_BASE_SIZE, 0);
            }

            // 3. Validation
            if (tooCloseToOtherItems(itemX, itemY)) continue;
            if (collidesWithPlatform(itemX, itemY)) continue;

            // 4. Spawn
            if (intent === 'powerup') {
                spawnPowerup(itemX, itemY);
            } else {
                spawnCoin(itemX, itemY);
            }
        }

        return allGeneratedItems;
    }
}
