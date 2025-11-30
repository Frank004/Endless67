import { updatePlatformRider } from '../../utils/platformRider.js';

/**
 * PatrolBehavior - Strategy Pattern para comportamiento de patrullaje
 * 
 * Maneja la lógica de patrullaje de enemigos en plataformas.
 * Se puede aplicar a cualquier enemigo que necesite patrullar.
 */
export class PatrolBehavior {
    constructor(enemy, speed = 60) {
        this.enemy = enemy;
        this.patrolSpeed = speed;
        this.patrolDir = 1; // 1 = right, -1 = left
        this.minX = 0;
        this.maxX = 0;
    }

    /**
     * Inicializar patrullaje con límites
     * @param {number} minX - Límite izquierdo
     * @param {number} maxX - Límite derecho
     * @param {number} speed - Velocidad de patrullaje (opcional)
     */
    startPatrol(minX, maxX, speed = null) {
        this.minX = minX;
        this.maxX = maxX;
        if (speed !== null) {
            this.patrolSpeed = speed;
        }
        this.patrolDir = 1;
        this.enemy.setVelocityX(this.patrolSpeed);
    }

    /**
     * Detener patrullaje
     */
    stopPatrol() {
        this.enemy.setVelocityX(0);
    }

    /**
     * Actualizar comportamiento de patrullaje
     * Debe llamarse en el preUpdate del enemigo
     */
    update(time, delta) {
        // Actualizar información de plataforma
        updatePlatformRider(this.enemy);

        // Patrullaje solo si está en una plataforma
        if (this.enemy.body.blocked.down && this.enemy.ridingPlatform) {
            const pBody = this.enemy.ridingPlatform.body || { velocity: { x: 0 } };
            const platformVel = pBody.velocity ? pBody.velocity.x : 0;

            // Calcular velocidad: velocidad de plataforma + velocidad de patrullaje
            const base = this.patrolSpeed * this.patrolDir;
            this.enemy.setVelocityX(platformVel + base);

            // Respetar límites
            if (this.enemy.x >= this.maxX) {
                this.enemy.x = this.maxX;
                this.patrolDir = -1;
                this.enemy.setFlipX(true);
            } else if (this.enemy.x <= this.minX) {
                this.enemy.x = this.minX;
                this.patrolDir = 1;
                this.enemy.setFlipX(false);
            }

            // Verificar colisiones con paredes
            if (this.enemy.body.blocked.left) {
                this.patrolDir = 1;
                this.enemy.setFlipX(false);
            } else if (this.enemy.body.blocked.right) {
                this.patrolDir = -1;
                this.enemy.setFlipX(true);
            }
        } else {
            // En el aire o sin plataforma: DETENER para evitar caerse
            this.enemy.setVelocityX(0);
        }
    }

    /**
     * Limpiar comportamiento
     */
    destroy() {
        this.stopPatrol();
    }
}

