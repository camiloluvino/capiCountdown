/**
 * 3D Forest Notes Logic
 * Handles the "walking" mechanic and placing notes in 3D space.
 */

const forestState = {
    active: false,
    cameraZ: 0,
    targetZ: 0,
    notes: [], // Array of { id, text, timestamp, userId, zPos }
    lastZIndex: -500, // Where the next note spawns
    spacing: 1500, // PX between notes (v2.3 Setting)
    hasLoadedNotes: false, // Track if we've rendered notes

    // Config
    world: null,
    floor: null,
};

function init3DForest() {
    const viewport = document.getElementById('forest-viewport');
    forestState.world = document.getElementById('forest-world');

    if (!viewport || !forestState.world) return;

    // Inject Exit Button if missing
    if (!document.getElementById('exit-3d-btn')) {
        const exitBtn = document.createElement('button');
        exitBtn.id = 'exit-3d-btn';
        exitBtn.innerText = '✕ Salir del Bosque';
        exitBtn.onclick = toggle3DView;
        exitBtn.style.display = 'none'; // Hidden by default
        document.body.appendChild(exitBtn);
    }

    window.addEventListener('wheel', (e) => {
        if (!forestState.active) return;
        e.preventDefault();
        e.stopPropagation();

        // Scroll Up (Negative) -> Forward (Decrease Z)
        const speed = 5;
        forestState.targetZ += e.deltaY * speed;

        if (forestState.targetZ > 200) forestState.targetZ = 200;

    }, { passive: false });

    // Touch Support
    let lastTouchY = 0;
    window.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!forestState.active) return;
        e.preventDefault();

        const currentY = e.touches[0].clientY;
        const deltaY = lastTouchY - currentY;

        const speed = 6;
        forestState.targetZ -= deltaY * speed;

        if (forestState.targetZ > 200) forestState.targetZ = 200;
        lastTouchY = currentY;
    }, { passive: false });

    requestAnimationFrame(render3DLoop);
}

function toggle3DView() {
    const viewport = document.getElementById('forest-viewport');
    // We strictly Hide the 2D overlay if it was open (though now we skip it)
    const noteOverlay = document.getElementById('notes-overlay');
    const exitBtn = document.getElementById('exit-3d-btn');

    forestState.active = !forestState.active;

    // Elements to Toggle for IMMERSION
    const uiElements = [
        'themeToggle', 'playButton', 'notesButton',
        'adminPanel',
        'capyImage', 'dailyMessage', 'counter',
        'intro-overlay', 'cloudsContainer',
        'game-overlay'
    ];

    const feedingMenu = document.querySelector('.feeding-menu');
    const title = document.querySelector('h1');
    const debugPanel = document.querySelector('.debug-panel');

    if (forestState.active) {
        // ENTRANDO AL BOSQUE
        viewport.style.display = 'block';
        if (noteOverlay) noteOverlay.style.display = 'none'; // Ensure 2D list is GONE
        if (exitBtn) exitBtn.style.display = 'block';

        document.body.style.overflow = 'hidden';

        uiElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        if (feedingMenu) feedingMenu.style.display = 'none';
        if (title) title.style.display = 'none';
        if (debugPanel) debugPanel.style.display = 'none';

        // Reset Camera
        forestState.targetZ = 0;
        forestState.cameraZ = 0;

    } else {
        // SALIENDO DEL BOSQUE
        viewport.style.display = 'none';
        // DO NOT show noteOverlay active again. We go back to MAIN SCREEN.
        if (noteOverlay) noteOverlay.style.display = 'none';
        if (exitBtn) exitBtn.style.display = 'none';

        document.body.style.overflow = '';

        uiElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
        if (feedingMenu) feedingMenu.style.display = '';
        if (title) title.style.display = '';
        if (debugPanel) debugPanel.style.display = '';
    }
}

function render3DLoop() {
    if (!forestState.active) {
        requestAnimationFrame(render3DLoop);
        return;
    }

    // Smooth Camera Logic
    forestState.cameraZ += (forestState.targetZ - forestState.cameraZ) * 0.1;

    // Pure Ground View (No Tilt)
    forestState.world.style.transform = `translateZ(${-forestState.cameraZ}px)`;

    requestAnimationFrame(render3DLoop);
}

// Hook called by main script
function addNoteTo3D(data) {
    if (!forestState.world) return;

    // Z Spacing with Jitter (v2.3)
    const zJitter = (Math.random() * 400) - 200;
    const zPos = forestState.lastZIndex + zJitter;
    forestState.lastZIndex -= forestState.spacing;

    // --- Hero Tree Logic ---
    const side = Math.random() > 0.5 ? 1 : -1;
    // Dist: 220px to 500px (v2.1/2.3)
    const dist = 220 + Math.random() * 280;
    const treeX = side * dist;
    const treeY = 100;

    // Create Big Hero Tree 
    const scale = 2.2 + Math.random() * 0.8;
    const treeEl = createTreeElement(treeX, treeY, zPos, scale);
    forestState.world.appendChild(treeEl);

    // --- The Note ---
    const noteEl = document.createElement('div');
    noteEl.className = 'note-3d';
    noteEl.title = "Leer nota";

    // Position
    const noteY = treeY - (30 * scale);
    const noteZ = zPos + 5; // Reverted to +5 (Standard v2.3)

    noteEl.style.transform = `translate3d(${treeX}px, ${noteY}px, ${noteZ}px) rotateZ(${Math.random() * 10 - 5}deg)`;

    // Standard Click Listener
    noteEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteModal(data);
    });

    forestState.world.appendChild(noteEl);
    forestState.notes.push({ el: noteEl, z: zPos });

    // --- Decor Trees ---
    const treesInCluster = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < treesInCluster; i++) {
        const dSide = Math.random() > 0.5 ? 1 : -1;
        const dDist = 400 + Math.random() * 800; // Far sides
        const dX = dSide * dDist;

        const decorZ = zPos + (Math.random() * forestState.spacing) - (forestState.spacing / 2);
        const dScale = 0.8 + Math.random() * 1.5;

        const tree = createTreeElement(dX, 100, decorZ, dScale);
        forestState.world.appendChild(tree);
    }
}

function createTreeElement(x, y, z, scale) {
    const tree = document.createElement('div');
    tree.className = 'tree-3d';

    const hue = 120 + (Math.random() * 40 - 20);
    const color = `hsl(${hue}, 40%, 35%)`;
    tree.style.setProperty('--tree-color', color);

    tree.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
    return tree;
}

function escapeHtml3D(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openNoteModal(data) {
    const modal = document.getElementById('note-reading-modal');
    const textEl = document.getElementById('modal-text');
    const metaEl = document.getElementById('modal-meta');

    if (!modal) return;

    const date = new Date(data.timestamp);
    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    textEl.innerHTML = escapeHtml3D(data.text);
    // User Request: Remove "Enviado:" prefix, just show date/time
    metaEl.innerText = timeStr;

    modal.classList.add('visible');
}

function closeNoteModal() {
    const modal = document.getElementById('note-reading-modal');
    if (modal) modal.classList.remove('visible');
    forestState.active = true;
}

window.addEventListener('load', () => {
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeNoteModal);

    const modal = document.getElementById('note-reading-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeNoteModal();
        });
    }
});

window.init3DForest = init3DForest;
window.toggle3DView = toggle3DView;
window.addNoteTo3D = addNoteTo3D;
