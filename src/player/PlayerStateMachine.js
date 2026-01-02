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
                const absMove = Math.abs(intent.moveX);
                const wasRunning = this.anim?.currentKey === ANIM_MANIFEST.GROUND.run;
                const velX = Math.abs(this.ctx.sensors.vx);
                const stopThreshold = 20; // velocidad mínima antes de pasar a idle

                if (absMove > 0.1) {
                    this.runStopping = false;
                    this.anim?.play(this.anim?.resolve('GROUND', 'run'));
                    this.anim?.setFacing(intent.moveX);
                } else if (wasRunning) {
                    // Se soltó el input mientras corría: reproducir transición y luego mantener frame 02
                    this.runStopping = true;
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
                        this.runStopping = false;
                        this.anim?.play(this.anim?.resolve('GROUND', 'idle'));
                        this.anim?.setFacing(intent.moveX);
                    }
                } else {
                    this.anim?.play(this.anim?.resolve('GROUND', 'idle'));
                    this.anim?.setFacing(intent.moveX);
                }
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
                this.anim?.play(this.anim?.resolve('AIR_RISE', 'side'));
            } else {
                this.transition('AIR_RISE');
                // Reproducir jump y mantener último frame (jump-03) hasta siguiente cambio de estado
                const sprite = this.ctx.sprite;
                const animKey = this.anim?.resolve('AIR_RISE', 'up');
                if (animKey && sprite?.anims?.animationManager.exists(animKey)) {
                    const animObj = sprite.anims.animationManager.get(animKey);
                    sprite.anims.play(animKey);
                    const lastFrame = animObj?.getLastFrame() || animObj?.frames?.[animObj.frames.length - 1];
                    if (lastFrame?.frame?.name) {
                        sprite.anims.stopOnFrame(lastFrame);
                    } else {
                        sprite.setFrame('jump-03.png');
                    }
                } else {
                    // Fallback: set último frame manual
                    sprite?.anims?.stop();
                    sprite?.setFrame('jump-03.png');
                }
            }
        } else {
            // falling
            if ((jumpBuffered || intent.jumpJustPressed) && flags.canDoubleJump && !flags.inputLocked) {
                this.ctx.consumeJumpBuffer();
                this.ctx.setAirStyleFromInput();
                if (Math.abs(intent.moveX) <= 0.1) this.ctx.flags.airStyle = 'UP';
                const res = this.ctx.doDoubleJump();
                if (res) this.ctx.emitJumpEvent(res);
                this.transition('AIR_RISE');
                // Reproducir jump y mantener último frame (jump-03) hasta siguiente cambio de estado
                const sprite = this.ctx.sprite;
                const animKey = this.anim?.resolve('AIR_RISE', flags.airStyle === 'SIDE' ? 'side' : 'up');
                if (animKey && sprite?.anims?.animationManager.exists(animKey)) {
                    const animObj = sprite.anims.animationManager.get(animKey);
                    sprite.anims.play(animKey);
                    const lastFrame = animObj?.getLastFrame() || animObj?.frames?.[animObj.frames.length - 1];
                    if (lastFrame?.frame?.name) {
                        sprite.anims.stopOnFrame(lastFrame);
                    } else {
                        sprite.setFrame('jump-03.png');
                    }
                } else {
                    sprite?.anims?.stop();
                    sprite?.setFrame('jump-03.png');
                }
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
                const sprite = this.ctx.sprite;
                const animKey = this.anim?.resolve('AIR_RISE', flags.airStyle === 'SIDE' ? 'side' : 'up');
                if (animKey && sprite?.anims?.animationManager.exists(animKey)) {
                    const animObj = sprite.anims.animationManager.get(animKey);
                    sprite.anims.play(animKey);
                    const lastFrame = animObj?.getLastFrame() || animObj?.frames?.[animObj.frames.length - 1];
                    if (lastFrame?.frame?.name) {
                        sprite.anims.stopOnFrame(lastFrame);
                    } else {
                        sprite.setFrame('jump-03.png');
                    }
                } else {
                    sprite?.anims?.stop();
                    sprite?.setFrame('jump-03.png');
                }
                return;
            }
            this.transition('AIR_FALL');
            this.anim?.play(this.anim?.resolve('AIR_FALL'));
        }

        this.anim?.setFacing(intent.moveX);
    }
}
