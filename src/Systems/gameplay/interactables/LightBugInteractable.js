/**
 * LightBugInteractable
 * 
 * Hace que las partículas de las luces (bugs) se alejen del player cuando pasa cerca
 * y luego vuelvan a su posición original usando una State Machine
 * 
 * TÉRMINO CORRECTO: "Proximity Detection" o "Range Detection"
 * - No requiere física/collision, solo cálculo de distancia euclidiana
 * - Más eficiente que usar overlap/collision para este caso
 * - Se actualiza en el update loop del InteractableManager
 * 
 * Acepta cualquier objeto con:
 * - lightEmitter: LightEmitterComponent
 * - visualObject o container: objeto con posición x, y
 */

// Constantes de configuración
const CONFIG = {
    DETECTION_RADIUS: 60,              // Radio de detección del player (px)
    MAX_DISTANCE_FROM_LIGHT: 20,       // Distancia máxima desde la luz (px)
    FLEE_OFFSET_MULTIPLIER: 0.4,       // Multiplicador para offset de huida (40% de maxDistance)
    RETURN_DELAY: 300,                  // Delay antes de volver (ms)
    MOVE_SPEED_MAX: 3,                  // Velocidad máxima de movimiento (px/frame)
    MOVE_SPEED_MULTIPLIER: 0.15,       // Multiplicador de velocidad de movimiento
    RETURN_THRESHOLD: 2,                // Distancia mínima para considerar "vuelta" (px)
    POSITION_THRESHOLD: 0.5             // Umbral mínimo para aplicar movimiento (px)
};

export class LightBugInteractable {
    // Estados de la State Machine
    static STATES = {
        NORMAL: 'NORMAL',      // Comportamiento normal de las partículas
        FLEEING: 'FLEEING',    // Partículas huyendo del player
        RETURNING: 'RETURNING' // Partículas volviendo a su posición original
    };

    constructor(scene, lightSource) {
        this.scene = scene;
        this.lightSource = lightSource;
        this.active = true;
        
        // State Machine
        this.state = LightBugInteractable.STATES.NORMAL;
        this.previousState = null;
        
        // Estado de la interacción
        this.isPlayerNearby = false;
        this.returnTimer = null;
        
        // Cache de posición de luz (se recalcula solo cuando es necesario)
        this._cachedLampPosition = null;
        this._cachedLampPositionFrame = -1;
        
        // Guardar posición original del particleManager (emitter completo)
        this.particleManagerOriginalPositions = new Map();
    }

    /**
     * Helper: Obtiene la posición absoluta de un objeto usando getWorldTransform o cálculo manual
     * @param {Object} obj - Objeto con x, y, getWorldTransform, parentContainer
     * @returns {{x: number, y: number}} Posición absoluta
     */
    _getWorldPosition(obj) {
        if (!obj) return { x: 0, y: 0 };
        
        // Método 1: Usar getWorldTransform si está disponible
        if (obj.getWorldTransform) {
            try {
                const worldTransform = obj.getWorldTransform();
                return {
                    x: worldTransform.tx || obj.x || 0,
                    y: worldTransform.ty || obj.y || 0
                };
            } catch (e) {
                // Fallback a cálculo manual
            }
        }
        
        // Método 2: Calcular posición absoluta manualmente
        let x = 0;
        let y = 0;
        let current = obj;
        
        while (current) {
            x += current.x || 0;
            y += current.y || 0;
            current = current.parentContainer;
        }
        
        return { x, y };
    }

