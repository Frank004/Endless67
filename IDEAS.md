# 🎮 Ideas de Mecánicas para ENDLESS67

Este documento contiene ideas de nuevas mecánicas y elementos de juego con detalles de implementación.

---

## 📈 Sistema de Progresión por Altura (Niveles Implícitos)

### Concepto
El juego debe sentir un efecto de niveles sin niveles explícitos. Cada **1000m alcanzado** representa un mini progreso con:
- Nuevos enemigos
- Nuevas mecánicas
- Combinaciones de funciones existentes
- Aumento gradual de dificultad

### Estructura de Progresión Sugerida

- **0-1000m**: Tutorial y mecánicas básicas
  - Single jump, double jump, wall jump
  - Enemigos básicos (spikes)
  - Plataformas estáticas y móviles básicas

- **1000-2000m**: Introducción de nuevas mecánicas
  - Plataformas temporales
  - Enemigos voladores
  - Púas en paredes/piso
  - Combinaciones básicas

- **2000-3000m**: Mecánicas intermedias
  - Plataforma trampolín
  - Enemigo disparador diagonal
  - Pared resbaladiza
  - Combinaciones más complejas

- **3000-4000m**: Mecánicas avanzadas
  - Plataformas sube y baja
  - Tubo (pipe) - muy raro
  - Combinaciones avanzadas de todas las mecánicas

- **4000m+**: Máxima dificultad
  - Todas las mecánicas disponibles
  - Combinaciones complejas y desafiantes
  - Nuevos patrones de enemigos
  - Variaciones de mecánicas existentes

### Implementación
- Cada mecánica debe tener una **altura mínima** para aparecer
- La **probabilidad de spawn** puede aumentar gradualmente con la altura
- Las **combinaciones** de mecánicas deben ser más frecuentes en alturas mayores
- Cada 1000m puede tener un "checkpoint visual" o efecto especial (opcional)

---

## 🚀 1. Plataforma Trampolín

### Descripción
Plataforma especial que da un impulso extra al jugador cuando aterriza en ella, permitiendo saltos más altos.

### Implementación
- **Sprite**: Nueva textura `trampoline` (visualmente diferente, quizás con efecto de resorte)
- **Física**: 
  - Colisión normal con el jugador
  - Al detectar `touching.down`, aplicar `setVelocityY(-800)` o similar (más fuerte que salto normal)
  - Opcional: efecto visual de "rebote" (scale animation)
- **Spawn**: 
  - Probabilidad baja (5-10%) en plataformas normales
  - Puede reemplazar una plataforma estática ocasionalmente
  - **Altura mínima: 2000m+** (Segunda etapa de progresión)
  - Probabilidad aumenta gradualmente: 5% a 2000m → 10% a 3000m+
- **Código**:
  ```js
  // En spawnPlatform o nueva función spawnTrampoline
  if (Phaser.Math.Between(0, 100) < 8) {
    let tramp = this.platforms.create(x, y, 'trampoline');
    tramp.setData('isTrampoline', true);
    // En handleLand: if (platform.getData('isTrampoline')) player.setVelocityY(-800);
  }
  ```

---

## 🟢 2. Tubo (Pipe estilo Mario)

### Descripción
Tubo vertical que permite al jugador "entrar" y aparecer más arriba, acortando el camino. Raro o secreto.

### Implementación
- **Sprite**: Textura `pipe` (tubo vertical, entrada arriba y abajo)
- **Física**:
  - Dos zonas de entrada: superior e inferior
  - Al entrar (overlap con entrada), teletransportar al jugador a la salida
  - Efecto visual: fade out/in o animación de "entrar al tubo"
- **Spawn**:
  - Muy raro (1-2% de probabilidad)
  - **Altura mínima: 3000m+** (Tercera etapa de progresión - mecánica avanzada)
  - Debe tener espacio vertical suficiente (gap de 300-400px entre entrada y salida)
  - Probabilidad aumenta ligeramente con altura: 1% a 3000m → 2% a 4000m+
- **Efecto Visual - Animación/Shader dentro del Pipe**:
  - **Opción 1: Shader Pipeline (Recomendado)**:
    - Crear `PipePipeline.js` similar a `LavaPipeline.js`
    - Efecto de "túnel" usando distorsión radial y oscurecimiento
    - Shader que simula estar dentro de un tubo circular
    - Variables: `uTime` para animación, `uDepth` para efecto de profundidad
  - **Opción 2: Animación con Sprites**:
    - Secuencia de sprites que muestran el interior del tubo
    - Frames animados de "entrando al tubo" → "dentro del tubo" → "saliendo"
    - Usar `tweens` para fade y scale durante la transición
  - **Opción 3: Efecto Híbrido**:
    - Shader para el efecto visual base (distorsión, oscurecimiento)
    - Partículas o sprites animados para detalles (líneas de velocidad, brillos)
    - Overlay oscuro con borde circular que simula la vista desde dentro
