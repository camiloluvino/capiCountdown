// ==========================================
// CONFIG - Capi Countdown
// ==========================================
// Configuración centralizada de la aplicación
// ==========================================

const AppConfig = {
    // Versión de la app
    version: '1.3.1',

    // Fecha objetivo del countdown (Reencuentro)
    targetDate: new Date('2026-03-05T00:00:00'),

    // Fecha de inicio (Primer día de distancia)
    startDate: new Date('2026-02-12T00:00:00'),

    // Configuración del Árbol Zen
    tree: {
        totalLeaves: 21,
        trunkColor: '#5D4E37',
        leafColors: ['#8FBC8F', '#A2D5A2', '#7BAE7F', '#B5CC8E', '#C4D7A4']
    },

    // Imágenes del capibara
    capybaraImages: [
        'assets/images/capybara.webp',          // Relaxed
        'assets/images/capybara_eating.webp',   // Eating
        'assets/images/capybara_sleeping.webp', // Sleeping
        'assets/images/capybara_onsen.webp',    // Onsen
        'assets/images/capybara_reading.webp',  // Reading
        'assets/images/capybara_music.webp',    // Music
        'assets/images/capybara_cooking.webp'   // Cooking
    ],

    // Imágenes de la tortuga
    turtleImages: [
        'assets/images/tortuga-removebg-preview.webp',           // Meditating
        'assets/images/tortuga_reading-removebg-preview.webp',   // Reading
        'assets/images/tortuga_eating-removebg-preview.webp',    // Eating
        'assets/images/tortuga_sleeping-removebg-preview.webp'   // Sleeping
    ],

    // Paletas de materiales para dibujo
    drawingPalettes: {
        graphite: {
            name: 'Grafito',
            colors: [
                { color: '#1a1a1a', name: 'Negro' },
                { color: '#2d2d2d', name: 'Carbón' },
                { color: '#4a4a4a', name: 'Oscuro' },
                { color: '#666666', name: 'Medio' },
                { color: '#888888', name: 'Gris' },
                { color: '#aaaaaa', name: 'Claro' },
                { color: '#cccccc', name: 'Plata' },
                { color: '#e0e0e0', name: 'Suave' }
            ],
            texture: true,
            opacity: 0.9
        },
        watercolor: {
            name: 'Acuarela',
            colors: [
                { color: '#C94C4C', name: 'Rojo' },
                { color: '#E8A87C', name: 'Naranja' },
                { color: '#F7D794', name: 'Amarillo' },
                { color: '#7BAE7F', name: 'Verde' },
                { color: '#5B8FA8', name: 'Azul' },
                { color: '#6B5B95', name: 'Púrpura' },
                { color: '#E6A8D7', name: 'Rosa' },
                { color: '#5D4E37', name: 'Marrón' }
            ],
            texture: false,
            opacity: 0.6
        }
    },

    // Grosores de pincel
    brushSizes: [
        { value: 2, name: 'Muy fino', class: 's1' },
        { value: 5, name: 'Fino', class: 's2' },
        { value: 12, name: 'Medio', class: 's3' },
        { value: 24, name: 'Grueso', class: 's4' }
    ],

    // Configuración del historial de dibujo
    drawing: {
        maxHistory: 10,
        canvasBackground: '#FDFBF5'
    },

    // Espaciado 3D Forest
    forest: {
        noteSpacing: 1500,
        minZ: -300
    }
};

// Precargar imágenes de forma no bloqueante
function preloadImages() {
    const allImages = [...AppConfig.capybaraImages, ...AppConfig.turtleImages];
    allImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Ejecutar precarga después de que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadImages);
} else {
    // Ya cargado, precargar en siguiente tick
    setTimeout(preloadImages, 0);
}

// Exponer globalmente
window.AppConfig = AppConfig;