    /**
     * Obtiene la posición de la luz (con cache por frame)
     * @returns {{x: number, y: number}} Posición de la luz
     */
    _getLampPosition() {
        const currentFrame = this.scene.game.loop.frame;
        
        // Usar cache si es del mismo frame
        if (this._cachedLampPositionFrame === currentFrame && this._cachedLampPosition) {
            return this._cachedLampPosition;
        }
        
        const lightEmitter = this.lightSource?.lightEmitter;
        if (!lightEmitter) {
            return { x: 0, y: 0 };
        }
        
        // Intentar usar glowInner como referencia (más preciso)
        if (lightEmitter.glowInner) {
            const position = this._getWorldPosition(lightEmitter.glowInner);
            this._cachedLampPosition = position;
            this._cachedLampPositionFrame = currentFrame;
            return position;
        }
        
        // Fallback a visualObject/container
        const visual = this.lightSource.visualObject || this.lightSource.container || this.lightSource;
        const position = visual ? this._getWorldPosition(visual) : { x: this.lightSource.x || 0, y: this.lightSource.y || 0 };
        
        this._cachedLampPosition = position;
        this._cachedLampPositionFrame = currentFrame;
        return position;
    }

    /**
     * Helper: Obtiene los emitters de un particleManager
     * @param {Object} particleManager 
     * @returns {Array} Array de emitters
     */
    _getEmitters(particleManager) {
        if (!particleManager) return [];
        
        // Phaser 3: particleManager puede tener emitters array o ser el emitter mismo
        if (particleManager.emitters && Array.isArray(particleManager.emitters)) {
            return particleManager.emitters;
        }
        
        // Si no tiene emitters array, puede ser el emitter mismo
        return [particleManager];
    }

    /**
     * Actualiza la interacción cada frame
     * Usa Proximity Detection (detección de proximidad) basada en distancia euclidiana
     * @param {Phaser.GameObjects.Sprite} player 
     */
    onUpdate(player) {
        // Validaciones tempranas
        if (!this.lightSource?.lightEmitter) return;
        if (!player?.active) return;

        // Obtener posición de la luz (con cache)
        const lampPos = this._getLampPosition();

        // Calcular distancia del player a la lámpara
        const dx = player.x - lampPos.x;
        const dy = player.y - lampPos.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        // Actualizar estado de proximidad
        const wasNearby = this.isPlayerNearby;
        this.isPlayerNearby = distance < CONFIG.DETECTION_RADIUS;

        // State Machine: Transiciones de estado
        this.updateStateMachine(player, lampPos.x, lampPos.y, wasNearby);

        // State Machine: Ejecutar comportamiento del estado actual
        this.executeState(player, lampPos.x, lampPos.y);
    }

    /**
     * State Machine: Actualiza las transiciones de estado
     */
    updateStateMachine(player, lampX, lampY, wasNearby) {
        // Transiciones de estado
        if (this.isPlayerNearby && !wasNearby) {
            // Player entró en el radio -> FLEEING
            this.setState(LightBugInteractable.STATES.FLEEING);
        } else if (!this.isPlayerNearby && wasNearby) {
            // Player salió del radio -> RETURNING
            this.setState(LightBugInteractable.STATES.RETURNING);
        } else if (this.state === LightBugInteractable.STATES.RETURNING) {
            // Verificar si todas las partículas volvieron -> NORMAL
            if (this.allParticlesReturned()) {
                this.setState(LightBugInteractable.STATES.NORMAL);
            }
        }
    }

    /**
     * State Machine: Cambia de estado
     */
    setState(newState) {
        if (this.state === newState) return;

        this.previousState = this.state;
        this.state = newState;

        // Acciones al entrar en un estado
        this.onStateEnter(newState);
    }

    /**
     * State Machine: Acciones al entrar en un estado
     */
    onStateEnter(state) {
        switch (state) {
            case LightBugInteractable.STATES.FLEEING:
                this.saveParticlePositions();
                this._clearReturnTimer();
                break;

            case LightBugInteractable.STATES.RETURNING:
                this.returnTimer = this.scene.time.delayedCall(CONFIG.RETURN_DELAY, () => {
                    // El retorno se maneja en executeState
                });
                break;

            case LightBugInteractable.STATES.NORMAL:
                this.particleManagerOriginalPositions.clear();
                this._clearReturnTimer();
                break;
        }
    }

    /**
     * Helper: Limpia el timer de retorno
     */
    _clearReturnTimer() {
        if (this.returnTimer) {
            this.returnTimer.destroy();
            this.returnTimer = null;
        }
    }