- **Código**:
  ```js
  // Nueva clase Pipe o en Game.js
  spawnPipe(entryY, exitY) {
    let entry = this.pipes.create(200, entryY, 'pipe_entry');
    let exit = this.pipes.create(200, exitY, 'pipe_exit');
    entry.setData('exitY', exitY);
    // Overlap: if (player overlaps entry) {
    //   this.enterPipe(player, exitY);
    // }
  }
  
  enterPipe(player, exitY) {
    // Aplicar shader/overlay de "dentro del tubo"
    if (this.game.renderer.type === Phaser.WEBGL) {
      player.setPostPipeline('PipePipeline');
    }
    
    // Animación de entrada
    this.tweens.add({
      targets: player,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.3,
      duration: 300,
      onComplete: () => {
        // Teletransportar
        player.y = exitY - 50;
        // Animación de salida
        this.tweens.add({
          targets: player,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          duration: 300,
          onComplete: () => {
            player.clearPostPipeline();
          }
        });
      }
    });
  }
  ```
- **Shader Pipeline (PipePipeline.js)**:
  ```js
  // Efecto de túnel circular con distorsión
  fragShader: `
    precision mediump float;
    uniform sampler2D uMainSampler;
    uniform float uTime;
    uniform float uDepth;
    varying vec2 outTexCoord;
    
    void main() {
      vec2 uv = outTexCoord;
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      // Efecto de túnel: distorsión radial
      float angle = atan(uv.y - center.y, uv.x - center.x);
      float radius = dist * (1.0 + sin(uTime * 2.0) * 0.1);
      vec2 tunnelUV = center + vec2(cos(angle), sin(angle)) * radius;
      
      // Oscurecimiento hacia los bordes (simula estar dentro del tubo)
      float vignette = 1.0 - smoothstep(0.3, 0.5, dist);
      vec4 color = texture2D(uMainSampler, tunnelUV);
      color.rgb *= vignette * (0.5 + uDepth * 0.5); // Más oscuro = más profundo
      
      gl_FragColor = color;
    }
  `
  ```

---

## ⚖️ 3. Plataformas Sube y Baja (See-Saw)

### Descripción
Plataforma que se mueve verticalmente (sube y baja) cuando el jugador está en ella, creando movimiento dinámico. El jugador puede moverse horizontalmente mientras la plataforma oscila verticalmente.

### Implementación
- **Sprite**: Textura `seesaw` o usar plataforma normal con física especial
- **Física**:
  - Movimiento vertical oscilante usando `setVelocityY()` o `setY()` con función seno/coseno
  - Cuando el jugador está en la plataforma, la plataforma sube y baja automáticamente
  - El jugador puede moverse horizontalmente normalmente mientras está en la plataforma
  - Velocidad vertical de la plataforma: oscilación suave (ej: -100 a +100 px/s)
  - El jugador mantiene su velocidad horizontal pero hereda la velocidad vertical de la plataforma
- **Spawn**:
  - Probabilidad media (15-20%)
  - **Altura mínima: 3000m+** (Tercera etapa de progresión - mecánica avanzada)
  - Probabilidad aumenta gradualmente: 15% a 3000m → 20% a 4000m+
- **Código**:
  ```js
  // En clase SeesawPlatform o en update()
  class SeesawPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, 'seesaw');
      this.baseY = y; // Posición base
      this.oscillationSpeed = 2; // Velocidad de oscilación
      this.oscillationRange = 60; // Rango de movimiento vertical (px)
      this.time = 0;
    }
    
    update(time, delta) {
      this.time += delta;
      // Movimiento vertical oscilante
      this.y = this.baseY + Math.sin(this.time / 1000 * this.oscillationSpeed) * this.oscillationRange;
      
      // Si el jugador está en la plataforma, aplicar velocidad vertical
      if (this.body.touching.up && this.scene.player.body.touching.down) {
        // El jugador hereda la velocidad vertical de la plataforma
        this.scene.player.body.velocity.y = this.body.velocity.y;
      }
    }
  }
  
  // O usando tweens para movimiento más suave
  // this.tweens.add({
  //   targets: seesaw,
  //   y: seesaw.y - 60,
  //   duration: 1000,
  //   yoyo: true,
  //   repeat: -1,
  //   ease: 'Sine.easeInOut'
  // });
  ```

