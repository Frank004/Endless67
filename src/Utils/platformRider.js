/**
 * Platform Rider System
 * 
 * Provides reusable platform-riding behavior for any sprite.
 * Supports two modes:
 * - 'patrol': Objects that walk/patrol on platforms (enemies)
 * - 'carry': Objects that are carried by platforms (coins, powerups)
 */

/**
 * Enable platform riding behavior on a sprite
 * @param {Phaser.Physics.Arcade.Sprite} sprite - The sprite to enable riding on
 * @param {Object} options - Configuration options
 * @param {string} options.mode - 'carry' (static), 'bound' (own logic), or 'patrol' (auto)
 * @param {number} options.marginX - Horizontal margin from platform edges
 * @param {boolean} options.autoPatrol - Enable automatic patrol (only for 'patrol' mode)
 * @param {number} options.patrolSpeed - Speed for auto-patrol mode
 */
export function enablePlatformRider(sprite, options = {}) {
    sprite.isPlatformRider = true;

    // Mode: how it behaves on platform
    // 'carry' = only dragged by platform (shooters, coins)
    // 'bound' = only has bounds, handles own movement (patrol enemies, jumpers)
    // 'patrol' = auto-patrol (only if autoPatrol is true)
    sprite.riderMode = options.mode || 'carry';
    sprite.riderMarginX = options.marginX ?? 2;

    // Auto-patrol only if explicitly enabled
    sprite.riderAutoPatrol = options.autoPatrol ?? false;
    sprite.riderPatrolSpeed = options.patrolSpeed ?? 60;

    sprite.ridingPlatform = null;
    sprite.riderDir = 1; // 1 = right, -1 = left

    // Disable world bounds collision (we handle platform bounds manually)
    if (sprite.body) {
        sprite.body.setCollideWorldBounds(false);
    }
}

/**
 * Handle collision between a rider and a platform
 * Call this from your collision handler
 * @param {Phaser.Physics.Arcade.Sprite} rider - The riding sprite
 * @param {Phaser.Physics.Arcade.Sprite} platform - The platform
 */
export function handlePlatformRiderCollision(rider, platform) {
    if (!rider.body || !platform.body) return;
    if (!rider.isPlatformRider) return;

    // For sensors (checkCollision.none), physics flags like touching.down are unreliable
    // If we are here, it's likely an overlap callback.
    // For 'carry' mode (Coins/Powerups), we force connection on overlap.
    const isSensor = rider.body.checkCollision.none;

    // Arcade sometimes misses touching.up on immovable bodies
    const touchingDown = rider.body.touching.down || rider.body.blocked.down;
    const platformSupporting = (platform.body.touching && platform.body.touching.up) || (platform.body.blocked && platform.body.blocked.up);

    // If it's a sensor in carry mode, we ALWAYS accept the ride if there's an overlap (implied by function call)
    const validConnection = (rider.riderMode === 'carry' && isSensor) || touchingDown || platformSupporting;

    if (validConnection) {
        const halfWidth = rider.body.width / 2;
        const margin = rider.riderMarginX;

        // Only set platform and offset if this is a new platform or first contact
        const isNewPlatform = rider.ridingPlatform !== platform;

        rider.ridingPlatform = platform;

        // Local bounds within the platform
        rider.localMinOffset = halfWidth + margin;
        rider.localMaxOffset = platform.body.width - halfWidth - margin;

        // CRITICAL: Only set offset on FIRST contact with this platform
        // Don't recalculate it every frame or the rider will "jump" around
        if (isNewPlatform || rider.localOffsetX == null) {
            rider.localOffsetX = rider.x - platform.body.x;
        }

        // If auto-patrol is enabled and nearly stationary, start walking
        if (rider.riderAutoPatrol && Math.abs(rider.body.velocity.x) < 5) {
            rider.riderDir = 1;
            if (rider.setFlipX) rider.setFlipX(false);
        }
    }
}

