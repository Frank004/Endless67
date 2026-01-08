# 🎮 ENDLESS67 - Vertical Runner

Un juego de plataformas vertical infinito desarrollado con Phaser.js. Escapa de la lava que te persigue mientras saltas entre plataformas, recolectas monedas, evitas enemigos y superas laberintos desafiantes.

## 🎯 Características Principales

### 🎮 Gameplay
- **Modo infinito**: Generación procedural de niveles que se adapta a tu progreso
- **Sistema de slots**: Plataformas, laberintos y zonas seguras generadas dinámicamente
- **Progresión por altura**: Dificultad y mecánicas que evolucionan según la altura alcanzada
- **Lava dinámica**: La lava acelera progresivamente, aumentando la tensión

### 🏃 Mecánicas de Movimiento
- **Doble salto**: Combina saltos normales y dobles para alcanzar mayores alturas
- **Wall jump**: Salta contra las paredes laterales con sistema de stamina (máximo 5 consecutivos)
- **Plataformas móviles**: Plataformas que se desplazan horizontalmente
- **Plataformas en zigzag**: Patrones de plataformas que desafían tu precisión

### 🎯 Sistemas de Juego
- **Sistema de monedas**: Recolecta monedas para aumentar tu puntuación
- **Powerups**: Escudo de invencibilidad temporal para superar secciones difíciles
- **Sistema de milestones**: Indicadores visuales que muestran las mejores puntuaciones del leaderboard
- **Sistema de puntuación**: Combina altura alcanzada y monedas recolectadas

### 👾 Enemigos
- **Patrol Enemy**: Enemigos que patrullan las plataformas
- **Shooter Enemy**: Enemigos que disparan proyectiles (2-shot y 3-shot)
- **Fast Shooter**: Enemigos con disparos rápidos
- **Jumper Shooter**: Enemigos que saltan y disparan simultáneamente

### 🌀 Laberintos (Mazes)
- **15+ patrones únicos**: Diferentes configuraciones de laberintos
- **Transformaciones**: Espejos horizontales y verticales para variar los desafíos
- **Enemigos en laberintos**: Algunos laberintos incluyen enemigos para mayor dificultad
- **Coins y powerups**: Recompensas estratégicamente colocadas en los laberintos

### 📊 Progresión y Dificultad
- **Sistema de dificultad adaptativa**: La dificultad aumenta con la altura
- **Niveles implícitos**: Cada 1000m representa un nuevo nivel de desafío
- **Configuración por altura**: Diferentes mecánicas se introducen según tu progreso
- **Zonas seguras**: Áreas de descanso estratégicamente ubicadas

## 🎮 Controles

### 📱 Móvil/Tablet
- **Izquierda de la pantalla**: Mantén presionado y desliza para mover al personaje
- **Derecha de la pantalla**: Toca para saltar
- **Joystick virtual**: Opcional, configurable en Settings

### 💻 Computadora
- **Teclado**:
  - **Flechas ← → / A D**: Mover al personaje izquierda/derecha
  - **SPACE**: Saltar
  - **Wall Jump**: Salta contra las paredes laterales (máximo 5 consecutivos)
- **Gamepad**: Compatible con Xbox Controller y otros gamepads estándar
  - **Stick izquierdo / D-Pad**: Mover al personaje
  - **A / X**: Saltar

## 🚀 Cómo Jugar

1. Abre el juego en tu navegador o dispositivo móvil
2. Selecciona "START GAME" en el menú principal
3. Usa los controles para moverte y saltar
4. Recolecta monedas para aumentar tu puntuación
5. Evita enemigos y supera los laberintos
6. ¡Escapa de la lava que te persigue y alcanza nuevas alturas!

### 💡 Consejos
- **Wall jumps**: Úsalos estratégicamente para alcanzar plataformas más altas
- **Powerups**: Los escudos te dan invencibilidad temporal - úsalos sabiamente
- **Milestones**: Observa los indicadores de color que muestran las mejores puntuaciones
- **Zonas seguras**: Aprovecha las zonas seguras para planificar tu siguiente movimiento