---

## 🌀 4. Enemigos Voladores en Círculo

### Descripción
Enemigos que vuelan en un patrón circular. El área no debe tener plataformas en la línea de trayectoria.

### Implementación
- **Sprite**: Nueva textura `flying_enemy` o reutilizar enemigo existente
- **Física**:
  - Movimiento circular usando `Math.sin()` y `Math.cos()` con tiempo
  - Radio del círculo: 80-120px
  - Velocidad angular constante
  - Puede tener una plataforma en el centro que el enemigo rodea
- **Spawn**:
  - Crear "zona de vuelo" sin plataformas en el área del círculo
  - **Altura mínima: 1000m+** (Primera etapa de progresión)
  - Probabilidad: 10% a 1000m → 15% a 2000m+
  - A partir de 3000m: variaciones con diferentes radios y velocidades
- **Código**:
  ```js
  // Nueva clase FlyingEnemy
  update(time) {
    const radius = 100;
    const centerX = this.spawnX;
    const centerY = this.spawnY;
    const angle = (time / 1000) * this.speed; // velocidad angular
    this.x = centerX + Math.cos(angle) * radius;
    this.y = centerY + Math.sin(angle) * radius;
  }
  // Al spawnear: verificar que no haya plataformas en radio + 20px
  ```

---

## 🎯 5. Enemigo que Dispara Diagonal (Esquinas)

### Descripción
Enemigo posicionado en esquinas (superior izquierda/derecha) que dispara proyectiles en diagonal hacia abajo.

### Implementación
- **Sprite**: Nueva textura `corner_shooter` o variante de ShooterEnemy
- **Física**:
  - Posición fija en esquina (x: 50 o 350, y: altura específica)
  - Dispara proyectiles con velocidad diagonal (velX: ±200, velY: 200)
  - Proyectiles siguen patrón diagonal hacia abajo
- **Spawn**:
  - **Altura mínima: 2000m+** (Segunda etapa de progresión)
  - Probabilidad: 20% a 2000m → 25% a 3000m+
  - Solo en esquinas, no en el centro
  - A partir de 3000m: puede combinarse con otras mecánicas (ej: esquina con púas)
- **Código**:
  ```js
  // Extender ShooterEnemy o nueva clase CornerShooter
  shoot() {
    let proj = this.projectiles.get(this.x, this.y);
    const dirX = this.x < 200 ? 1 : -1; // izquierda o derecha
    proj.setVelocity(dirX * 200, 200); // diagonal
  }
  ```

---

## ⏱️ 6. Plataformas Temporales

### Descripción
Plataformas que aparecen y desaparecen con un timer, creando desafíos de timing.

### Implementación
- **Sprite**: Textura `platform_temporal` (quizás con efecto parpadeante o diferente color)
- **Física**:
  - Timer: aparecer por 2-3 segundos, desaparecer por 1-2 segundos
  - Usar `setVisible()` y `setActive()` para toggle
  - Opcional: efecto visual de "fade" antes de desaparecer
- **Spawn**:
  - **Altura mínima: 1000m+** (Primera etapa de progresión)
  - Probabilidad: 15% a 1000m → 20% a 2000m+
  - A partir de 2000m: variaciones con diferentes timers (más rápidas/más lentas)
  - A partir de 3000m: puede combinarse con otras mecánicas (ej: temporal + trampolín)
- **Código**:
  ```js
  // En spawnPlatform o nueva función
  let tempPlat = this.platforms.create(x, y, 'platform_temporal');
  tempPlat.setData('isTemporal', true);
  tempPlat.setData('visibleTime', 2500); // 2.5 segundos
  tempPlat.setData('hiddenTime', 1500); // 1.5 segundos
  // En update: toggle visibility basado en timer
  ```

---

## ⚡ 7. Set de Púas en Paredes/Techo/Piso

### Descripción
Púas estáticas que dañan al jugador al tocarlas. Pueden estar en paredes, techo, secciones del piso o plataformas.

### Implementación
- **Sprite**: Nueva textura `spike` (pequeña, triangular)
- **Física**:
  - Overlap con jugador (no collider, para que no bloquee movimiento)
  - Al tocar: daño al jugador (similar a `hitEnemy`)
  - Posición: puede estar en cualquier superficie