    /**
     * State Machine: Ejecuta el comportamiento del estado actual
     */
    executeState(player, lampX, lampY) {
        switch (this.state) {
            case LightBugInteractable.STATES.NORMAL:
                // No hacer nada, comportamiento normal del emitter
                break;

            case LightBugInteractable.STATES.FLEEING:
                this.updateFleeingParticles(player, lampX, lampY);
                break;

            case LightBugInteractable.STATES.RETURNING:
                this.updateReturningParticles();
                break;
        }
    }

    /**
     * Guarda las posiciones originales de los particleManagers (emitters completos)
     */
    saveParticlePositions() {
        this.particleManagerOriginalPositions.clear();
        
        const lightEmitter = this.lightSource.lightEmitter;
        if (!lightEmitter?.emitters) return;

        lightEmitter.emitters.forEach((particleManager) => {
            if (!particleManager) return;

            // Calcular posición absoluta del particleManager
            const absolutePos = this._getWorldPosition(particleManager);
            
            // Guardar posición del emitZone si existe
            const emitters = this._getEmitters(particleManager);
            let emitZonePos = null;
            
            if (emitters.length > 0) {
                const emitter = emitters[0];
                if (emitter?.emitZone?.source) {
                    const source = emitter.emitZone.source;
                    if (source.x !== undefined && source.y !== undefined) {
                        // Posición absoluta del emitZone = posición del particleManager + offset del source
                        emitZonePos = {
                            x: absolutePos.x + source.x,
                            y: absolutePos.y + source.y
                        };
                    }
                }
            }
            
            this.particleManagerOriginalPositions.set(particleManager, {
                absoluteX: absolutePos.x,
                absoluteY: absolutePos.y,
                relativeX: particleManager.x || 0,
                relativeY: particleManager.y || 0,
                emitZoneX: emitZonePos?.x ?? null,
                emitZoneY: emitZonePos?.y ?? null
            });
        });
    }

    /**
     * Helper: Calcula la posición del parent container
     * @param {Object} obj 
     * @returns {{x: number, y: number}}
     */
    _getParentPosition(obj) {
        if (!obj?.parentContainer) return { x: 0, y: 0 };
        
        let x = 0;
        let y = 0;
        let current = obj.parentContainer;
        
        while (current) {
            x += current.x || 0;
            y += current.y || 0;
            current = current.parentContainer;
        }
        
        return { x, y };
    }

