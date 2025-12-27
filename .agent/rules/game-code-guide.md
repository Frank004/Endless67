---
trigger: always_on
---

REGLAS GENERALES
	1.	Siempre que propongas arquitectura, prefiere soluciones simples adecuadas para un juego básico.
	•	Si la solución que propones es muy compleja para un juego pequeño, explícitamente sugiere una versión más simple.
	2.	Evita patrones avanzados innecesarios (Clean Architecture extrema, DDD pesado, etc.) para prototipos.
	3.	Cuando tengas dudas entre algo muy elaborado o algo directo, elige la opción más simple pero escalable.
	4.	No crees documentación al menos que yo te lo pida.

⸻

REGLAS PARA SINGLETON
	1.	Sugiere o usa Singleton solo para cosas verdaderamente globales:
	•	Estado global de juego (nivel actual, modo, dificultad).
	•	Gestor de audio (AudioManager).
	•	Gestor de guardado (SaveManager).
	•	Bus de eventos (EventBus) si hace sentido.
	2.	No conviertas en singleton:
	•	Enemigos, plataformas, balas o entidades del nivel.
	•	UI específica de una escena.
	3.	Cuando propongas un Singleton:
	•	Manténlo con responsabilidad única clara.
	•	Muestra siempre un ejemplo de cómo se accede: GameState.instance, AudioManager.instance, etc.
	4.	Si el uso de Singleton podría causar acoplamiento innecesario, explícalo y ofrece una alternativa (por ejemplo, inyección por constructor, pasar referencia en el scene).

⸻

REGLAS PARA OBSERVER / EVENTOS
	1.	Usa o sugiere el Observer Pattern (EventBus, EventEmitter, Signals, etc.) para:
	•	Eventos de gameplay: player muere, recoge moneda, sube score, termina nivel, etc.
	•	Comunicación entre sistemas desacoplados: Player → UI, Enemigo → Score, PowerUp → Player / HUD.
	2.	No uses el sistema de eventos para cosas triviales que pueden llamarse directo.
	3.	Cuando propongas eventos:
	•	Usa nombres claros y consistentes: "PLAYER_DIED", "COIN_COLLECTED", "SCORE_UPDATED".
	•	Incluye el tipo de payload esperado.
	•	Muestra ejemplo de emit y de on (suscripción).
	4.	Procura centralizar los eventos en un EventBus (que puede ser singleton) en lugar de múltiples emisores repartidos sin control.
	5.	Si la arquitectura de eventos empieza a verse muy cargada para un juego simple, advierte y sugiere simplificar.

⸻

CUANDO EL PATRÓN ES DEMASIADO PARA EL CASO
	1.	Si la funcionalidad se resuelve de forma sencilla con:
	•	Una función directa.
	•	Una referencia pasada por parámetros.
	•	O una variable local de escena/nivel.
Entonces dilo explícitamente:
“Para un prototipo simple, esto puede ser una función directa en la escena sin necesidad de Singleton/Observer”.
	2.	Si detectas que estoy pidiendo algo que amerita un patrón (por ejemplo, muchos sistemas escuchando al mismo evento):
	•	Sugiere:
“Aquí conviene introducir un EventBus / Observer para que el código no se acople demasiado”.

⸻

ESTILO DE CÓDIGO
	1.	Prefiere ejemplos en TypeScript/JavaScript para juegos 2D (por ejemplo Phaser, o motor genérico) a menos que pida otra cosa.
	2.	Comenta brevemente por qué usas Singleton u Observer en cada ejemplo.
	3.	Mantén los ejemplos cortos y aplicables a juegos: player, score, enemigos, UI, etc.