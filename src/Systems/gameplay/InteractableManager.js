/**
 * InteractableManager
 * 
 * Gestiona todos los interactables del juego (trashcan, luces, etc.)
 * 
 * Principios:
 * - Single Responsibility: Solo maneja interactables
 * - DRY: Sistema centralizado para todos los interactables
 * - Separation of Concerns: Separado de collision y gameplay
 */

export class InteractableManager {
    constructor(scene) {
        this.scene = scene;
        this.interactables = new Map(); // Map<id, Interactable>
        this.updateListener = null;
    }

    /**
     * Registra un interactable
     * @param {string} id - Identificador único del interactable
     * @param {Object} interactable - Objeto interactable con métodos onUpdate, onDestroy, etc.
     */
    register(id, interactable) {
        if (this.interactables.has(id)) {
            console.warn(`[InteractableManager] Interactable ${id} ya está registrado`);
            return;
        }
        
        this.interactables.set(id, interactable);
        
        // Si es el primer interactable, iniciar el update loop
        if (this.interactables.size === 1 && !this.updateListener) {
            this.startUpdateLoop();
        }
    }

    /**
     * Desregistra un interactable
     * @param {string} id - Identificador del interactable
     */
    unregister(id) {
        const interactable = this.interactables.get(id);
        if (interactable?.onDestroy) {
            interactable.onDestroy();
        }
        this.interactables.delete(id);
        
        // Si no hay más interactables, detener el update loop
        if (this.interactables.size === 0 && this.updateListener) {
            this.stopUpdateLoop();
        }
    }

    /**
     * Inicia el loop de actualización usando scene.events.on('update')
     * Más eficiente que usar timer porque se sincroniza con el frame rate
     */
    startUpdateLoop() {
        if (this.updateListener) return;
        
        this.updateListener = () => {
            this.update();
        };
        this.scene.events.on('update', this.updateListener);
    }

    /**
     * Detiene el loop de actualización
     */
    stopUpdateLoop() {
        if (this.updateListener) {
            this.scene.events.off('update', this.updateListener);
            this.updateListener = null;
        }
    }

    /**
     * Actualiza todos los interactables
     */
    update() {
        const player = this.scene.player;
        
        // Esperar a que el player esté disponible
        if (!player?.active) return;

        // Actualizar cada interactable
        this.interactables.forEach((interactable, id) => {
            if (!interactable.active) {
                this.unregister(id);
                return;
            }

            if (interactable.onUpdate) {
                try {
                    interactable.onUpdate(player);
                } catch (error) {
                    console.error(`[InteractableManager] Error en onUpdate de ${id}:`, error);
                }
            }
        });
    }

    /**
     * Obtiene un interactable por ID
     * @param {string} id 
     * @returns {Object|null}
     */
    get(id) {
        return this.interactables.get(id) || null;
    }

    /**
     * Limpia todos los interactables
     */
    destroy() {
        this.interactables.forEach((interactable) => {
            if (interactable.onDestroy) {
                interactable.onDestroy();
            }
        });
        this.interactables.clear();
        this.stopUpdateLoop();
    }
}
