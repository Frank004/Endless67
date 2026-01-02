/**
 * FSM básica del jugador (no altera físicas actuales).
 * Estados: GROUND, AIR_RISE, AIR_FALL, WALL_SLIDE, POWERUP_CUTSCENE, HIT, GOAL
 */
export class PlayerStateMachine {
    constructor(context, anim) {
        this.ctx = context;
        this.anim = anim;
        this.state = 'GROUND';
    }

    transition(next) {
        if (next === this.state || !next) return;
        this.state = next;
    }

    update() {
        const { sensors, flags, intent } = this.ctx;
        const jumpBuffered = this.ctx.hasJumpBuffered();

        // Prioridades altas: DEAD / HIT
        if (flags.dead) {
            this.transition('DEAD');
            this.anim?.play(this.anim?.resolve('DEAD'));
            this.anim?.setFacing(intent.moveX);
            return;
        }
        if (flags.hit) {
            this.transition('HIT');
            this.anim?.play(this.anim?.resolve('HIT'));
            this.anim?.setFacing(intent.moveX);
            // Cuando termine hitTimer, salir al estado correcto según sensores
            if (this.ctx.hitTimer <= 0) {
                flags.hit = false;
                // recalcular destino
                if (sensors.onFloor) this.transition('GROUND');
                else if (sensors.touchWall) this.transition('WALL_SLIDE');
                else this.transition(sensors.vy < 0 ? 'AIR_RISE' : 'AIR_FALL');
            }
            return;
        }

        // Prioridades: powerup/hit/goal quedarían aquí si se usan flags
        // GROUND
        if (sensors.onFloor) {
            if ((jumpBuffered || intent.jumpJustPressed) && !flags.inputLocked && this.ctx.canAcceptJump()) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                // Si no hay input lateral, forzar estilo UP
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
            } else {
                this.transition('GROUND');
                flags.canDoubleJump = true;
                const style = Math.abs(intent.moveX) > 0.1 ? 'run' : 'idle';
                this.anim?.play(this.anim?.resolve('GROUND', style));
                this.anim?.setFacing(intent.moveX);
            }
            return;
        }

        // WALL SLIDE
        if (sensors.touchWall && !flags.inputLocked) {
            this.transition('WALL_SLIDE');
            // Al tocar pared, rearmar doble salto para la siguiente secuencia
            flags.canDoubleJump = true;
            // Asegurar que el siguiente salto disponible sea el doble (tras un wall-jump)
            this.ctx.jumpsUsed = 1;
            // Si hay buffer de salto, permitir salto en pared aun sin input horizontal
            if (jumpBuffered || intent.jumpJustPressed) {
                this.ctx.consumeJumpBuffer();
                // Si no hay input lateral, tratar como salto vertical (usando wall jump actual)
                const res = this.ctx.doWallJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
            }
            this.anim?.play(this.anim?.resolve('WALL_SLIDE'));
            return;
        }

        // AIR
        const rising = sensors.vy < 0;
        if (rising) {
            if ((jumpBuffered || intent.jumpJustPressed) && flags.canDoubleJump && !flags.inputLocked) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doDoubleJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
            } else {
                this.transition('AIR_RISE');
            }
            this.anim?.play(this.anim?.resolve('AIR_RISE', flags.airStyle === 'SIDE' ? 'side' : 'up'));
        } else {
            // falling
            if ((jumpBuffered || intent.jumpJustPressed) && flags.canDoubleJump && !flags.inputLocked) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doDoubleJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
                this.anim?.play(this.anim?.resolve('AIR_RISE', flags.airStyle === 'SIDE' ? 'side' : 'up'));
                return;
            }
            // Coyote jump: permitir si hay buffer y coyote
            if ((jumpBuffered || intent.jumpJustPressed) && this.ctx.hasCoyote() && !flags.inputLocked) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
                this.anim?.play(this.anim?.resolve('AIR_RISE', flags.airStyle === 'SIDE' ? 'side' : 'up'));
                return;
            }
            this.transition('AIR_FALL');
            this.anim?.play(this.anim?.resolve('AIR_FALL'));
        }

        this.anim?.setFacing(intent.moveX);
    }
}
