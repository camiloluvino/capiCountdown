// --- FIREBASE CONFIGURATION ---
// 🔒 Las credenciales se cargan desde config/firebase-config.js
// Para configurar, copia config/firebase-config.example.js a config/firebase-config.js
// y reemplaza con tus credenciales de Firebase.
// -----------------------------

// Verificar que la configuración esté cargada
if (typeof firebaseConfig === 'undefined') {
    console.error("⚠️ Error: firebase-config.js no encontrado o no cargado.");
    console.error("Copia config/firebase-config.example.js a config/firebase-config.js");
}

// Initialize Firebase safely
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    window.database = database; // Expose for other modules (multiplayer, etc.)
    console.log("Firebase inicializado");
} catch (e) {
    console.error("Error inicializando Firebase (¿Falta la config?):", e);
}

// --- Notes System Integration ---
const notesButton = document.getElementById('notesButton');
const notesOverlay = document.getElementById('notes-overlay');
const closeNotes = document.getElementById('closeNotes');
const start3dBtn = document.getElementById('start-3d-btn');

// Las notas se cargan automáticamente via Firebase listener en líneas posteriores


// OPEN NOTES -> DIRECTLY TO 3D FOREST (User Request: Hide 2D List)
if (notesButton) {
    notesButton.addEventListener('click', () => {
        // Instead of showing the 2D overlay, we go straight to 3D
        // Initialize if not ready (robust init: don't rely on innerHTML state)
        if (window.init3DForest && !window.__forestInitialized) {
            window.init3DForest();
            window.__forestInitialized = true;
        }

        // Populate 3D forest with current notes
        const currentNotes = window.sharedNotes || []; // Ensure we have the latest list

        // Simple check to avoid double-adding if already added? 
        // Ideally render3D logic handles clearing or we just append.
        // For now, let's assume init clears or we just toggle.

        // Wait, we need to make sure the forest has data.
        // Let's re-fetch or use cached.

        // Trigger the toggle
        if (window.toggle3DView) {
            window.toggle3DView();

            // If it was the first load, we might need to inject notes
            // Assuming 'forestState' is a global object or defined elsewhere
            if (window.forestState && !window.forestState.hasLoadedNotes && currentNotes.length > 0) {
                // Convert and add existing notes to 3D
                const forestNotes = document.getElementById('forest-world');
                if (forestNotes) forestNotes.innerHTML = ''; // Clear existing demo trees/notes

                // Re-add them
                currentNotes.forEach(noteData => {
                    window.addNoteTo3D(noteData);
                });
                window.forestState.hasLoadedNotes = true;
            }
        }
    });
}

// Close Notes (2D Overlay - Kept for dev/admin but hidden from flow)
if (closeNotes) {
    closeNotes.addEventListener('click', () => {
        if (notesOverlay) notesOverlay.style.display = 'none';
    });
}

// 3D Button in Overlay (Redundant now, but kept if user reverts)
if (start3dBtn) {
    start3dBtn.addEventListener('click', () => {
        if (window.toggle3DView) window.toggle3DView();
    });
}
// End of new Notes System Integration block

const noteInput = document.getElementById('noteInput');
const sendNoteBtn = document.getElementById('sendNote');
const notesList = document.getElementById('notesList');


// Send Note
function sendNote() {
    const text = noteInput.value.trim();
    if (!text) return;
    if (!database) {
        console.error("Firebase no inicializado");
        return;
    }

    // Create a unique ID for the user
    let userId = localStorage.getItem('capi_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('capi_user_id', userId);
    }

    const message = {
        text: text,
        timestamp: Date.now(),
        userId: userId
    };

    // Push to Firebase
    database.ref('shared_notes').push(message).then(() => {
        console.log("Nota enviada");
        noteInput.value = '';
    }).catch((error) => {
        console.error("Error al guardar:", error);
    });
}

sendNoteBtn.addEventListener('click', sendNote);
noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendNote();
});