## 🛠️ Tecnologías

- **Phaser.js 3.87.0**: Motor de juego 2D
- **HTML5 Canvas**: Renderizado del juego
- **JavaScript ES6+**: Lógica del juego con módulos ES6
- **PWA (Progressive Web App)**: Instalable en dispositivos móviles
- **Service Worker**: Soporte offline y caché inteligente
- **LocalStorage**: Persistencia de puntuaciones y configuraciones

## 📱 Compatibilidad

- ✅ Dispositivos móviles (iOS, Android)
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Tablets y escritorio
- ✅ Modo PWA: Instalable como app nativa
- ✅ Soporte para gamepads (Xbox Controller, etc.)

## 🌐 Jugar Online

El juego está disponible en GitHub Pages:

🎮 **[Jugar Ahora](https://frank004.github.io/Endless67/)**

O visita el repositorio: [https://github.com/Frank004/Endless67](https://github.com/Frank004/Endless67)

## 📝 Licencia

Este es un proyecto privado. Todos los derechos reservados.

## 🎨 Características Técnicas

### 🏗️ Arquitectura
- **Sistema de slots**: Generación procedural de niveles con `SlotGenerator`
- **Object pooling**: Optimización de rendimiento con reutilización de objetos
- **Sistema de eventos**: Comunicación desacoplada con `EventBus`
- **Gestión de estado**: Sistema centralizado de estado del juego
- **Manejo de colisiones**: Sistema modular de detección y respuesta

### 🎯 Sistemas Implementados
- ✅ Sistema de slots (PLATFORM_BATCH, MAZE, SAFE_ZONE)
- ✅ Generación procedural de plataformas con patrones
- ✅ Sistema de laberintos con 15+ patrones únicos
- ✅ Sistema de enemigos (3 tipos diferentes)
- ✅ Sistema de powerups (escudo de invencibilidad)
- ✅ Sistema de milestones (indicadores de leaderboard)
- ✅ Sistema de dificultad progresiva
- ✅ Sistema de audio con efectos de sonido
- ✅ Sistema de animaciones (running, jumping, wall sliding, etc.)
- ✅ Sistema de background dinámico
- ✅ Sistema de UI modular (menús, HUD, indicadores)
- ✅ Sistema de leaderboard con persistencia local
- ✅ Sistema de settings (sonido, joystick, etc.)
- ✅ Dev Mode: Modo de desarrollo para testing

### 📦 Estructura del Proyecto
```
src/
├── core/           # Estado del juego, eventos, inicialización
├── managers/       # Gestores de sistemas (UI, audio, colisiones, etc.)
├── prefabs/        # Prefabricados (Player, Enemy, Platform, etc.)
├── scenes/         # Escenas de Phaser (Game, MainMenu, etc.)
├── config/         # Configuraciones y constantes
├── data/           # Datos (patrones, configuraciones de niveles)
└── utils/          # Utilidades y helpers
```

## 👨‍💻 Desarrollo

### Requisitos
- Navegador moderno con soporte para ES6 modules
- Servidor local (opcional, para desarrollo)

### Ejecutar Localmente

**Opción 1: Servidor simple**
```bash
# Con Python
python -m http.server 8000

# Con Node.js (http-server)
npx http-server
```

**Opción 2: Abrir directamente**
```bash
# Simplemente abre index.html en tu navegador
# Nota: Algunas características pueden requerir un servidor
```

### Dev Mode
- Accede al Dev Mode tocando 5 veces la versión en el menú principal
- Permite probar mecánicas específicas, spawnear enemigos, laberintos, etc.

## 📝 Versión Actual

**v0.0.42** - Sistema de milestones y mejoras de UI

Ver todas las versiones en [Releases](https://github.com/Frank004/Endless67/releases)

## 🤝 Contribuciones

Este es un proyecto personal, pero las sugerencias y feedback son bienvenidos.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Diviértete jugando y alcanza nuevas alturas! 🎮🚀**

