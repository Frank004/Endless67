---
trigger: always_on
---

Preguntar por si deseas crear un add., commit, push.

✅ Commit Messages

🔒 Reglas Generales
	•	Cuando termines de aplicar cambios, la última línea del mensaje (en el cuerpo o como recordatorio para ti) debe decir:
“Don’t forget to commit!”
	•	Siempre prefija los mensajes de commit usando el formato de abajo. Sin excepciones.
	•	Mantén los mensajes cortos pero descriptivos.

⸻

🏷️ Prefijos Permitidos

Formato:
<type>(<scope>): <short message>

Tipos estándar
	•	Feat(...): Nueva funcionalidad.
	•	Fix(...): Corrección de bug.
	•	Refactor(...): Cambio interno de código sin cambiar comportamiento.
	•	Style(...): Cambios de estilo que no alteran lógica (lint, formateo, etc.).
	•	Test(...): Tests añadidos o modificados.
	•	Docs(...): Documentación.
	•	Chore(...): Mantenimiento, scripts, configs, dependencias.

⸻

🕹️ Scopes recomendados para Phaser.js

Usa scopes que describan la parte del juego:
	•	scene – escenas de Phaser (Game, Menu, HUD, etc.)
	•	player – lógica y físicas del jugador
	•	enemy – IA, patrullas, disparos, etc.
	•	physics – colisiones, bodies, gravedad, world bounds
	•	ui – HUD, overlays, menús, botones
	•	assets – sprites, atlas, sonidos, fuentes
	•	camera – follow, shake, zoom, efectos
	•	level – generación de niveles, mazes, plataformas
	•	build – Vite/Webpack/Rollup, npm scripts
	•	config – constantes, difficulty, tuning del juego
	•	input – teclado, touch, swipe, gamepad

⸻

🎮 Ejemplos de commits para Phaser.js

✅ Ejemplos estándar
	•	Feat(scene): add pause menu scene
	•	Feat(player): add double jump mechanic
	•	Fix(physics): prevent player from clipping through platforms
	•	Fix(enemy): stop patrollers from falling off maze blocks
	•	Refactor(enemy): extract shared patrol logic to helper
	•	Refactor(level): cleanup maze generation code
	•	Style(code): run eslint and format files
	•	Test(utils): add unit tests for spawn helpers
	•	Docs(readme): document game controls and powerups
	•	Chore(assets): compress spritesheets and update paths
	•	Chore(deps): update phaser to latest version

🎯 Phaser-Specific Examples
	•	Feat(scene): add main menu with start and settings buttons
	•	Feat(player): integrate new pixel art sprite and animations
	•	Feat(enemy): add shooter enemy with projectile pattern
	•	Fix(camera): fix camera follow jitter on vertical scroll
	•	Fix(collision): adjust hitbox for player vs coins overlap
	•	Refactor(physics): centralize arcade physics config
	•	Refactor(ui): move score and height display into HUD scene
	•	Chore(config): tweak gravity and jump height for better feel
	•	Chore(build): add npm script to build production bundle
	•	Docs(architecture): describe scene flow and level manager

⸻

Actualiza antes de cada push esta linea en el index
<script type="module" src="src/main.js?v=20241124-1738"> </script>
para que cuando suba el githubpage actualice la versión y el cache para todos los testers.
incluyelo como un commit antes del push


🛎️ Y recuerda:
“Don’t forget to commit!”

 Ejemplo de uso:
git commit -m "Fix(enemy): stop patrollers from walking off moving platforms"