// Listen for Notes
if (database) {
    const notesRef = database.ref('shared_notes');

    // On load, handle "Empty State"
    notesRef.once('value').then(snapshot => {
        // Only show empty message if no notes exist
        if (!snapshot.exists()) {
            notesList.innerHTML = '<div class="note-message system-message">Escribe la primera nota... ?</div>';
        }
    }).catch(e => {
        console.error("Error conexión inicial:", e);
        notesList.innerHTML = '<div class="note-message system-message" style="color:red">Error de conexión</div>';
    });

    notesRef.limitToLast(50).on('child_added', (snapshot) => {
        const data = snapshot.val();
        renderMessage(data);
        if (window.addNoteTo3D) window.addNoteTo3D(data);
        scrollToBottom();
    }, (error) => {
        console.error("Error leyendo notas:", error);
    });
}

function scrollToBottom() {
    notesList.scrollTop = notesList.scrollHeight;
}

function renderMessage(data) {
    const el = document.createElement('div');
    el.className = 'note-message';

    // Check if it's me
    const myId = localStorage.getItem('capi_user_id');
    if (data.userId === myId) {
        el.classList.add('my-message');
    }

    // Format time
    const date = new Date(data.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `
        <div class="note-text">${escapeHtml(data.text)}</div>
    `;

    // Remove "System Message" if it exists
    const sysMsg = notesList.querySelector('.system-message');
    if (sysMsg) sysMsg.remove();

    notesList.appendChild(el);
}

// escapeHtml() ahora se carga desde utils.js

// Configuration - Usamos AppConfig desde config.js
const targetDate = window.AppConfig?.targetDate || new Date('2026-03-05T00:00:00');
const images = window.AppConfig?.capybaraImages || [];
const turtleImages = window.AppConfig?.turtleImages || [];

// Precarga se maneja en config.js

// Capybara messages (social, relaxed, fun)
const zenMessages = [
    "Ya falta menos que ayer.",
    "El tiempo avanza, quieras o no.",
    "Todo llega a su debido tiempo.",
    "Un día más, un día menos.",
    "La espera es parte del proceso.",
    "El reencuentro se acerca sin prisa pero sin pausa.",
    "Guardando energía para el gran día.",
    "Paciencia: el arte de dejar que el tiempo pase.",
    "Solo es cuestión de tiempo.",
    "El calendario no se detiene.",
    "Lo bueno se hace esperar.",
    "Cada segundo cuenta.",
    "Respira, ya casi estamos.",
    "La meta está más cerca.",
    "Disfruta el camino.",
    "Hoy es un paso más.",
    "La paciencia es amarga, pero su fruto es dulce.",
    "No cuentes los días, haz que los días cuenten.",
    "Todo llega para quien sabe esperar.",
    "Confía en el tiempo.",
    "Un día a la vez.",
    "La calma antes de la celebración.",
    "Preparando motores...",
    "Siente la brisa de la espera.",
    "Mantén la visión en el objetivo.",
    "Pequeños pasos, grandes distancias.",
    "La espera construye el carácter.",
    "Ya casi puedes saborearlo.",
    "Tranquilidad y buenos alimentos.",
    "El futuro se construye hoy.",
    "Cada día sin ti es un día más cerca de verte.",
    "Sonríe, el tiempo está de tu lado.",
    "La mejor compañía es la calma.",
    "Observa cómo pasan las nubes.",
    "El día del reencuentro brillará más que nunca."
];

// Turtle messages (wise, contemplative, philosophical)
const turtleMessages = [
    "La paciencia es la compañera del sabio.",
    "Cada paso lento es un paso seguro.",
    "El tiempo no tiene prisa, ¿por qué habrías de tenerla tú?",
    "La sabiduría crece con la quietud.",
    "Observa, reflexiona, avanza.",
    "En la calma se encuentra la verdad.",
    "La vida es larga para quien sabe esperar.",
    "No hay prisa en el camino del sabio.",
    "La tortuga llega antes que el impaciente.",
    "Medita en el ahora, el futuro vendrá.",
    "El sabio espera, el necio corre.",
    "Cada día es una lección de paciencia.",
    "La contemplación es el sendero.",
    "Lento pero constante, así se llega.",
    "El tiempo es el maestro más antiguo.",
    "Respira profundo, el destino está escrito.",
    "La serenidad es tu mayor fortaleza.",
    "Observa el horizonte sin ansiedad.",
    "La espera es meditación en movimiento.",
    "Cada amanecer es un regalo."
];

// Intro Animation Logic
function playIntro() {
    const overlay = document.getElementById('intro-overlay');
    const colors = ['#8FBC8F', '#E6A57E', '#556B2F', '#A2D5A2'];

    // Generate leaves
    for (let i = 0; i < 30; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 2 + 2) + 's'; // 2-4s
        leaf.style.animationDelay = (Math.random() * 1) + 's';
        leaf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        leaf.style.transform = `scale(${Math.random() * 0.5 + 0.5})`; // Random size
        overlay.appendChild(leaf);
    }

    // Fade out overlay after animation starts finishing
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 2500);
}

