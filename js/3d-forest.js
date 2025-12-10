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
    spacing: 800, // PX between notes

    // Config
    world: null,
    floor: null,
};

function init3DForest() {
    const viewport = document.getElementById('forest-viewport');
    forestState.world = document.getElementById('forest-world');

    if (!viewport || !forestState.world) return;

    // Mouse Wheel / Scroll Listener
    // Note: We attach this to the window/document to catch it everywhere
    // but we only act if forestState.active is true.
    window.addEventListener('wheel', (e) => {
        if (!forestState.active) return;

        // CRITICAL: Stop the browser from scrolling the page
        e.preventDefault();
        e.stopPropagation();

        // Nav Logic using native deltaY
        // DeltaY < 0 (Scroll UP / Push Away) -> We want to move FORWARD (Into screen, Z decreases)
        // DeltaY > 0 (Scroll DOWN / Pull Back) -> We want to move BACKWARD (Out of screen, Z increases)

        // So: targetZ += deltaY
        // ex: -100 (Up) -> targetZ decreases by 500 -> More negative -> Forward

        const speed = 5;
        forestState.targetZ += e.deltaY * speed;

        // Clamp: Don't go back past the start (0 or 200)
        // Since we go negative to walk forward, "start" is the maximum Z.
        if (forestState.targetZ > 200) forestState.targetZ = 200;

    }, { passive: false }); // REQUIRED for preventDefault to work

    // Touch Support
    let lastTouchY = 0;
    window.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!forestState.active) return;
        e.preventDefault(); // Stop mobile scroll

        const currentY = e.touches[0].clientY;
        const deltaY = lastTouchY - currentY; // positive if dragged up

        // Drag UP = Move Forward (Z decreases)
        // If Drag Up (deltaY > 0), we want Z to decrease.
        // So targetZ -= deltaY

        const speed = 6;
        forestState.targetZ -= deltaY * speed;

        if (forestState.targetZ > 200) forestState.targetZ = 200;
        lastTouchY = currentY;
    }, { passive: false });

    // Animation Loop
    requestAnimationFrame(render3DLoop);
}

function toggle3DView() {
    const viewport = document.getElementById('forest-viewport');
    const existingOverlay = document.getElementById('notes-overlay');

    forestState.active = !forestState.active;

    if (forestState.active) {
        viewport.style.display = 'block';
        existingOverlay.style.display = 'none'; // Hide 2D list

        // NUCLEAR OPTION: Lock Body Scroll
        document.body.style.overflow = 'hidden';

        forestState.targetZ = 0;
        forestState.cameraZ = 0;

    } else {
        viewport.style.display = 'none';
        existingOverlay.style.display = 'flex'; // Show 2D list

        // Restore Body Scroll
        document.body.style.overflow = '';
    }
}

