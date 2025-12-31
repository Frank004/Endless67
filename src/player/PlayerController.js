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
        this.fsm.update();
        // Reset edge trigger se maneja vía buffer al consumirlo
    }
}