// Petting Interaction Logic
function setupPetting() {
    const capy = document.getElementById('capyImage');
    const turtle = document.getElementById('turtleImage');
    const container = document.querySelector('.capybara-container');

    // Petting for Capybara
    capy.addEventListener('click', (e) => {
        // 1. Wiggle Animation
        capy.classList.remove('petting');
        void capy.offsetWidth; // Trigger reflow
        capy.classList.add('petting');

        // 2. Spawn Hearts
        spawnHeart(container, e);
    });

    // Petting for Turtle (slower, wiser reaction)
    turtle.addEventListener('click', (e) => {
        // 1. Gentle Wiggle Animation
        turtle.classList.remove('petting');
        void turtle.offsetWidth; // Trigger reflow
        turtle.classList.add('petting');

        // 2. Spawn Hearts
        spawnHeart(container, e);
    });
}

function spawnHeart(container, event) {
    const hearts = ['❤️', '💕', '💖', '💗'];
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];

    // Position heart near click, but relative to container
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    heart.style.left = (x - 10) + 'px'; // Center
    heart.style.top = (y - 20) + 'px';

    container.appendChild(heart);

    // Cleanup heart
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// State
let currentSimulatedDate = new Date();
let previousDaysLeft = -1;

function getDaysLeft(baseDate) {
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function updateCapybaraMood(daysLeft) {
    const imgElement = document.getElementById('capyImage');
    const turtleElement = document.getElementById('turtleImage');
    const msgElement = document.getElementById('dailyMessage');
    const container = document.querySelector('.capybara-container');

    // Determine which character(s) to show
    // Multiples of 3: Both together
    // Other even days: Capybara only
    // Odd days: Turtle only
    const isBothDay = (daysLeft % 3 === 0);
    const isCapyDay = !isBothDay && (daysLeft % 2 === 0);
    const isTurtleDay = !isBothDay && (daysLeft % 2 !== 0);

    let imageSrc, turtleSrc, message;
    let showCapy, showTurtle;

    if (isBothDay) {
        // Both characters day
        const capyIndex = daysLeft % images.length;
        const turtleIndex = daysLeft % turtleImages.length;
        imageSrc = images[capyIndex];
        turtleSrc = turtleImages[turtleIndex];
        // Mix messages from both
        const allMessages = [...zenMessages, ...turtleMessages];
        const msgIndex = daysLeft % allMessages.length;
        message = allMessages[msgIndex];
        showCapy = true;
        showTurtle = true;
        container.classList.add('both-characters');
    } else if (isCapyDay) {
        // Capybara only
        const index = daysLeft % images.length;
        const msgIndex = daysLeft % zenMessages.length;
        imageSrc = images[index];
        message = zenMessages[msgIndex];
        showCapy = true;
        showTurtle = false;
        container.classList.remove('both-characters');
    } else {
        // Turtle only
        const index = daysLeft % turtleImages.length;
        const msgIndex = daysLeft % turtleMessages.length;
        turtleSrc = turtleImages[index];
        message = turtleMessages[msgIndex];
        showCapy = false;
        showTurtle = true;
        container.classList.remove('both-characters');
    }

    // Fade out, swap, fade in
    imgElement.style.opacity = '0';
    turtleElement.style.opacity = '0';
    msgElement.style.opacity = '0';

    setTimeout(() => {
        if (showCapy) {
            imgElement.src = imageSrc;
            imgElement.style.display = '';
            imgElement.style.opacity = '1';
        } else {
            imgElement.style.display = 'none';
        }

        if (showTurtle) {
            turtleElement.src = turtleSrc;
            turtleElement.style.display = '';
            turtleElement.style.opacity = '1';
        } else {
            turtleElement.style.display = 'none';
        }

        msgElement.innerText = message;
        msgElement.style.opacity = '1';
    }, 300);
}

// --- LEGACY COUNTDOWN ARCHIVED ---
// The bamboo tally logic was moved to js/archive/legacy_countdown.js
// Replaced by Tree Countdown on Feb 11, 2026

function renderTally(days, animateRemoval = false) {
    // Safe adapter: delegates to Tree Countdown
    if (window.renderTree) {
        window.renderTree(days);
    }
}

// createBundle removed — archived in js/archive/legacy_countdown.js

// --- Logic & Events ---

function updateAll(date) {
    const days = getDaysLeft(date);

    // Detect if we should animate (only if days decreased by 1)
    const shouldAnimate = (previousDaysLeft !== -1 && days < previousDaysLeft);

    renderTally(days, shouldAnimate);
    updateCapybaraMood(days);

    previousDaysLeft = days;

    // Update debug text
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('debugDate').innerText = "Fecha simulada: " + date.toLocaleDateString('es-ES', options);
}

// Initialize
const now = new Date();
updateAll(now);
playIntro(); // Play intro on load
setupPetting(); // Enable petting
generateClouds(); // Generate clouds

function generateClouds() {
    const container = document.getElementById('cloudsContainer');
    const cloudCount = 6;

    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';

        // Randomize size
        const width = 100 + Math.random() * 150;
        const height = 40 + Math.random() * 40;
        cloud.style.width = width + 'px';
        cloud.style.height = height + 'px';

        // Randomize position
        cloud.style.top = (Math.random() * 40) + '%'; // Top 40% of screen (Higher up)

        // Randomize animation
        const duration = 60 + Math.random() * 60; // 60-120s
        const delay = Math.random() * -120; // Start at random point in animation
        cloud.style.animationDuration = duration + 's';
        cloud.style.animationDelay = delay + 's';

        // Randomize opacity
        cloud.style.opacity = 0.7 + Math.random() * 0.3; // Increased opacity

        container.appendChild(cloud);
    }
}