    /**
     * Helper: Mueve un objeto suavemente hacia una posición objetivo
     * @param {Object} obj - Objeto con x, y
     * @param {number} targetX 
     * @param {number} targetY 
     */
    _smoothMove(obj, targetX, targetY) {
        if (obj.x === undefined || obj.y === undefined) return;
        
        const dx = targetX - obj.x;
        const dy = targetY - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > CONFIG.POSITION_THRESHOLD) {
            const moveSpeed = Math.min(CONFIG.MOVE_SPEED_MAX, distance * CONFIG.MOVE_SPEED_MULTIPLIER);
            obj.x += (dx / distance) * moveSpeed;
            obj.y += (dy / distance) * moveSpeed;
        } else {
            obj.x = targetX;
            obj.y = targetY;
        }
    }

    /**
     * Estado FLEEING: Mueve el emitter completo (con todas sus partículas) hacia el lado opuesto del player
     */
    updateFleeingParticles(player, lampX, lampY) {
        const lightEmitter = this.lightSource.lightEmitter;
        if (!lightEmitter?.emitters) return;

        // Calcular dirección opuesta al player desde la luz
        const dx = player.x - lampX;
        const dy = player.y - lampY;
        const playerAngle = Math.atan2(dy, dx);
        const fleeAngle = playerAngle + Math.PI; // 180 grados opuesto
        
        // Calcular nueva posición del emitter (opuesta al player)
        const offsetDistance = CONFIG.MAX_DISTANCE_FROM_LIGHT * CONFIG.FLEE_OFFSET_MULTIPLIER;
        const targetAbsoluteX = lampX + Math.cos(fleeAngle) * offsetDistance;
        const targetAbsoluteY = lampY + Math.sin(fleeAngle) * offsetDistance;

        lightEmitter.emitters.forEach((particleManager) => {
            if (!particleManager) return;

            const originalPos = this.particleManagerOriginalPositions.get(particleManager);
            if (!originalPos) return;

            // Calcular posición relativa objetivo
            const parentPos = this._getParentPosition(particleManager);
            const targetRelativeX = targetAbsoluteX - parentPos.x;
            const targetRelativeY = targetAbsoluteY - parentPos.y;

            // Mover el particleManager
            this._smoothMove(particleManager, targetRelativeX, targetRelativeY);
            
            // Mover el emitZone.source si existe
            const emitters = this._getEmitters(particleManager);
            emitters.forEach((emitter) => {
                if (emitter?.emitZone?.source && originalPos.emitZoneX !== null) {
                    const source = emitter.emitZone.source;
                    if (source.x !== undefined && source.y !== undefined) {
                        // Calcular offset desde la posición original
                        const offsetX = targetAbsoluteX - originalPos.absoluteX;
                        const offsetY = targetAbsoluteY - originalPos.absoluteY;
                        
                        // Calcular posición relativa original del emitZone
                        const originalEmitZoneRelativeX = originalPos.emitZoneX - originalPos.absoluteX;
                        const originalEmitZoneRelativeY = originalPos.emitZoneY - originalPos.absoluteY;
                        
                        // Aplicar el offset
                        const targetEmitZoneX = originalEmitZoneRelativeX + offsetX;
                        const targetEmitZoneY = originalEmitZoneRelativeY + offsetY;
                        
                        this._smoothMove(source, targetEmitZoneX, targetEmitZoneY);
                    }
                }
            });
        });
    }

    /**
     * Estado RETURNING: Restaura el emitter completo a su posición original
     */
    updateReturningParticles() {
        const lightEmitter = this.lightSource.lightEmitter;
        if (!lightEmitter?.emitters) return;

        lightEmitter.emitters.forEach((particleManager) => {
            if (!particleManager) return;

            const originalPos = this.particleManagerOriginalPositions.get(particleManager);
            if (!originalPos) return;

            // Restaurar posición del particleManager
            this._smoothMove(particleManager, originalPos.relativeX, originalPos.relativeY);
            
            // Restaurar el emitZone.source si existe
            const emitters = this._getEmitters(particleManager);
            emitters.forEach((emitter) => {
                if (emitter?.emitZone?.source && originalPos.emitZoneX !== null) {
                    const source = emitter.emitZone.source;
                    if (source.x !== undefined && source.y !== undefined) {
                        // Calcular posición relativa original del emitZone
                        const originalEmitZoneRelativeX = originalPos.emitZoneX - originalPos.absoluteX;
                        const originalEmitZoneRelativeY = originalPos.emitZoneY - originalPos.absoluteY;
                        
                        this._smoothMove(source, originalEmitZoneRelativeX, originalEmitZoneRelativeY);
                    }
                }
            });
        });
    }

    /**
     * Verifica si el emitter completo volvió a su posición original
     */
    allParticlesReturned() {
        if (this.particleManagerOriginalPositions.size === 0) return true;

        for (const [particleManager, originalPos] of this.particleManagerOriginalPositions) {
            if (!particleManager) continue;
            
            const dx = (particleManager.x || 0) - originalPos.relativeX;
            const dy = (particleManager.y || 0) - originalPos.relativeY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > CONFIG.RETURN_THRESHOLD) {
                return false;
            }
        }

        return true;
    }

    onDestroy() {
        this.active = false;
        this.state = LightBugInteractable.STATES.NORMAL;
        this._clearReturnTimer();
        this.particleManagerOriginalPositions.clear();
        this._cachedLampPosition = null;
    }
}
