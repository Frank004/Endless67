# 📋 Instrucciones para Publicar en GitHub Pages

## Paso 1: Crear el Repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Configura el repositorio:
   - **Repository name**: `Endless67` (o el nombre que prefieras)
   - **Description**: "Vertical Runner - Juego móvil desarrollado con Phaser.js"
   - **Visibilidad**: Público (necesario para GitHub Pages gratuito)
   - **NO marques** "Initialize this repository with a README" (ya tenemos uno)
5. Haz clic en **"Create repository"**

## Paso 2: Conectar el Repositorio Local con GitHub

Ejecuta estos comandos en la terminal (reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub):

```bash
cd /Users/frank004/Documents/Endless67
git remote add origin https://github.com/TU_USUARIO/Endless67.git
git push -u origin main
```

Si GitHub te muestra una URL diferente (con SSH o diferente nombre), usa esa URL en lugar de la del ejemplo.

## Paso 3: Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Haz clic en **"Settings"** (Configuración) en el menú superior del repositorio
3. En el menú lateral izquierdo, busca y haz clic en **"Pages"**
4. En la sección **"Source"**:
   - Selecciona **"Deploy from a branch"**
   - En **"Branch"**, selecciona **"main"**
   - En **"Folder"**, selecciona **"/ (root)"**
5. Haz clic en **"Save"**

## Paso 4: Acceder a tu Juego

Después de unos minutos, tu juego estará disponible en:
```
https://TU_USUARIO.github.io/Endless67/
```

GitHub Pages puede tardar 1-2 minutos en publicar tu sitio por primera vez.

## 🔄 Actualizar el Juego

Cada vez que hagas cambios y quieras actualizar el juego en GitHub Pages:

```bash
cd /Users/frank004/Documents/Endless67
git add .
git commit -m "Tu mensaje de commit"
git push
```

Los cambios se reflejarán automáticamente en GitHub Pages en unos minutos.

## ✅ Verificación

- ✅ El archivo `index.html` está en la raíz del proyecto
- ✅ El repositorio está inicializado con Git
- ✅ El commit inicial está hecho
- ✅ La rama principal se llama `main`

¡Listo para publicar! 🚀

