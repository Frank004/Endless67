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
            airStyle: 'UP'
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
        this.jumpBufferTimer = 0;   // ms
        this.coyoteTimer = 0;       // ms
        this.COYOTE_TIME = 120;
        this.JUMP_BUFFER = 150;
        this.wallTouchSide = null;
        this.wallTouchCount = 0;
        this.maxWallTouches = 3;
    }

    tick(delta = 16) {
        // Timers de buffer/coyote
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
        this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
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
            this.wallTouchSide = null;
            this.wallTouchCount = 0;
        }
        if (this.sensors.touchWallLeft || this.sensors.touchWallRight) {
            const side = this.sensors.touchWallLeft ? 'left' : 'right';
            if (this.wallTouchSide !== side) {
                this.wallTouchSide = side;
                this.wallTouchCount = 1;
            } else {
                this.wallTouchCount += 1;
            }
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
    }

    useDoubleJump() {
        this.flags.canDoubleJump = false;
    }

    setAirStyleFromInput() {
        const absX = Math.abs(this.intent.moveX);
        this.flags.airStyle = absX > 0.2 ? 'SIDE' : 'UP';
    }

    // ──────────────── ACCIONES (wrappers a físicas actuales) ────────────────
    doJump() {
        if (!this.sprite?.jump) return;
        const style = this.flags.airStyle;
        const boost = style === 'SIDE' ? 1.1 : 1.0;
        const res = this.sprite.jump(boost);
        if (res) {
            // Primer salto: double jump disponible
            this.flags.canDoubleJump = true;
        }
        return res;
    }

    doDoubleJump() {
        if (!this.sprite?.jump) return;
        const style = this.flags.airStyle;
        const boost = style === 'SIDE' ? 1.05 : 1.0;
        const res = this.sprite.jump(boost);
        if (res) {
            this.useDoubleJump();
        }
        return res;
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
        const wallOk = this.sensors.touchWall && this.wallTouchCount < this.maxWallTouches;
        return this.sensors.onFloor || wallOk || this.hasCoyote() || this.flags.canDoubleJump;
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
        if (!this.sprite?.jump) return;
        // Forzar estilo WALL para anim y potenciar ligeramente
        this.flags.airStyle = 'WALL';
        const res = this.sprite.jump(1.0);
        if (res) {
            this.flags.airStyle = 'WALL';
            this.flags.canDoubleJump = true; // permitir doble salto tras walljump
        }
        return res;
    }
}
