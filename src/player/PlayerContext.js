/**
 * Contexto del jugador: sensores, intent y wrappers a acciones existentes.
 */
export class PlayerContext {
    constructor(sprite) {
        this.sprite = sprite;
        this.intent = {
            moveX: 0,
            jumpJustPressed: false
        };
        this.flags = {
            inputLocked: false,
            canDoubleJump: true,
            airStyle: 'UP',
            dead: false,
            hit: false
        };
        this.sensors = {
            onFloor: false,
            touchWallLeft: false,
            touchWallRight: false,
            touchWall: false,
            vx: 0,
            vy: 0,
            justLanded: false,
            startedFalling: false
        };
        this.prevOnFloor = false;
        this.prevVy = 0;
        this.prevTouchWall = false;
        this.prevTouchWallSide = null;
        this.jumpBufferTimer = 0;   // ms
        this.coyoteTimer = 0;       // ms
        this.hitTimer = 0;          // ms
        this.COYOTE_TIME = 120;
        this.JUMP_BUFFER = 150;
        this.WALL_COYOTE_TIME = 120;
        this.wallCoyoteTimer = 0;
        this.jumpsUsed = 0;         // saltos usados desde el último toque de piso/parede
        this.wallTouchSide = null;
        this.wallTouchCount = 0;
        this.maxWallTouches = 3;
        this.wallJumpSide = null;
        this.wallJumpCount = 0;
        this.maxWallJumps = 3;
    }

    resetState() {
        // Intent
        this.intent.moveX = 0;
        this.intent.jumpJustPressed = false;
        // Flags
        this.flags.inputLocked = false;
        this.flags.canDoubleJump = true;
        this.flags.airStyle = 'UP';
        this.flags.dead = false;
        this.flags.hit = false;
        // Sensors prev
        this.prevOnFloor = false;
        this.prevVy = 0;
        this.prevTouchWall = false;
        this.prevTouchWallSide = null;
        // Timers
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.wallCoyoteTimer = 0;
        this.hitTimer = 0;
        this.jumpsUsed = 0;
        // Wall counters
        this.wallTouchSide = null;
        this.wallTouchCount = 0;
        this.wallJumpSide = null;
        this.wallJumpCount = 0;
        this.setFatigueVisual(false);
    }

    tick(delta = 16) {
        // Timers de buffer/coyote
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
        this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
        if (this.wallCoyoteTimer > 0) {
            this.wallCoyoteTimer = Math.max(0, this.wallCoyoteTimer - delta);
        }
        if (this.hitTimer > 0) {
            this.hitTimer = Math.max(0, this.hitTimer - delta);
        }
    }

    updateSensors() {
        if (!this.sprite || !this.sprite.body) return;
        const body = this.sprite.body;
        this.sensors.onFloor = body.blocked.down || body.touching.down;
        this.sensors.touchWallLeft = body.blocked.left || body.touching.left;
        this.sensors.touchWallRight = body.blocked.right || body.touching.right;
        this.sensors.touchWall = this.sensors.touchWallLeft || this.sensors.touchWallRight;
        this.sensors.vx = body.velocity.x;
        this.sensors.vy = body.velocity.y;
        this.sensors.justLanded = !this.prevOnFloor && this.sensors.onFloor;
        this.sensors.startedFalling = this.prevVy < 0 && this.sensors.vy > 0;
        if (this.sensors.onFloor) {
            this.coyoteTimer = this.COYOTE_TIME;
            this.wallCoyoteTimer = 0;
            this.jumpsUsed = 0;
            this.wallTouchSide = null;
            this.wallTouchCount = 0;
            this.wallJumpSide = null;
            this.wallJumpCount = 0;
            this.setFatigueVisual(false);
        }
        if (this.sensors.touchWallLeft || this.sensors.touchWallRight) {
            const side = this.sensors.touchWallLeft ? 'left' : 'right';
            this.wallCoyoteTimer = this.WALL_COYOTE_TIME;
            if (!this.prevTouchWall || this.prevTouchWallSide !== side) {
                this.wallTouchSide = side;
                this.wallTouchCount = 1;
                // Reset fatiga de wall-jump al cambiar de pared
                if (this.wallJumpSide !== side) {
                    this.wallJumpSide = side;
                    this.wallJumpCount = 0;
                    this.setFatigueVisual(false);
                }
            }
            this.prevTouchWall = true;
            this.prevTouchWallSide = side;
        } else {
            this.prevTouchWall = false;
            this.prevTouchWallSide = null;
        }
        this.prevOnFloor = this.sensors.onFloor;
        this.prevVy = this.sensors.vy;
    }

    setIntent(moveX, jumpPressed) {
        this.intent.moveX = moveX;
        if (jumpPressed) {
            this.intent.jumpJustPressed = true;
            this.jumpBufferTimer = this.JUMP_BUFFER;
        }
    }

    resetForLand() {
        this.flags.canDoubleJump = true;
        this.jumpsUsed = 0;
    }

