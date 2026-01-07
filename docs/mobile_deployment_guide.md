# 📱 Endless67 - Mobile Deployment Guide
**Guía completa para publicar en App Store y Play Store usando Capacitor**

---

## 🚀 PARTE 1: OPTIMIZACIONES INMEDIATAS (Sin Instalaciones)

Estas mejoras se pueden implementar **ahora mismo** sin afectar la funcionalidad actual del juego.

### ✅ Tareas Implementables Ahora

#### 1. Meta Tags para Mobile (5 min)
**Archivo**: `index.html`

Agregar/verificar estos meta tags:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-fullscreen">
<meta name="theme-color" content="#000000">
```

**Beneficio**: Mejor experiencia en navegadores móviles, preparación para app nativa.

---

#### 2. Manifest.json para PWA (10 min)
**Archivo**: `public/manifest.json` (crear si no existe)

```json
{
  "name": "Endless67",
  "short_name": "Endless67",
  "description": "Endless vertical platformer game",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Agregar en `index.html`:
```html
<link rel="manifest" href="/manifest.json">
```

**Beneficio**: Permite instalar el juego como PWA en móviles antes de tener la app nativa.

---

#### 3. Prevenir Comportamientos No Deseados en Mobile (5 min)
**Archivo**: `index.css` o `style.css`

```css
/* Prevenir selección de texto */
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Prevenir zoom en inputs (si tienes) */
input, textarea {
  font-size: 16px; /* iOS no hace zoom si es >= 16px */
}

/* Prevenir pull-to-refresh en Chrome mobile */
body {
  overscroll-behavior-y: contain;
}

/* Safe area para notch de iPhone */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

**Beneficio**: Experiencia más nativa, sin comportamientos de navegador.

---

#### 4. Iconos y Assets (30 min)
**Requisito de tu parte**: Crear iconos del juego

**Tamaños necesarios**:
- `icon-192.png` (192x192) - PWA
- `icon-512.png` (512x512) - PWA
- `icon-1024.png` (1024x1024) - App Store
- Splash screen (2732x2732) - Opcional pero recomendado

**Ubicación**: `public/` directory

**Herramientas recomendadas**:
- [Favicon Generator](https://realfavicongenerator.net/)
- [App Icon Generator](https://www.appicon.co/)

---

#### 5. Service Worker para Offline (Opcional, 15 min)
**Archivo**: `public/sw.js` (crear)

```javascript
const CACHE_NAME = 'endless67-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

Registrar en `index.html`:
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

**Beneficio**: El juego funciona offline (útil para app nativa también).

---

## 📋 PARTE 2: PREPARACIÓN PARA CAPACITOR

### Requisitos Previos

#### Software Necesario
- [x] Node.js (ya instalado)
- [ ] **Android Studio** - Para builds de Android
  - Descarga: https://developer.android.com/studio
  - Tamaño: ~1GB
  - Tiempo instalación: 30-60 min
- [ ] **Xcode** - Para builds de iOS (solo Mac)
  - Descarga: App Store
  - Tamaño: ~15GB
  - Tiempo instalación: 1-2 horas
  - **Requiere**: macOS

#### Cuentas Necesarias
- [ ] **Google Play Console** - Para publicar en Play Store
  - Costo: $25 USD (pago único)
  - Link: https://play.google.com/console
- [ ] **Apple Developer Program** - Para publicar en App Store
  - Costo: $99 USD/año
  - Link: https://developer.apple.com/programs/
  - **Requiere**: Mac para desarrollo iOS

---

## 🔧 PARTE 3: IMPLEMENTACIÓN DE CAPACITOR

### Fase 1: Instalación y Configuración (30 min)

#### Paso 1: Instalar Capacitor
```bash
cd /Users/frank004/Documents/Endless67
npm install @capacitor/core @capacitor/cli
```

#### Paso 2: Inicializar Capacitor
```bash
npx cap init
```

**Respuestas al prompt**:
- App name: `Endless67`
- App ID: `com.frank004.endless67` (o tu dominio)
- Web directory: `dist`

#### Paso 3: Verificar configuración
**Archivo**: `capacitor.config.json` (se crea automáticamente)

```json
{
  "appId": "com.frank004.endless67",
  "appName": "Endless67",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
```

---

### Fase 2: Agregar Plataformas (15 min)

#### Paso 1: Build del juego
```bash
npm run build
```

#### Paso 2: Agregar plataformas
```bash
# Android
npx cap add android

# iOS (solo en Mac)
npx cap add ios
```

**Resultado**: Se crean carpetas `android/` e `ios/` en la raíz del proyecto.

#### Paso 3: Copiar assets
```bash
npx cap copy
```

**Importante**: Ejecutar este comando cada vez que hagas cambios al juego.

---

### Fase 3: Plugins Útiles (Opcional, 20 min)

#### Vibración (Haptic Feedback)
```bash
npm install @capacitor/haptics
```

**Uso en el juego**:
```javascript
// En PlayerHandler.js cuando el jugador muere
import { Haptics } from '@capacitor/haptics';

async playerDeath() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.vibrate({ duration: 200 });
  }
  // ... resto del código
}
```

#### Mantener Pantalla Encendida
```bash
npm install @capacitor/keep-awake
```

**Uso**:
```javascript
// En Game.js al iniciar partida
import { KeepAwake } from '@capacitor/keep-awake';

startGame() {
  if (Capacitor.isNativePlatform()) {
    KeepAwake.keepAwake();
  }
  // ... resto del código
}
```

#### Status Bar Personalizado
```bash
npm install @capacitor/status-bar
```

**Uso**:
```javascript
// En Boot.js
import { StatusBar, Style } from '@capacitor/status-bar';

create() {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.hide();
  }
}
```

---

### Fase 4: Testing en Dispositivos (Variable)

#### Android (con dispositivo físico)
1. Habilitar "Developer Options" en tu Android
2. Habilitar "USB Debugging"
3. Conectar vía USB
4. Ejecutar:
```bash
npx cap open android
```
5. En Android Studio, presionar el botón "Run" (▶️)

#### Android (con emulador)
1. Abrir Android Studio
2. Tools → Device Manager → Create Virtual Device
3. Seleccionar un dispositivo (ej: Pixel 6)
4. Ejecutar:
```bash
npx cap open android
```
5. Presionar "Run" en el emulador

#### iOS (solo Mac, con dispositivo físico)
1. Conectar iPhone/iPad vía USB
2. Ejecutar:
```bash
npx cap open ios
```
3. En Xcode, seleccionar tu dispositivo
4. Presionar el botón "Run" (▶️)
5. **Primera vez**: Confiar en el certificado en Settings → General → Device Management

#### iOS (con simulador)
1. Ejecutar:
```bash
npx cap open ios
```
2. En Xcode, seleccionar un simulador (ej: iPhone 15 Pro)
3. Presionar "Run"

---

## 📦 PARTE 4: PUBLICACIÓN EN TIENDAS

### Google Play Store

#### Requisitos
- [ ] Cuenta de Google Play Console ($25 USD)
- [ ] Iconos de app (varios tamaños)
- [ ] Screenshots (mínimo 2, máximo 8)
- [ ] Descripción del juego (corta y larga)
- [ ] Privacy Policy (URL pública)
- [ ] Clasificación de contenido (completar cuestionario)

#### Proceso de Build
1. En Android Studio: Build → Generate Signed Bundle/APK
2. Seleccionar "Android App Bundle"
3. Crear keystore (guardar en lugar seguro, **no perder**)
4. Completar información de firma
5. Build → Release

#### Subir a Play Store
1. Google Play Console → Create App
2. Completar información de la app
3. Upload → Production → Upload AAB
4. Completar cuestionario de contenido
5. Submit for Review

**Tiempo de revisión**: 1-3 días

---

### Apple App Store

#### Requisitos
- [ ] Cuenta de Apple Developer ($99 USD/año)
- [ ] Mac con Xcode
- [ ] Iconos de app (1024x1024)
- [ ] Screenshots (varios tamaños de iPhone/iPad)
- [ ] Descripción del juego
- [ ] Privacy Policy (URL pública)
- [ ] Clasificación de edad

#### Proceso de Build
1. En Xcode: Product → Archive
2. Esperar a que termine el archive
3. Window → Organizer
4. Seleccionar el archive → Distribute App
5. App Store Connect → Upload
6. Completar información en App Store Connect

#### Subir a App Store
1. App Store Connect → My Apps → New App
2. Completar información
3. Seleccionar el build subido
4. Submit for Review

**Tiempo de revisión**: 1-7 días

---

## 🔄 PARTE 5: WORKFLOW DE DESARROLLO

### Desarrollo Diario
```bash
# 1. Hacer cambios al código
# 2. Build
npm run build

# 3. Copiar a proyectos nativos
npx cap copy

# 4. (Opcional) Sincronizar plugins nuevos
npx cap sync

# 5. Abrir y probar
npx cap open android  # o ios
```

### Actualizar Versión
**Archivo**: `package.json`
```json
{
  "version": "1.0.1"  // Incrementar
}
```

**Android**: `android/app/build.gradle`
```gradle
versionCode 2  // Incrementar (entero)
versionName "1.0.1"  // Mismo que package.json
```

**iOS**: Xcode → Target → General → Version

---

## 📊 PARTE 6: ANÁLISIS Y CONSIDERACIONES

### Ventajas de Capacitor
✅ Un solo código para web, iOS y Android
✅ Acceso a APIs nativas (cámara, vibración, etc.)
✅ Performance casi nativo
✅ Actualizaciones fáciles
✅ Comunidad activa y documentación completa

### Desventajas
⚠️ Tamaño de app mayor que nativo puro (~10-20MB base)
⚠️ Algunas APIs nativas requieren plugins adicionales
⚠️ Debugging puede ser más complejo
⚠️ Requiere mantener 3 proyectos (web, android, ios)

### Alternativas Consideradas
- **React Native**: Requiere reescribir todo el juego
- **Cordova**: Más antiguo, menos mantenido
- **PWA solo**: No permite publicar en tiendas
- **Nativo puro**: Requiere reescribir 3 veces el juego

**Conclusión**: Capacitor es la mejor opción para Phaser.

---

## 🎯 PARTE 7: ROADMAP SUGERIDO

### Fase 1: Preparación (Esta semana)
- [x] Implementar optimizaciones inmediatas (Parte 1)
- [ ] Crear iconos y assets
- [ ] Escribir Privacy Policy
- [ ] Crear screenshots del juego

### Fase 2: Setup Inicial (Próxima semana)
- [ ] Instalar Android Studio
- [ ] Instalar Xcode (si tienes Mac)
- [ ] Configurar Capacitor
- [ ] Primer build de prueba

### Fase 3: Testing (2 semanas)
- [ ] Probar en dispositivos Android reales
- [ ] Probar en dispositivos iOS reales
- [ ] Ajustar UI/UX para mobile
- [ ] Optimizar performance

### Fase 4: Publicación (1 semana)
- [ ] Crear cuentas de desarrollador
- [ ] Preparar assets para tiendas
- [ ] Subir a Play Store (beta)
- [ ] Subir a App Store (TestFlight)

### Fase 5: Launch (Cuando estés listo)
- [ ] Publicar versión final
- [ ] Marketing y promoción
- [ ] Monitorear reviews y crashes
- [ ] Planear actualizaciones

---

## 📝 CHECKLIST FINAL ANTES DE PUBLICAR

### Assets
- [ ] Icono de app (1024x1024)
- [ ] Screenshots (mínimo 4 por plataforma)
- [ ] Video preview (opcional pero recomendado)
- [ ] Banner/Feature graphic

### Legal
- [ ] Privacy Policy publicada
- [ ] Terms of Service (opcional)
- [ ] Clasificación de edad completada
- [ ] Permisos necesarios documentados

### Técnico
- [ ] Juego funciona offline
- [ ] No hay crashes conocidos
- [ ] Performance optimizado (60 FPS)
- [ ] Probado en múltiples dispositivos
- [ ] Versionado correcto

### Marketing
- [ ] Descripción atractiva
- [ ] Keywords optimizados
- [ ] Categoría correcta
- [ ] Precio definido (gratis/pago)

---

## 🆘 TROUBLESHOOTING COMÚN

### "Gamepad no funciona en iOS"
**Causa**: iOS tiene soporte limitado de Gamepad API
**Solución**: Documentar como "Android only feature"

### "App muy pesada"
**Causa**: Assets sin optimizar
**Solución**: Comprimir imágenes, usar atlas, minificar código

### "Crash al abrir en Android"
**Causa**: Permisos faltantes
**Solución**: Revisar `AndroidManifest.xml`

### "Rechazo de App Store"
**Causa**: Múltiples razones posibles
**Solución**: Leer feedback de Apple, ajustar y resubmit

---

## 📚 RECURSOS ÚTILES

- [Documentación oficial de Capacitor](https://capacitorjs.com/docs)
- [Phaser + Capacitor Tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

---

**Última actualización**: 2026-01-07
**Versión del documento**: 1.0
**Autor**: Frank004 + Antigravity AI
