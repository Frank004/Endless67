import { ANIM_MANIFEST } from './animationManifest.js';

/**
 * FSM básica del jugador (no altera físicas actuales).
 * Estados: GROUND, AIR_RISE, AIR_FALL, WALL_SLIDE, POWERUP_CUTSCENE, HIT, GOAL
 */
export class PlayerStateMachine {
    constructor(context, anim) {
        this.ctx = context;
        this.anim = anim;
        this.state = 'GROUND';
        this.runStopping = false;
        this.hitPlaying = false;
        this.runStopSoundPlayed = false;
        this.wallSlideTimer = 0;
        this.wallSlideSoundPlayed = false;
    }

    /**
     * Play jump animation and hold its last frame (jump-03) to avoid visual jitter.
     * Falls back to setting the frame directly if the animation is missing.
     */
    _playJumpHold(style = 'up') {
        const sprite = this.ctx?.sprite;

        let subStyle = 'up';
        if (style === 'side') subStyle = 'side';
        if (style === 'double') subStyle = 'double';
        if (style === 'wall') subStyle = 'wall';

        const key = this.anim?.resolve('AIR_RISE', subStyle);
        const finalFrame = (style === 'double') ? 'double-jump-03.png' : 'jump-03.png';
        const manager = sprite?.anims?.animationManager;

        // Evitar reiniciar la animación si ya está corriendo o ya quedó en el frame final
        if (key && sprite?.anims) {
            if (sprite.anims.currentAnim?.key === key && sprite.anims.isPlaying) return;
            if (!sprite.anims.isPlaying && sprite.frame?.name === finalFrame) return;
        }

        if (key && manager?.exists(key)) {
            this.anim.playOnceHoldLast(key, finalFrame);
        } else {
            sprite?.anims?.stop();
            // Fallback frame set
            if (sprite?.texture?.has(finalFrame)) {
                sprite.setFrame(finalFrame);
            } else if (sprite?.texture?.has('jump-03.png')) {
                sprite.setFrame('jump-03.png');
            }
        }
    }

    transition(next) {
        if (next === this.state || !next) return;
        if (this.state === 'WALL_SLIDE') {
            this.ctx?.sprite?.scene?.audioManager?.stopWallSlide?.();
        }
        this.state = next;
    }

    update(delta = 16) {
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
            if (!this.hitPlaying) {
                this.hitPlaying = true;
                this.anim?.playOnceHoldLast(this.anim?.resolve('HIT'), 'hit-02.png');
            }
            this.anim?.setFacing(intent.moveX);
            // Cuando termine hitTimer, salir al estado correcto según sensores
            if (this.ctx.hitTimer <= 0) {
                flags.hit = false;
                this.hitPlaying = false;
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
            // Reset wall-related hold
            this.runStopSoundPlayed = sensors.onFloor ? this.runStopSoundPlayed : false;
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
                const absMove = Math.abs(intent.moveX);
                const wasRunning = this.anim?.currentKey === ANIM_MANIFEST.GROUND.run;
                const velX = Math.abs(this.ctx.sensors.vx);
                const stopThreshold = 20; // velocidad mínima antes de pasar a idle

                if (absMove > 0.1) {
                    this.runStopping = false;
                    this.runStopSoundPlayed = false;
                    this.ctx?.sprite?.scene?.audioManager?.stopShoeBrake?.();
                    this.anim?.play(this.anim?.resolve('GROUND', 'run'));
                    this.anim?.setFacing(intent.moveX);
                } else if (wasRunning) {
                    // Se soltó el input mientras corría: reproducir transición y luego mantener frame 02
                    this.runStopping = true;
                    if (!this.runStopSoundPlayed) {
                        this.ctx?.sprite?.scene?.audioManager?.playShoeBrake?.();
                        this.runStopSoundPlayed = true;
                    }
                    this.anim?.play(this.anim?.resolve('GROUND', 'run_stop'));
                    this.anim?.setFacing(this.ctx.intent.moveX);
                } else if (this.runStopping) {
                    if (velX > stopThreshold) {
                        // Mantener en frame stop-running-02 mientras desliza
                        const sprite = this.ctx.sprite;
                        if (sprite && sprite.anims) {
                            sprite.anims.stop();
                            sprite.setFrame('stop-running-02.png');
                            if (this.anim) this.anim.currentKey = 'player_run_stop_hold';
                        }
                        return;
                    } else {
                        this.ctx?.sprite?.scene?.audioManager?.stopShoeBrake?.();
                        this.runStopping = false;
                        this.runStopSoundPlayed = false;
                        this.anim?.play(this.anim?.resolve('GROUND', 'idle'));
                        this.anim?.setFacing(intent.moveX);
                    }
                } else {
                    this.runStopSoundPlayed = false;
                    this.ctx?.sprite?.scene?.audioManager?.stopShoeBrake?.();
                    this.anim?.play(this.anim?.resolve('GROUND', 'idle'));
                    this.anim?.setFacing(intent.moveX);
                }
            }
            return;
        }
        // Fuera del piso: reset para no bloquear el siguiente sonido
        this.runStopSoundPlayed = false;
        this.ctx?.sprite?.scene?.audioManager?.stopShoeBrake?.();

        // WALL SLIDE
        if (sensors.touchWall && !flags.inputLocked) {
            const entering = this.state !== 'WALL_SLIDE';
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

            if (entering && this.anim) {
                this.anim.playOnceThen(
                    this.anim.resolve('WALL_SLIDE', 'start'),
                    this.anim.resolve('WALL_SLIDE', 'loop')
                );
                // Play sound immediately
                this.ctx?.sprite?.scene?.audioManager?.playWallSlide?.();
            }
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
                this._playJumpHold('double');
            } else {
                this.transition('AIR_RISE');
                const isDouble = this.ctx.jumpsUsed >= 2;
                this._playJumpHold(isDouble ? 'double' : (flags.airStyle === 'SIDE' ? 'side' : 'up'));
            }
        } else {
            // falling
            if ((jumpBuffered || intent.jumpJustPressed) && flags.canDoubleJump && !flags.inputLocked && this.ctx.jumpsUsed < 2) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doDoubleJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
                this._playJumpHold('double');
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
                this._playJumpHold(flags.airStyle === 'SIDE' ? 'side' : 'up');
                return;
            }

            // Normal falling state update
            if (this.state !== 'AIR_FALL') {
                this.transition('AIR_FALL');
                if (this.anim) {
                    this.anim.playOnceThen(
                        this.anim.resolve('AIR_FALL', 'start'),
                        this.anim.resolve('AIR_FALL', 'loop')
                    );
                }
            } else {
                // Ya estamos en fall, mantener facing
                // No llamamos play() aquí para no reiniciar el ciclo start->loop
            }
        }

        this.anim?.setFacing(intent.moveX);
    }
}
