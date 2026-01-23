# Diagnóstico de Optimización Visual (Emitters, Shaders, Pooling)
**Fecha:** 11 Enero 2026
**Estado General:** 🟢 ÓPTIMO

Este documento detalla el análisis del rendimiento del sistema visual actual del juego.

## 1. Sistema de Partículas (Particles)

### ParticleManager (Global)
*   **Estado:** ✅ Optimizado.
*   **Análisis:** Utiliza "Single Emitter Managers" para efectos globales (Dust, Spark, Aura, Confetti). Los emisores se crean una sola vez y se reutilizan mediante eventos (`emitParticleAt`).
*   **Impacto:** Mínimo consumo de CPU/Memoria. Código limpio y desacoplado.

### LampDecoration (Local Emitters)
*   **Estado:** ⚠️ Aceptable (Con nota).
*   **Análisis:** Cada lámpara crea sus propios instancias de `ParticleEmitter` (2 por lámpara).
*   **Escalabilidad:** 
    *   En pantalla (Slot 640px, Max 2 lamps/slot x 3 slots visibles) ≈ 6 lámparas activas.
    *   Total emisores: ~12.
    *   Phaser soporta cientos de emisores sin problema.
*   **Optimización Futura:** Si se decidiera aumentar la densidad de lámparas significativamente (ej. 50 en pantalla), sería recomendable migrar a un `GlobalLampEmitter` compartido. Actualmente, **no es necesario**.

## 2. Sistema de Pooling (Reutilización de Objetos)

### WallDecorFactory
*   **Estado:** ✅ Excelente.
*   **Análisis:** Implementa pools dedicados para `PIPE`, `SIGN` y `LAMP`.
*   **Ciclo de Vida:**
    *   `get...()`: Reutiliza instancias inactivas o crea nuevas si el pool está vacío.
    *   `reset()`: Reinicia el estado visual sin destruir/crear objetos Phaser pesados (Textures/Containers).
    *   `LampDecoration`: Detiene/Arranca sus emisores correctamente al entrar/salir del pool.
*   **Impacto:** Evita el Garbage Collection spikes durante el gameplay infinito.

### BackgroundManager
*   **Estado:** ✅ Excelente.
*   **Análisis:** Usa `Phaser.GameObjects.Group` para gestionar segmentos de pared y cables (`get()`, `killAndHide()`).
*   **Gestión de Memoria:** Limpia segmentos fuera de rango (`recycleSegment`), manteniendo el conteo de objetos estable.

## 3. Shaders & Pipelines

### FlamesPipeline (Lava)
*   **Estado:** ✅ Optimizado.
*   **Análisis:** 
    *   Es un `PostFXPipeline` aplicado a un solo objeto gigante (`Riser`).
    *   Usa texturas de ruido (`noise`) pre-cargadas y vinculadas.
    *   Lógica en Fragment Shader eficiente (mix, smoothstep), sin bucles pesados.
*   **Impacto:** Costo de GPU constante y bajo, independiente de la complejidad visual del fuego.

## 4. Texturas Generativas

### Comprobación de Existencia
*   **Estado:** ✅ Correcto.
*   **Análisis:** Todos los sistemas (`LampDecoration`, `BackgroundManager`) verifican `!this.scene.textures.exists(...)` antes de generar texturas dinámicas (`lamp_glow`, `shadows`).
*   **Impacto:** Evita fugas de memoria por duplicación de texturas Canvas cada vez que se instancia un objeto.

## Conclusión
El sistema visual está **robusto y optimizado** para Web/Mobile. No se detectan cuellos de botella obvios ("Red Flags") en la arquitectura actual.

*   **CPU:** Baja carga (Pooling efectivo).
*   **GPU:** Carga controlada (Shaders simples, batching de sprites).
*   **Memoria:** Estable (Reutilización de instancias).

**Recomendación:** Continuar con el desarrollo sin refactorizaciones mayores de optimización en este momento.
