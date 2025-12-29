# AI Instructions - CapiCountdown 🍊

> Este documento debe leerse al inicio de cada sesión de trabajo con IA.

## Descripción del Proyecto

Contador regresivo interactivo con temática capibara para una fecha especial (28 de enero de 2026). Proyecto **personal y privado** alojado en GitHub Pages. Incluye mini-juegos, notas compartidas vía Firebase, bosque 3D navegable, y canvas de dibujo colaborativo.

## Fuente de Verdad

### Archivos Editables (Fuente)
- `index.html` - Estructura principal
- `/js/*.js` - Lógica (8 módulos)
- `/css/*.css` - Estilos (5 archivos)
- `/config/firebase-config.js` - Credenciales (gitignored)

### NO Existen Artefactos de Build
- **NO hay carpeta `/dist/`**
- **NO hay archivos minificados**
- **NO hay proceso de transpilación**

El código fuente ES el código de producción. Esto es intencional.

## Arquitectura

```
index.html
    ↓
config/firebase-config.js  (credenciales Firebase)
    ↓
js/utils.js     → Funciones compartidas
js/config.js    → Configuración app (versión, imágenes, paletas)
    ↓
js/script.js    → Core (countdown, Firebase, UI principal)
    ↓
[Módulos secundarios - cargados después]
js/3d-forest.js    → Bosque 3D de notas
js/basket-game.js  → Mini-juego cesta
js/river-game.js   → Mini-juego río
js/multiplayer.js  → Funciones multiplayer
js/drawing.js      → Canvas de dibujo
```

### Orden de Carga CRÍTICO
El orden de `<script>` en `index.html` es **obligatorio**:
1. Firebase SDK (CDN)
2. `firebase-config.js`
3. `utils.js` ← DEBE ir primero de los locales
4. `config.js`
5. Resto de módulos

## Decisiones de Diseño

### Simplicidad Sobre Optimización
- **Vanilla JS/CSS obligatorio** - NO React/Angular/Vue
- **NO sistemas de build** - NO Webpack/Vite/Parcel
- **NO minificación** - Código legible directo
- Razón: Proyecto personal, la mantenibilidad supera al rendimiento

### Variables Globales
Todo se expone en `window.*` porque no usamos ES Modules. Cada módulo registra sus funciones públicas así:
```javascript
window.nombreFuncion = nombreFuncion;
```

### Firebase Realtime Database
- Notas compartidas: `shared_notes/`
- Dibujos: `drawings/`
- Las credenciales están en `config/firebase-config.js` (usar `.example.js` como plantilla)

## Principios Operativos

### ⚠️ IMPERATIVO: Actualizar Versión en index.html
Cada modificación DEBE actualizar el comentario al inicio de `index.html`:
```html
<!--
    ============================================
    CAPI COUNTDOWN - Contador Capibara
    ============================================
    Versión: X.X.X
    Fecha: YYYY-MM-DD
    Hora: HH:MM (UTC-3 Chile)
    Cambios:
      - Descripción breve del cambio
    ============================================
-->
```

### Versionado
Ubicaciones a sincronizar (actualmente desincronizadas):
- `index.html` comentario inicial ← **Fuente primaria**
- `config.js` → `AppConfig.version`
- `package.json` → `version`

### Despliegue a GitHub Pages
```bash
git push origin master:gh-pages
```
La rama `gh-pages` es la que despliega GitHub Pages. Olvidar este comando = cambios no visibles en producción.

### Modo Debug ("God Mode")
- Activar: teclear `d-e-v` o agregar `?debug=true` a la URL
- Capacidades: viaje en tiempo, CRUD de notas Firebase
- **NUNCA eliminar esta funcionalidad**

### Verificación de Cambios
- **NO usar browser_subagent por defecto** - El usuario prefiere probar él mismo
- Solo automatizar navegador si el usuario lo solicita explícitamente

## Convenciones de Código

| Contexto | Convención | Ejemplo |
|----------|------------|---------|
| Funciones JS | camelCase | `getDaysLeft()` |
| Clases CSS | kebab-case | `.capybara-container` |
| IDs HTML | kebab-case | `#notes-overlay` |
| Archivos | kebab-case | `basket-game.js` |

### Estética "Capibara Zen"
- Colores pasteles/naturales
- Bordes redondeados
- Animaciones suaves
- Fuentes: Outfit, Lora, Indie Flower
- **Evitar diseños rígidos o corporativos**

## Fragilidades y Errores Comunes

### ❌ Errores que NO debes cometer
1. Proponer sistemas de build → **Prohibido**
2. Crear carpeta `/dist/` → **No debe existir**
3. Olvidar actualizar versión en `index.html`
4. Alterar orden de scripts en `index.html`
5. Agregar scripts nuevos sin registrar en `index.html`
6. Usar `browser_subagent` sin que el usuario lo pida

### ⚠️ Puntos Frágiles
- **Branch de deploy:** Cambios en `master` no se ven en producción hasta hacer push a `gh-pages`
- **Firebase config:** Si falta, la app falla silenciosamente
- **Variables globales:** Dependencias implícitas entre módulos

## Referencias
- `PRINCIPIOS_DE_CONSTRUCCION.md` - Filosofía y principios fundacionales
- `README.md` - Documentación para usuarios humanos
- `STATUS.md` - Estado actual del desarrollo
