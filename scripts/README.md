# Scripts de Build

## Incrementar Build Number

El build number se usa para cache-busting en GitHub Pages. Cada vez que hagas un push (fixes, mejoras, etc.), incrementa el build number para que los usuarios carguen la versión más reciente.

El script actualiza automáticamente:
- `build.json` (incrementa el build number)
- `index.html` (actualiza los cache-busters en CSS y JS)

### Opción 1: Script Node.js (Recomendado)
```bash
node scripts/increment-build.js
```

### Opción 2: Script Shell
```bash
./scripts/increment-build.sh
```

### Flujo de trabajo recomendado:
1. Hacer tus cambios
2. Ejecutar el script para incrementar el build number:
   ```bash
   node scripts/increment-build.js
   ```
3. `git add .`
4. `git commit -m "tu mensaje"`
5. `git push`

**Nota:** El build number es independiente de la versión. La versión (`v0.0.35`) se muestra al usuario, mientras que el build number se usa solo para cache-busting en los URLs (`?b=2`, `?b=3`, etc.).

