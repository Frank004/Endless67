import { PlayerContext } from './PlayerContext.js';
import { PlayerStateMachine } from './PlayerStateMachine.js';
import { PlayerAnimationController } from './PlayerAnimationController.js';

/**
 * Orquestador ligero que no altera físicas actuales.
 * Lee sensores, construye intent básico y actualiza la FSM y animación.
 */
export class PlayerController {
    constructor(sprite) {
        this.sprite = sprite;
        this.context = new PlayerContext(sprite);
        this.anim = new PlayerAnimationController(sprite);
        this.fsm = new PlayerStateMachine(this.context, this.anim);
        this.enabled = true;
    }

    resetState() {
        this.context?.resetState();
        this.anim?.reset?.();
        this.fsm.state = 'GROUND';
        this.fsm.hitPlaying = false;
    }

    enterHit(duration = 500) {
        this.context.flags.hit = true;
        // Permitir movimiento para que el jugador pueda recuperarse mientras dura el daño
        this.context.flags.inputLocked = false;
        this.context.hitTimer = duration;
    }

    enterDeath() {
        this.context.flags.dead = true;
        this.context.flags.inputLocked = true;
        this.sprite.setVelocity(0, 0);
        this.sprite.setAcceleration(0, 0);
    }

    unlockInput() {
        this.context.flags.dead = false;
        this.context.flags.inputLocked = false;
        this.fsm.state = 'AIR'; // Reset to AIR state so they can fall/move
    }

    /**
     * Actualiza sensores e intenta deducir intent del body (placeholder).
     * Integra con FSM sin modificar la lógica de movimiento existente.
     */
    update() {
        if (!this.enabled || !this.sprite) return;
        const delta = this.sprite?.scene?.game?.loop?.delta || 16;
        this.context.tick(delta);
        this.context.updateSensors();
        this.context.clearJumpBufferIfInvalid();
        // Intent: viene del input (moveX) ya seteado por events
        this.context.setIntent(this.context.intent.moveX, this.context.intent.jumpJustPressed);
        this.context.setAirStyleFromInput();

        // Aplicar movimiento horizontal simple según intent (sin lógica duplicada en eventos)
        this.applyHorizontalMovement();

        this.fsm.update(delta);
        // Suavizar slide en pared cuando el jugador se está pegando a ella
        this.applyWallSlideDamp();
        // Reset edge trigger se maneja vía buffer al consumirlo
    }

    applyHorizontalMovement() {
        if (!this.sprite || !this.sprite.body) return;
        if (this.context.flags.inputLocked) {
            this.sprite.stop();
            return;
        }
        const dir = this.context.intent.moveX || 0;
        if (Math.abs(dir) > 0.05) {
            this.sprite.move(dir);
        } else {
            this.sprite.stop();
        }
    }

    applyWallSlideDamp() {
        if (!this.sprite || !this.sprite.body) return;
        const { sensors, intent } = this.context;
        if (sensors.onFloor) return;
        const wallDir = sensors.touchWallLeft ? -1 : sensors.touchWallRight ? 1 : 0;
        if (!wallDir) return;
        // Solo frenar si el jugador está presionando hacia la pared
        const pushing = (wallDir === -1 && intent.moveX < -0.2) || (wallDir === 1 && intent.moveX > 0.2);
        if (!pushing) return;
        const maxSlideSpeed = 140; // limita la caída al pegarse a la pared
        if (this.sprite.body.velocity.y > maxSlideSpeed) {
            this.sprite.body.setVelocityY(maxSlideSpeed);
        }
    }
}