// Time Travel Slider Logic
const slider = document.getElementById('timeTravel');
const maxDays = getDaysLeft(now); // Set slider max to current days left (so we can go back to 0)
slider.max = maxDays + 10; // Give some buffer
slider.value = 0; // 0 means "add 0 days to today", actually we want to subtract? 
// Let's make the slider represent "Days Passed from Today".

slider.addEventListener('input', (e) => {
    const daysPassed = parseInt(e.target.value);
    const simulatedDate = new Date();
    simulatedDate.setDate(simulatedDate.getDate() + daysPassed);
    updateAll(simulatedDate);
});


// Debug Panel Visibility Logic
function checkDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const debugPanel = document.querySelector('.debug-panel');

    // 1. Check URL parameter ?debug=true
    if (urlParams.get('debug') === 'true') {
        debugPanel.style.display = 'block';
    }

    // 2. Secret Key Sequence: type 'dev'
    let keySequence = '';
    window.addEventListener('keydown', (e) => {
        keySequence += e.key;
        if (keySequence.length > 3) {
            keySequence = keySequence.slice(-3);
        }
        if (keySequence === 'dev') {
            const isHidden = debugPanel.style.display === 'none' || debugPanel.style.display === '';
            debugPanel.style.display = isHidden ? 'block' : 'none';
            if (isHidden) debugPanel.open = true; // Auto-expand

            // Clear sequence to prevent double toggling
            keySequence = '';
        }
    });
}
checkDebugMode();