    useDoubleJump() {
        this.flags.canDoubleJump = false;
        this.jumpsUsed = 2;
    }

    setAirStyleFromInput() {
        const absX = Math.abs(this.intent.moveX);
        this.flags.airStyle = absX > 0.2 ? 'SIDE' : 'UP';
    }

    // ──────────────── ACCIONES (wrappers a físicas actuales) ────────────────
    doJump() {
        if (!this.sprite?.body) return null;
        const style = this.flags.airStyle;
        const mult = this.sprite.getPowerupJumpMultiplier?.() ?? 1.0;
        const boost = style === 'SIDE' ? 1.1 : 1.0;
        const vy = -this.sprite.baseJumpForce * boost * mult;
        this.sprite.jumpPhysics(0, vy);
        this.jumpsUsed = Math.max(this.jumpsUsed, 1);
        this.flags.canDoubleJump = true;
        const jumpOffsetY = (this.sprite.height || 32) * 0.5;
        return { type: 'jump', x: this.sprite.x, y: this.sprite.y + jumpOffsetY };
    }

    doDoubleJump() {
        if (!this.sprite?.body) return null;
        const style = this.flags.airStyle;
        const mult = this.sprite.getPowerupJumpMultiplier?.() ?? 1.0;
        const boost = style === 'SIDE' ? 1.05 : 1.0;
        const vy = -this.sprite.baseJumpForce * boost * mult;
        this.sprite.jumpPhysics(0, vy);
        this.useDoubleJump();
        const jumpOffsetY = (this.sprite.height || 32) * 0.5;
        return { type: 'double_jump', x: this.sprite.x, y: this.sprite.y + jumpOffsetY };
    }

    consumeJumpBuffered() {
        if (this.jumpBufferTimer > 0 && this.canAcceptJump()) {
            this.jumpBufferTimer = 0;
            this.intent.jumpJustPressed = false;
            return true;
        }
        return false;
    }

    hasCoyote() {
        return this.coyoteTimer > 0;
    }

    hasJumpBuffered() {
        return this.jumpBufferTimer > 0 || this.intent.jumpJustPressed;
    }

    consumeJumpBuffer() {
        this.jumpBufferTimer = 0;
        this.intent.jumpJustPressed = false;
    }

    clearJumpBufferIfInvalid() {
        if (!this.canAcceptJump()) {
            this.jumpBufferTimer = 0;
            this.intent.jumpJustPressed = false;
        }
    }

    canAcceptJump() {
        const wallContact = this.sensors.touchWall || this.wallCoyoteTimer > 0;
        const wallOk = wallContact && this.wallJumpCount < this.maxWallJumps;
        const groundOk = this.sensors.onFloor || this.hasCoyote();
        const airborneFirstJumpAvailable = !groundOk && !wallContact && this.jumpsUsed < 1;
        const doubleOk = this.flags.canDoubleJump && this.jumpsUsed === 1;
        const canJump = wallOk || groundOk || airborneFirstJumpAvailable || doubleOk;
        if (!canJump) {
            this.jumpBufferTimer = 0;
            this.intent.jumpJustPressed = false;
        }
        return canJump;
    }

    emitJumpEvent(result) {
        if (!result || !this.sprite?.scene?.eventBus) return;
        const EventBus = this.sprite.scene.eventBus || this.sprite.scene.eventsBus || null;
        if (EventBus?.emit) {
            EventBus.emit('PLAYER_JUMPED', {
                type: result.type,
                x: result.x,
                y: result.y
            });
        }
    }

    doWallJump() {
        if (!this.sprite?.body) return null;
        this.flags.airStyle = 'WALL';
        const mult = this.sprite.getPowerupJumpMultiplier?.() ?? 1.0;
        const dir = this.sensors.touchWallLeft ? 1 : this.sensors.touchWallRight ? -1 : 0;
        const side = dir === 1 ? 'left' : dir === -1 ? 'right' : null;
        if (side) {
            if (this.wallJumpSide !== side) {
                this.wallJumpSide = side;
                this.wallJumpCount = 0;
            }
            if (this.wallJumpCount >= this.maxWallJumps) {
                this.setFatigueVisual(true);
                return null;
            }
            this.wallJumpCount += 1;
        }
        const vx = dir * this.sprite.baseWallJumpForceX * mult;
        const vy = -this.sprite.baseWallJumpForceY * mult;
        this.sprite.jumpPhysics(vx, vy);
        this.flags.canDoubleJump = true;
        this.jumpsUsed = Math.max(this.jumpsUsed, 1);
        const jumpOffsetY = (this.sprite.height || 32) * 0.5;
        return { type: 'wall_jump', x: this.sprite.x + dir * 10, y: this.sprite.y + jumpOffsetY };
    }

    setFatigueVisual(active) {
        if (!this.sprite?.setTint) return;
        if (active) this.sprite.setTint(0x555555);
        else this.sprite.clearTint();
    }
}
