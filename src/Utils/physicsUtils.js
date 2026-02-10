/**
 * physicsUtils.js
 * 
 * Utilidades compartidas para manipulaciones físicas comunes.
 * 
 * Principios:
 * - DRY: Lógica física reutilizable.
 * - Single Responsibility: Solo manipulaciones físicas.
 */

/**
 * Lanza un objeto físico (item) con una trayectoria parabólica y habilita su rebote y gravedad.
 * Útil para loot de cofres, trashcans, enemigos, etc.
 * 
 * @param {Phaser.Scene} scene - La escena actual.
 * @param {Phaser.GameObjects.GameObject} item - El objeto a lanzar (debe tener body físico).
 * @param {number} targetX - Posición X hacia la cual queremos lanzar el objeto (ej: player.x).
 * @param {Phaser.GameObjects.GameObject} [floorCollider] - (Opcional) Objeto contra el cual colisionar/rebotar (ej: stageFloor).
 */
export function launchItem(scene, item, targetX, floorCollider) {
    if (!item || !item.body) return;

    // 1. Activar físicas dinámicas
    // Importante: Sobrescribe comportamientos estáticos (como monedas flotantes)
    item.body.setAllowGravity(true);
    item.body.setImmovable(false);
    item.body.setBounce(0.5); // Rebote moderado
    item.body.setCollideWorldBounds(true); // Evita que salga de la pantalla (Safety net)
    item.body.setDragX(50); // Fricción suave (permite resbalar un poco)

    // FORCE collision flags (in case it was a sensor)
    item.body.checkCollision.none = false;
    item.body.checkCollision.up = true;
    item.body.checkCollision.down = true;
    item.body.checkCollision.left = true;
    item.body.checkCollision.right = true;

    // 2. Calcular dirección hacia el objetivo
    const direction = (targetX < item.x) ? -1 : 1;

    // 3. Velocidad impulsiva aleatorizada (Ajustada para ser mas suave)
    const velocityX = direction * Phaser.Math.Between(100, 200);
    const velocityY = -450; // Impulso vertical mas bajo (antes -600)

    item.setVelocity(velocityX, velocityY);

    // 4. Agregar colisión temporal con obstaculos (piso, paredes, etc.)
    if (floorCollider) {
        const obstacles = Array.isArray(floorCollider) ? floorCollider : [floorCollider];
        obstacles.forEach(obstacle => {
            if (obstacle) {
                scene.physics.add.collider(item, obstacle);
            }
        });
    }
}
