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
    window.addEventListener('wheel', (e) => {
        if (!forestState.active) return;
        // Move forward/backward
        // DeltaY > 0 means scroll down. We want to walk FORWARD (increase Z)
        // So we ADD to targetZ
        const speed = 5; // Increased speed
        forestState.targetZ += e.deltaY * speed;

        // Clamp: Don't go back past the start
        // Start is 0. Let's allow a bit of "pull back" to -200
        if (forestState.targetZ < -200) forestState.targetZ = -200;
    });

    // Touch Support
    let lastTouchY = 0;
    window.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (!forestState.active) return;
        const currentY = e.touches[0].clientY;
        const deltaY = lastTouchY - currentY; // positive if dragged up

        // Drag UP = Scroll Down = Walk Forward
        const speed = 6;
        forestState.targetZ += deltaY * speed;

        if (forestState.targetZ < -200) forestState.targetZ = -200;
        lastTouchY = currentY;
    });

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
        forestState.targetZ = 0;
        forestState.cameraZ = 0;

        // Sync notes from list if needed, or re-render
        // We'll rely on the global 'addNoteTo3D' hook
    } else {
        viewport.style.display = 'none';
        existingOverlay.style.display = 'flex'; // Show 2D list
    }
}

function render3DLoop() {
    if (!forestState.active) {
        requestAnimationFrame(render3DLoop);
        return;
    }

    // Smooth Camera Logic
    // Linear interpolation
    forestState.cameraZ += (forestState.targetZ - forestState.cameraZ) * 0.1;

    // Apply transform to WORLD (moving world towards camera)
    // translateZ(cameraZ) moves everything closer
    forestState.world.style.transform = `translateZ(${forestState.cameraZ}px)`;

    // Update Fog? (Optional)

    requestAnimationFrame(render3DLoop);
}

// Hook called by main script when data arrives
function addNoteTo3D(data) {
    if (!forestState.world) return;

    const noteEl = document.createElement('div');
    noteEl.className = 'note-3d';

    // Notes on the floor
    // X: Scatter across path width (-250 to 250)
    const randomX = (Math.random() * 500) - 250;

    const zPos = forestState.lastZIndex;
    forestState.lastZIndex -= forestState.spacing; // Next one further back

    // Rotation: Messy papers
    // rotateX(-90deg) puts it flat on floor.
    // rotateZ (which acts as Y rotation on the floor plane) random -45 to 45
    const randomRotZ = (Math.random() * 90) - 45;

    // Y Position: Slightly above floor to avoid z-fighting/clipping
    const yFloor = 180;

    // CSS Transform Order: Translate World Coordinates -> Rotate Flat
    noteEl.style.transform = `translate3d(${randomX}px, ${yFloor}px, ${zPos}px) rotateX(-90deg) rotateZ(${randomRotZ}deg)`;

    // Paper styling randomization
    // Slight size variation
    const scale = 0.9 + Math.random() * 0.2;
    noteEl.style.transform += ` scale(${scale})`;

    // Content
    const date = new Date(data.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    noteEl.innerHTML = `
        <div class="note-3d-text">${escapeHtml3D(data.text)}</div>
        <div class="note-3d-meta">${timeStr}</div>
    `;

    forestState.world.appendChild(noteEl);

    // Keep reference
    forestState.notes.push({ el: noteEl, z: zPos });

    // --- Lush Forest Generation ---
    // Spawn a CLUSTER of trees for every note step to make it dense
    const treesInCluster = 4 + Math.floor(Math.random() * 4); // 4-8 trees

    for (let i = 0; i < treesInCluster; i++) {
        // Spread trees along the Z-gap between this note and previous
        const treeZ = zPos + (Math.random() * forestState.spacing);
        createTree(treeZ);
    }
}

function createTree(zPos) {
    const tree = document.createElement('div');
    tree.className = 'tree-3d';

    // Position: Deep Forest = Far sides
    // Path width is ~300px on each side. Trees starts at 350px+
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 350 + Math.random() * 900; // 350px to 1250px from center
    const xPos = side * dist;

    const yFloor = 100; // Base of tree

    // Randomize Tree Size & Color
    const scale = 0.8 + Math.random() * 1.5; // Huge trees mixed with small
    const hue = 120 + (Math.random() * 40 - 20); // 100-140 (Greens)
    const color = `hsl(${hue}, 40%, 35%)`;

    tree.style.setProperty('--tree-color', color);

    tree.style.transform = `translate3d(${xPos}px, ${yFloor}px, ${zPos}px) scale(${scale})`;
    forestState.world.appendChild(tree);
}

function escapeHtml3D(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Global Exports
window.init3DForest = init3DForest;
window.toggle3DView = toggle3DView;
window.addNoteTo3D = addNoteTo3D;
