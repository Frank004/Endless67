# 🎮 Ideas de Mecánicas para ENDLESS67

Este documento contiene ideas de nuevas mecánicas y elementos de juego con detalles de implementación.

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
  - Altura mínima: 500m+
  - Debe tener espacio vertical suficiente (gap de 300-400px entre entrada y salida)
- **Código**:
  ```js
  // Nueva clase Pipe o en Game.js
  spawnPipe(entryY, exitY) {
    let entry = this.pipes.create(200, entryY, 'pipe_entry');
    let exit = this.pipes.create(200, exitY, 'pipe_exit');
    entry.setData('exitY', exitY);
    // Overlap: if (player overlaps entry) player.y = exitY - 50;
  }
  ```

---

## ⚖️ 3. Plataformas Sube y Baja (See-Saw)

### Descripción
Plataforma que se balancea cuando el jugador está en ella, creando movimiento dinámico.

### Implementación
- **Sprite**: Textura `seesaw` o usar plataforma normal con física especial
- **Física**:
  - Usar `setAngularVelocity()` o `setRotation()` basado en posición del jugador
  - Si jugador está a la izquierda, rotar hacia la izquierda
  - Si jugador está a la derecha, rotar hacia la derecha
  - Aplicar fuerza al jugador basada en la rotación
- **Spawn**:
  - Probabilidad media (15-20%)
  - Altura mínima: 300m+
- **Código**:
  ```js
  // En update() o en clase SeesawPlatform
  if (player.x < seesaw.x) {
    seesaw.setAngularVelocity(-50);
  } else {
    seesaw.setAngularVelocity(50);
  }
  // Aplicar impulso al jugador basado en rotación
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
  - Probabilidad: 10-15% después de 1000m
  - Altura mínima: 1000m+
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
  - Probabilidad: 20-25% después de 1500m
  - Altura mínima: 1500m+
  - Solo en esquinas, no en el centro
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
  - Probabilidad: 15-20% después de 800m
  - Altura mínima: 800m+
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
  - Probabilidad: 10-15% después de 1000m
  - Altura mínima: 1000m+
  - Pueden estar en:
    - Paredes (izquierda/derecha)
    - Techos (parte superior de bloques)
    - Bordes de plataformas
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
  - Probabilidad: 10-15% después de 1200m
  - Altura mínima: 1200m+
  - Solo en paredes (izquierda o derecha)
  - Debe haber plataforma de escape cerca
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

## 📋 Prioridades Sugeridas

1. **Alta Prioridad** (Fácil de implementar, gran impacto):
   - Plataformas Temporales
   - Púas en Paredes/Piso
   - Enemigo Disparador Diagonal

2. **Media Prioridad** (Moderada complejidad):
   - Plataforma Trampolín
   - Enemigos Voladores en Círculo
   - Pared Resbaladiza

3. **Baja Prioridad** (Más complejo, requiere más trabajo):
   - Tubo (Pipe)
   - Plataformas Sube y Baja

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