function render3DLoop() {
    if (!forestState.active) {
        requestAnimationFrame(render3DLoop);
        return;
    }

    // Smooth Camera Logic
    forestState.cameraZ += (forestState.targetZ - forestState.cameraZ) * 0.1;

    // Apply transform to WORLD (moving world towards camera)
    // translateZ(cameraZ) moves everything closer or further
    // Since we move "forward" into negative Z, we need to bring the world "towards" us (Positive Translate)
    // to see the negative bits? 
    // Wait. If camera is at -1000, world needs to shift +1000?
    // Actually, "Camera at Z" usually means World Translate -Z.
    // If we want to walk "Forward" (Z gets smaller, e.g. -1000), 
    // we want to move the world UP relative to us? 
    // Let's stick to standard: Scene moves Opposite to Camera.
    // Camera moves Negative -> World moves Positive.
    // So: translateZ(-cameraZ).
    // Let's see: targetZ decreases (goes negative). cameraZ goes negative. 
    // -cameraZ becomes positive. World comes closer. Correct.

    // forestState.world.style.transform = `translateZ(${-forestState.cameraZ}px)`;
    // Wait, my previous working logic was translateZ(cameraZ). 
    // Let's stick to what worked for rendering, just fixing the "Scroll Direction" input.
    // IF the previous logic was: targetZ += deltaY. Scroll Down (+) -> TargetZ increases (+).
    // This moved us "Backward".
    // User wants Scroll Down (+) to move "Backward". 
    // Scroll Up (-) to move "Forward".
    // So targetZ += deltaY is Correct for that mapping IF "Decreasing Z" = "Forward".

    // Is "Decreasing Z" forward?
    // Notes spawn at lastZIndex -= spacing. (Negative direction).
    // So yes, deeper is negative.
    // So to go deeper, we need cameraZ to decrease (become more negative).
    // So if I scroll Up (deltaY is negative), targetZ decreases.
    // So targetZ += deltaY is CORRECT.

    // Why did user say it's inverted?
    // "Rueda hacia atrás va hacia adelante"
    // Rueda hacia atrás = Pulling toward user = Scroll Down (DeltaY > 0).
    // If that goes Forward, then DeltaY > 0 is making Z decrease?
    // That means I was subtracting: targetZ -= deltaY.
    // If I revert to targetZ += deltaY, then:
    // Scroll Down (DeltaY > 0) -> TargetZ increases (Backwards).
    // Scroll Up (DeltaY < 0) -> TargetZ decreases (Forwards).
    // This matches standard logic.

    forestState.world.style.transform = `translateZ(${-forestState.cameraZ}px)`;
    // I added the negative sign here to align with standard "Camera" math,
    // assuming cameraZ decreases as we walk forward.

    requestAnimationFrame(render3DLoop);
}

// Hook called by main script when data arrives
function addNoteTo3D(data) {
    if (!forestState.world) return;

    const noteEl = document.createElement('div');
    noteEl.className = 'note-3d';
    noteEl.title = "Leer nota";

    // Position Logic
    const randomX = (Math.random() * 500) - 250;

    const zPos = forestState.lastZIndex;
    forestState.lastZIndex -= forestState.spacing;

    const randomRotZ = (Math.random() * 60) - 30;
    const yFloor = 180;

    noteEl.style.transform = `translate3d(${randomX}px, ${yFloor}px, ${zPos}px) rotateX(-75deg) rotateZ(${randomRotZ}deg)`;

    noteEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteModal(data);
    });

    forestState.world.appendChild(noteEl);
    forestState.notes.push({ el: noteEl, z: zPos });

    // --- Lush Forest Generation ---
    const treesInCluster = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < treesInCluster; i++) {
        const treeZ = zPos + (Math.random() * forestState.spacing);
        createTree(treeZ);
    }
}

function createTree(zPos) {
    const tree = document.createElement('div');
    tree.className = 'tree-3d';

    // Position
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 350 + Math.random() * 900;
    const xPos = side * dist;
    const yFloor = 100;

    // Randomize
    const scale = 0.8 + Math.random() * 1.5;
    const hue = 120 + (Math.random() * 40 - 20);
    const color = `hsl(${hue}, 40%, 35%)`;

    tree.style.setProperty('--tree-color', color);

    tree.style.transform = `translate3d(${xPos}px, ${yFloor}px, ${zPos}px) scale(${scale})`;
    forestState.world.appendChild(tree);
}

function escapeHtml3D(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Modal Logic
function openNoteModal(data) {
    const modal = document.getElementById('note-reading-modal');
    const textEl = document.getElementById('modal-text');
    const metaEl = document.getElementById('modal-meta');

    if (!modal) return;

    const date = new Date(data.timestamp);
    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    textEl.innerHTML = escapeHtml3D(data.text);
    metaEl.innerText = `Enviado: ${timeStr}`;

    modal.classList.add('visible');
}

function closeNoteModal() {
    const modal = document.getElementById('note-reading-modal');
    if (modal) modal.classList.remove('visible');
    forestState.active = true;
}

// Bind Close Button & Global Exports
window.addEventListener('load', () => {
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNoteModal);
    }
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