// Version Display
const APP_VERSION = "v3.2 - Fix DB Error";
const versionEl = document.getElementById('versionDisplay');
if (versionEl) versionEl.innerText = "Versión: " + APP_VERSION;

// Admin Panel Logic
const adminList = document.getElementById('adminNotesList');
const refreshBtn = document.getElementById('refreshAdminNotes');
const editForm = document.getElementById('adminEditForm');
const editKeyInput = document.getElementById('editKey');
const editTextInput = document.getElementById('editText');
const editTimeInput = document.getElementById('editTime');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

if (refreshBtn) {
    refreshBtn.addEventListener('click', loadAdminNotes);
}

function loadAdminNotes() {
    if (!database) return;
    adminList.innerHTML = 'Cargando...';

    database.ref('shared_notes').once('value').then(snapshot => {
        adminList.innerHTML = '';
        const notes = snapshot.val() || {};

        Object.keys(notes).forEach(key => {
            const note = notes[key];
            const div = document.createElement('div');
            div.className = 'admin-note-item';

            const dateStr = new Date(note.timestamp).toLocaleString();
            const shortText = note.text.substring(0, 20) + (note.text.length > 20 ? '...' : '');

            div.innerHTML = `
                <div class="admin-note-info" title="${note.text}">
                    <strong>${dateStr}</strong><br>
                    ${shortText}
                </div>
                <div class="admin-btn-group">
                    <button class="admin-btn edit-btn" data-key="${key}">✏️</button>
                    <button class="admin-btn delete-btn" data-key="${key}">🗑️</button>
                </div>
            `;

            // Attach Events
            div.querySelector('.edit-btn').addEventListener('click', () => openAdminEdit(key, note));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteAdminNote(key));

            adminList.appendChild(div);
        });
    });
}

function openAdminEdit(key, note) {
    editForm.classList.remove('hidden');
    editKeyInput.value = key;
    editTextInput.value = note.text;

    // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
    const date = new Date(note.timestamp);
    // Adjust for timezone offset to keep local time
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);

    editTimeInput.value = localISOTime;
}

function closeAdminEdit() {
    editForm.classList.add('hidden');
}

if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeAdminEdit);

if (saveEditBtn) {
    saveEditBtn.addEventListener('click', () => {
        const key = editKeyInput.value;
        const newText = editTextInput.value;
        const newTimeStr = editTimeInput.value;

        if (!key || !newText || !newTimeStr) return;

        const newTimestamp = new Date(newTimeStr).getTime();

        database.ref('shared_notes/' + key).update({
            text: newText,
            timestamp: newTimestamp
        }).then(() => {
            alert('Nota actualizada');
            closeAdminEdit();
            loadAdminNotes(); // Refresh list

            // Optional: Refresh Main View?
            // Page reload might be easiest to sync everything
            if (confirm("¿Recargar página para ver cambios?")) location.reload();
        });
    });
}

function deleteAdminNote(key) {
    if (confirm('¿Seguro que quieres borrar esta nota para siempre?')) {
        database.ref('shared_notes/' + key).remove().then(() => {
            loadAdminNotes();
            // location.reload(); // Optional
        });
    }
}

// 3D Forest Integration logic remains...

// 3D Forest Integration
window.addEventListener('load', () => {
    if (window.init3DForest) window.init3DForest();

    const enter3dBtn = document.getElementById('enter3dBtn');
    if (enter3dBtn) {
        enter3dBtn.addEventListener('click', () => {
            if (window.toggle3DView) window.toggle3DView();
        });
    }
});

// Night Mode Logic
const themeToggle = document.getElementById('themeToggle');
const bodyTheme = document.body;