/**
 * Update platform rider behavior
 * Call this in the sprite's update/preUpdate method
 * @param {Phaser.Physics.Arcade.Sprite} rider - The riding sprite
 */
export function updatePlatformRider(rider) {
    if (!rider.isPlatformRider || !rider.body) return;

    const body = rider.body;

    // If on a platform
    // Check if we have a valid platform reference
    if (rider.ridingPlatform && rider.ridingPlatform.body) {

        // Validation: Should we still be riding?
        // - 'carry' mode (Sensors): Assume yes until platform dies. (We don't check touching)
        // - 'patrol'/'bound' mode: Check physical contact
        const isCarry = rider.riderMode === 'carry';
        const isTouching = body.blocked.down || body.touching.down;

        if (isCarry || isTouching) {
            const pBody = rider.ridingPlatform.body;
            const halfWidth = body.width / 2;
            const margin = rider.riderMarginX;

            // Recalculate world bounds from platform position
            const minX = pBody.x + halfWidth + margin;
            const maxX = pBody.x + pBody.width - halfWidth - margin;

            // Share these bounds with the sprite (for custom logic to use)
            rider.minX = minX;
            rider.maxX = maxX;

            if (rider.riderMode === 'carry') {
                // --- CARRY MODE: ShooterEnemy, coins, powerups ---
                // Stay at fixed local offset on platform

                // Ensure we have a valid local offset
                let offset = rider.localOffsetX;
                if (offset == null) {
                    // Fallback if not set yet
                    offset = rider.x - pBody.x;
                }

                // Clamp offset within platform bounds (with margin)
                offset = Phaser.Math.Clamp(
                    offset,
                    rider.localMinOffset ?? (halfWidth + margin),
                    rider.localMaxOffset ?? (pBody.width - halfWidth - margin)
                );
                rider.localOffsetX = offset;

                // World position = platform position + fixed offset
                rider.x = pBody.x + offset;

                // Safety clamp (numerical precision)
                if (rider.x < minX) rider.x = minX;
                else if (rider.x > maxX) rider.x = maxX;

                // Match platform velocity for physics alignment
                body.velocity.x = pBody.velocity.x;

            } else if (rider.riderMode === 'bound') {
                // --- BOUND MODE: enemies with own logic ---
                // Only update bounds and clamp position
                // DO NOT touch body.velocity.x, enemy handles that
                rider.x = Phaser.Math.Clamp(rider.x, minX, maxX);

            } else if (rider.riderMode === 'patrol' && rider.riderAutoPatrol) {
                // --- AUTO-PATROL MODE: automatic patrol ---
                // Only if explicitly enabled via autoPatrol option

                // Check for wall collisions and reverse direction
                if (body.blocked.left) {
                    rider.riderDir = 1;
                    if (rider.setFlipX) rider.setFlipX(false);
                } else if (body.blocked.right) {
                    rider.riderDir = -1;
                    if (rider.setFlipX) rider.setFlipX(true);
                }

                let dir = rider.riderDir;
                if (rider.flipX !== undefined) {
                    dir = rider.flipX ? -1 : 1;
                }

                // World velocity = platform velocity + relative velocity
                const worldSpeed = pBody.velocity.x + (dir * rider.riderPatrolSpeed);
                body.velocity.x = worldSpeed;

                // Clean reversal at edges
                if (rider.x >= maxX) {
                    rider.x = maxX;
                    rider.riderDir = -1;
                    if (rider.setFlipX) rider.setFlipX(true);
                } else if (rider.x <= minX) {
                    rider.x = minX;
                    rider.riderDir = 1;
                    if (rider.setFlipX) rider.setFlipX(false);
                }
            }
        }
    } else {
        // No longer on platform (or platform died): clear reference
        rider.ridingPlatform = null;

        // CRITICAL: Stop running in air for patrol mode
        // Prevents enemies from running off when sections haven't rendered
        if (rider.riderMode === 'bound' || (rider.riderMode === 'patrol' && rider.riderAutoPatrol)) {
            rider.body.velocity.x = 0;
        }
    }
}