- **Spawn**:
  - **Altura mínima: 1000m+** (Primera etapa de progresión)
  - Probabilidad: 10% a 1000m → 15% a 2000m+
  - Pueden estar en:
    - Paredes (izquierda/derecha)
    - Techos (parte superior de bloques)
    - Bordes de plataformas
  - A partir de 2000m: más variaciones de posicionamiento
  - A partir de 3000m: combinaciones con otras mecánicas (ej: púas + plataforma temporal)
- **Código**:
  ```js
  // Nueva clase Spike o función spawnSpike
  spawnSpikeOnWall(side, y) {
    let spike = this.spikes.create(side === 'left' ? 32 : 368, y, 'spike');
    spike.setRotation(side === 'left' ? Math.PI / 2 : -Math.PI / 2);
  }
  // Overlap: if (player overlaps spike) hitEnemy(player, spike);
  ```

---

## 💧 8. Área de Pared Resbaladiza (Slime/Agua)

### Descripción
Zona corta de pared que es resbaladiza, el jugador no puede hacer wall jump y resbala hacia abajo.

### Implementación
- **Sprite**: Textura `slippery_wall` o overlay visual (efecto de agua/slime)
- **Física**:
  - Detectar cuando jugador toca esta zona
  - Desactivar wall jump mientras está en contacto
  - Aplicar velocidad hacia abajo constante (resbalar)
  - Zona corta: 100-150px de altura
- **Spawn**:
  - **Altura mínima: 2000m+** (Segunda etapa de progresión)
  - Probabilidad: 10% a 2000m → 15% a 3000m+
  - Solo en paredes (izquierda o derecha)
  - Debe haber plataforma de escape cerca
  - A partir de 3000m: zonas más largas o múltiples zonas consecutivas
- **Código**:
  ```js
  // Nueva clase SlipperyWallZone
  createSlipperyZone(side, startY, height) {
    let zone = this.add.zone(side === 'left' ? 0 : 400, startY, 32, height);
    zone.setData('isSlippery', true);
    // En Player: if (touching slippery zone) {
    //   canWallJump = false;
    //   setVelocityY(200); // resbalar
    // }
  }
  ```

---

## 📋 Prioridades y Progresión por Altura

### Distribución Sugerida por Altura

1. **1000-2000m** (Primera etapa de progresión):
   - ✅ Plataformas Temporales (15-20% spawn)
   - ✅ Púas en Paredes/Piso (10-15% spawn)
   - ✅ Enemigos Voladores en Círculo (10-15% spawn)

2. **2000-3000m** (Segunda etapa de progresión):
   - ✅ Plataforma Trampolín (5-10% spawn)
   - ✅ Enemigo Disparador Diagonal (20-25% spawn)
   - ✅ Pared Resbaladiza (10-15% spawn)
   - 🔄 Combinaciones: Púas + Temporales, Voladores + Trampolín

3. **3000-4000m** (Tercera etapa de progresión):
   - ✅ Plataformas Sube y Baja (15-20% spawn)
   - ✅ Tubo (Pipe) - Muy raro (1-2% spawn)
   - 🔄 Combinaciones avanzadas: Múltiples mecánicas juntas
   - 🔄 Variaciones: Enemigos voladores con diferentes patrones

4. **4000m+** (Máxima dificultad):
   - ✅ Todas las mecánicas disponibles
   - 🔄 Combinaciones complejas y desafiantes
   - 🔄 Patrones de enemigos más agresivos
   - 🔄 Variaciones de todas las mecánicas

### Notas de Implementación
- **Altura mínima**: Cada mecánica debe respetar su altura mínima
- **Probabilidad progresiva**: Aumentar probabilidad de spawn gradualmente después de la altura mínima
- **Combinaciones**: A partir de 2000m, permitir que múltiples mecánicas aparezcan juntas
- **Variaciones**: En alturas mayores, crear variaciones de mecánicas existentes (ej: enemigos voladores con diferentes radios, plataformas temporales con diferentes timers)

---

## 🎨 Consideraciones Visuales

- Todas las nuevas mecánicas deben tener feedback visual claro
- Usar colores o efectos para diferenciar elementos especiales
- Considerar partículas o efectos de sonido para mejor UX

---

## 🔧 Notas Técnicas

- Todas las nuevas mecánicas deben respetar el sistema de spawn existente
- Considerar balanceo: no hacer el juego demasiado difícil
- Probar cada mecánica individualmente antes de combinarlas
- Mantener consistencia con el estilo visual actual

