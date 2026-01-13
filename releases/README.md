# 📦 Releases

Este directorio contiene las notas de release generadas automáticamente para cada versión del juego.

## 🚀 Cómo crear releases retroactivos

### Paso 1: Generar tags y notas de release

```bash
node scripts/create-releases.js
```

Este script:
- ✅ Crea tags de Git para cada versión (v0.0.30 - v0.0.41)
- ✅ Genera notas de release basadas en los commits
- ✅ Guarda las notas en `releases/`

### Paso 2: Publicar tags en GitHub

```bash
git push origin --tags
```

### Paso 3: Crear releases en GitHub

Tienes dos opciones:

#### Opción A: Usando GitHub CLI (Recomendado)

```bash
# Asegúrate de tener GitHub CLI instalado
# https://cli.github.com/

# Autenticarte si es necesario
gh auth login

# Publicar todos los releases
./scripts/publish-releases.sh
```

#### Opción B: Manualmente desde GitHub

1. Ve a tu repositorio en GitHub
2. Click en "Releases" → "Create a new release"
3. Para cada versión:
   - **Tag version**: Selecciona el tag (ej: `v0.0.41`)
   - **Release title**: `v0.0.41`
   - **Description**: Copia el contenido de `releases/v0.0.41.md`
   - Click "Publish release"

## 📋 Versiones disponibles

- v0.0.30 - v0.0.41 (12 releases)

## 🔄 Actualizar para nuevas versiones

Cuando actualices la versión en `build.json` y `index.html`:

1. Haz commit del cambio de versión
2. Ejecuta: `node scripts/create-releases.js`
3. Revisa la nueva nota de release generada
4. Crea el release en GitHub

## 📝 Formato de las notas de release

Las notas se generan automáticamente categorizando los commits:
- ✨ **Features**: Nuevas funcionalidades
- 🐛 **Fixes**: Correcciones de bugs
- 🔧 **Refactors**: Refactorizaciones de código
- 📦 **Chores**: Tareas de mantenimiento
- 📝 **Other Changes**: Otros cambios

## 🎯 Próximos pasos

Para crear releases desde v0.0.0 hasta v0.0.29, necesitarás:
1. Buscar los commits de cambio de versión en el historial
2. Actualizar el array `VERSIONS` en `scripts/create-releases.js`
3. Ejecutar el script nuevamente

