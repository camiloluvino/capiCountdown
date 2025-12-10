# Principios de Construcción - CapiCountdown 🍊

Este documento define la "Constitución" del proyecto. Cualquier agente de IA o desarrollador que trabaje en este código debe respetar estos principios para mantener la consistencia, funcionalidad y "vibe" del proyecto.

## 1. Filosofía del Proyecto 🌿
*   **Vibe Coding:** El código debe ser limpio, pero la prioridad es la **experiencia de usuario** y la **estética**. Buscamos que el usuario sienta "paz" y diversión (estilo Capibara).
*   **Estética:** Uso de fuentes amigables (`Outfit`, `Lora`), colores pasteles/naturales, bordes redondeados y animaciones suaves. Evitar diseños rígidos o corporativos.

## 2. Pilares de Funcionalidad (No Negociables) ⚓

### A. Modo Desarrollador Oculto ("God Mode") 🛠️
El proyecto **SIEMPRE** debe mantener un "Modo Desarrollador" accesible pero discreto.
*   **Activación:** Mediante secuencia de teclas (actualmente `d-e-v`) o UI oculta.
*   **Capacidades:**
    *   **Viaje en el Tiempo:** Capacidad de simular fechas futuras/pasadas para probar contadores y eventos.
    *   **Admin de Datos (CRUD):** Capacidad de leer, editar y borrar datos de Firebase (Notas, Puntos) directamente desde la UI.
*   **Persistencia:** Este modo no debe ser eliminado en refactorizaciones.

### B. Trazabilidad de Versiones 🏷️
*   **Indicador de Versión:** La aplicación debe saber qué versión es.
*   **Visibilidad:** El número de versión (ej. `v1.7`) debe ser visible, ya sea en el footer o dentro del panel de debug.
*   **Actualización:** Al hacer cambios significativos, se debe incrementar la versión y actualizar la cadena de texto en el código.

## 3. Arquitectura Técnica 🏗️
*   **Estructura de Carpetas:**
    *   `/css`: Estilos separados por funcionalidad (`styles.css` global, `3d-forest.css`, `admin.css`).
    *   `/js`: Lógica separada (`script.js` core, `3d-forest.js`).
    *   `/assets`: Imágenes y recursos estáticos.
*   **Tecnología:** Vanilla JS y CSS siempre que sea posible para mantener la ligereza y facilidad de edición. Evitar frameworks pesados (React/Angular) a menos que sea estrictamente necesario.

## 4. Flujo de Trabajo y Git 🔄
*   **Commits:** Mensajes claros y descriptivos.
*   **Backups:** Antes de cambios radicales, asegurar que la versión estable esté commiteada ("Punto de Guardado").
35: *   **Despliegue en GitHub Pages (CRÍTICO):**
    *   **Problema Común:** A menudo trabajamos en `master`, pero GitHub Pages despliega desde `gh-pages`. Esto causa que los cambios no se vean reflejados en la web.
    *   **Solución:** Siempre verificar `git branch -a`. Si existe `gh-pages`, al terminar una versión estable, ejecutar explícitamente: `git push origin master:gh-pages`.

---
*Este archivo debe ser leído al inicio de cada nueva sesión de desarrollo para alinear el contexto.*
