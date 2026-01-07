Gameplay base changes plan

- Revisar layout actual del gameplay y contenedor principal para recortar 50px fijos para el ad fuera del game stage.
- Crear el cintillo de ads (50px) sticky al fondo de la pantalla, separado del game stage; ajustar el game stage para que su altura efectiva pierda esos 50px.
- Mantener el comportamiento actual de lava: arranca desde el fondo de pantalla y sube; asegurarse de que al iniciar cubra el `StageFloor` cuando asciende.
- Añadir `StageFloor` (64px) dentro del game stage, ubicado encima del ad, estático y visible al inicio.
- Ajustar el spawn del player sobre `StageFloor`; eliminar/omitir la primera plataforma previa.
- Configurar que slots/obstáculos comiencen 160px por encima de `StageFloor` (validar si ya ocurre).
- Probar en gameplay: ad siempre visible, lava sube desde el fondo y cubre `StageFloor`, player spawnea en `StageFloor`, sin solapes ni offsets incorrectos.
