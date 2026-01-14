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
        this.isPatrolling = false;  // Inicializar flag
        this._hasPlatformContact = false;
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
        this.isPatrolling = true;  // Flag para indicar que debe patrullar
        const base = this.patrolSpeed * this.patrolDir;
        if (this.enemy?.setVelocityX) {
            this.enemy.setVelocityX(base);
        }
    }

    /**
     * Detener patrullaje
     */
    stopPatrol() {
        this.isPatrolling = false;
        // Guardar errores al destruir la escena: enemy puede estar ya destruido
        if (!this.enemy || !this.enemy.body || !this.enemy.setVelocityX) return;
        this.enemy.setVelocityX(0);
    }

    /**
     * Actualizar comportamiento de patrullaje
     * Debe llamarse en el preUpdate del enemigo
     */
    update(time, delta) {
        // Solo actualizar si el patrullaje está activo
        if (!this.isPatrolling) {
            return;
        }

        // Verificar que el enemigo tenga body
        if (!this.enemy.body) {
            console.error(`  ❌ PatrolBehavior.update: enemy.body es null`);
            return;
        }

        // Actualizar información de plataforma
        updatePlatformRider(this.enemy);

        const pBody = this.enemy.ridingPlatform?.body || { velocity: { x: 0 } };
        const platformVel = pBody.velocity ? pBody.velocity.x : 0;

        // Aplicar velocidad base + velocidad de plataforma
        const desiredVel = platformVel + this.patrolSpeed * this.patrolDir;
        this.enemy.setVelocityX(desiredVel);

        // Respetar límites de patrullaje con margen de tolerancia
        // Usamos margen porque con velocidad de 60px/s puede "saltar" sobre el límite exacto
        const tolerance = 2; // 2px de margen

        if (this.enemy.x >= this.maxX - tolerance) {
            this.patrolDir = -1;
            this.enemy.setVelocityX(platformVel - this.patrolSpeed);
            if (this.enemy.setFlipX) this.enemy.setFlipX(true);
        } else if (this.enemy.x <= this.minX + tolerance) {
            this.patrolDir = 1;
            this.enemy.setVelocityX(platformVel + this.patrolSpeed);
            if (this.enemy.setFlipX) this.enemy.setFlipX(false);
        }

        // Cambio de dirección por colisión lateral
        if (this.enemy.body.blocked.left) {
            console.log('🔵 PATROL: Blocked LEFT');
            this.patrolDir = 1;
            if (this.enemy.setFlipX) this.enemy.setFlipX(false);
        } else if (this.enemy.body.blocked.right) {
            console.log('🔵 PATROL: Blocked RIGHT');
            this.patrolDir = -1;
            if (this.enemy.setFlipX) this.enemy.setFlipX(true);
        }
    }

    /**
     * Limpiar comportamiento
     */
    destroy() {
        this.stopPatrol();
        this.enemy = null;
    }
}