themeToggle.addEventListener('click', () => {
    bodyTheme.classList.toggle('night-mode');
    const isNight = bodyTheme.classList.contains('night-mode');
    themeToggle.innerText = isNight ? '☀️' : '🌙';

    // Optional: Switch Capybara to sleeping if night mode is on
    // But only if we want to override the daily mood. 
    // Let's keep it simple for now and just change the atmosphere.
});

// Feeding Logic
function feedCapybara(foodEmoji) {
    const capy = document.getElementById('capyImage');
    const container = document.querySelector('.capybara-container');

    // Create "offering"
    const offering = document.createElement('div');
    offering.innerText = foodEmoji;
    offering.className = 'food-projectile'; // Reusing class name but with new CSS

    // Position in center of container, slightly lower
    offering.style.left = '50%';
    offering.style.bottom = '20px';

    container.appendChild(offering);

    // Wait for animation to finish (1.5s total, but we trigger reaction a bit earlier for flow)
    setTimeout(() => {
        // Reaction: Happy Bounce
        capy.classList.remove('happy-bounce');
        void capy.offsetWidth; // Trigger reflow
        capy.classList.add('happy-bounce');

        // Reaction: Text Bubble
        const phrases = ['Ñam!', '¡Rico!', '¡Gracias!', '😋', '🤤'];
        const text = phrases[Math.floor(Math.random() * phrases.length)];

        const bubble = document.createElement('div');
        bubble.className = 'text-bubble';
        bubble.innerText = text;

        // Position relative to container
        bubble.style.left = '50%';
        bubble.style.top = '10%';
        bubble.style.transform = 'translateX(-50%) translateY(10px)';

        container.appendChild(bubble);

        // Animate in
        requestAnimationFrame(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after 1.5s
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => bubble.remove(), 300);
        }, 1500);

        // Spawn hearts
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.innerText = '❤️';

                // Center in container
                const containerRect = container.getBoundingClientRect();
                heart.style.left = (containerRect.width / 2 - 10 + (Math.random() * 40 - 20)) + 'px';
                heart.style.top = (containerRect.height / 2 - 50) + 'px';
                container.appendChild(heart);

                setTimeout(() => heart.remove(), 1000);
            }, i * 200);
        }

    }, 1200); // Trigger reaction just before food fades out completely

    // Cleanup offering
    setTimeout(() => {
        offering.remove();
    }, 1500);
}

// --- Mini-Game Logic has been moved to js/basket-game.js ---

// ==========================================
// 3. Render Notes & 3D Hooks (Restored)
// ==========================================

function renderNotes(notes) {
    const list = document.getElementById('notesList');
    if (!list) return;

    list.innerHTML = '';

    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-entry';

        const date = new Date(note.timestamp);
        // Clean Date Formatting
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        div.innerHTML = `
            <div class="note-id">#${note.id} <span class="note-time">${timeStr}</span></div>
            <div class="note-text">${escapeHtml(note.text)}</div>
        `;
        list.appendChild(div);
    });

    // --- 3D INJECTION ---
    if (window.spawnBlankNote) {
        // Wait a bit for forest to init
        setTimeout(window.spawnBlankNote, 1000);
    }
}

// Global Save Hook for 3D
window.save3DNote = function (text) {
    if (!database) {
        console.error("Database not initialized");
        return;
    }
    const noteRef = database.ref('shared_notes').push();
    noteRef.set({
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userId: generateUserId()
    }, (error) => {
        if (error) {
            alert("Error de Firebase: " + error.message);
        } else {
            console.log("Nota guardada con éxito");
        }
    });

    // Helper for generating User ID if needed inside this scope, 
    // though usually we use localStorage logic in sendNote.
    function generateUserId() {
        let userId = localStorage.getItem('capi_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('capi_user_id', userId);
        }
        return userId;
    }
};

// ==========================================
// RIVER GAME se carga desde js/river-game.js
// ==========================================
