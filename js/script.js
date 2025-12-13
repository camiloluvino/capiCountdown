// --- FIREBASE CONFIGURATION ---
// ?? IMPORTANTE: Pega aqu� abajo el c�digo que te dio Firebase
// Reemplaza todo el objeto firebaseConfig con el tuyo.
const firebaseConfig = {
    apiKey: "AIzaSyCHsBs2yjkX290sxePbpz8ub5KiEV482Xk",
    authDomain: "capicountdown.firebaseapp.com",
    databaseURL: "https://capicountdown-default-rtdb.firebaseio.com",
    projectId: "capicountdown",
    storageBucket: "capicountdown.firebasestorage.app",
    messagingSenderId: "400786374644",
    appId: "1:400786374644:web:02cd7a3fc4ee3478bdc3a1",
    measurementId: "G-9G94HV5RZV"
};
// -----------------------------

// Initialize Firebase safely
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase inicializado");
} catch (e) {
    console.error("Error inicializando Firebase (�Falta la config?):", e);
}

// --- Notes System Integration ---
const notesButton = document.getElementById('notesButton');
const notesOverlay = document.getElementById('notes-overlay');
const closeNotes = document.getElementById('closeNotes');
const start3dBtn = document.getElementById('start-3d-btn');

// Load Notes on Startup
// Assuming fetchNotes() is defined elsewhere or will be added.
// For now, let's ensure it doesn't cause an error if not present.
if (typeof fetchNotes === 'function') {
    fetchNotes();
}


// OPEN NOTES -> DIRECTLY TO 3D FOREST (User Request: Hide 2D List)
if (notesButton) {
    notesButton.addEventListener('click', () => {
        // Instead of showing the 2D overlay, we go straight to 3D
        // Initialize if not ready
        if (window.init3DForest && !document.getElementById('forest-viewport').innerHTML) {
            window.init3DForest();
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
        console.error("Error conexi�n inicial:", e);
        notesList.innerHTML = '<div class="note-message system-message" style="color:red">Error de conexi�n</div>';
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

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Configuration
const targetDate = new Date('2026-01-28T00:00:00');

// Capybara images
const images = [
    'assets/images/capybara.png',          // Relaxed
    'assets/images/capybara_eating.png',   // Eating
    'assets/images/capybara_sleeping.png', // Sleeping
    'assets/images/capybara_onsen.png',    // Onsen
    'assets/images/capybara_reading.png',  // Reading
    'assets/images/capybara_music.png',    // Music
    'assets/images/capybara_cooking.png'   // Cooking
];

// Turtle images
const turtleImages = [
    'assets/images/tortuga-removebg-preview.png',           // Meditating
    'assets/images/tortuga_reading-removebg-preview.png',   // Reading (wise)
    'assets/images/tortuga_eating-removebg-preview.png',    // Eating
    'assets/images/tortuga_sleeping-removebg-preview.png'   // Sleeping
];

// Preload all images
[...images, ...turtleImages].forEach(src => {
    const img = new Image();
    img.src = src;
});

// Capybara messages (social, relaxed, fun)
const zenMessages = [
    "Ya falta menos que ayer.",
    "El tiempo avanza, quieras o no.",
    "Todo llega a su debido tiempo.",
    "Un d�a m�s, un d�a menos.",
    "La espera es parte del proceso.",
    "El 28 se acerca sin prisa pero sin pausa.",
    "Guardando energ�a para el gran d�a.",
    "Paciencia: el arte de dejar que el tiempo pase.",
    "Solo es cuesti�n de tiempo.",
    "El calendario no se detiene.",
    "Lo bueno se hace esperar.",
    "Cada segundo cuenta.",
    "Respira, ya casi estamos.",
    "La meta est� m�s cerca.",
    "Disfruta el camino.",
    "Hoy es un paso m�s.",
    "La paciencia es amarga, pero su fruto es dulce.",
    "No cuentes los d�as, haz que los d�as cuenten.",
    "Todo llega para quien sabe esperar.",
    "Conf�a en el tiempo.",
    "Un d�a a la vez.",
    "La calma antes de la celebraci�n.",
    "Preparando motores...",
    "Siente la brisa de la espera.",
    "Mant�n la visi�n en el 28.",
    "Peque�os pasos, grandes distancias.",
    "La espera construye el car�cter.",
    "Ya casi puedes saborearlo.",
    "Tranquilidad y buenos alimentos.",
    "El futuro se construye hoy.",
    "Nada es eterno, ni siquiera la espera.",
    "Sonr�e, el tiempo est� de tu lado.",
    "La mejor compa��a es la calma.",
    "Observa c�mo pasan las nubes.",
    "El 28 brillar� m�s que nunca."
];

// Turtle messages (wise, contemplative, philosophical)
const turtleMessages = [
    "La paciencia es la compa�era del sabio.",
    "Cada paso lento es un paso seguro.",
    "El tiempo no tiene prisa, �por qu� habr�as de tenerla t�?",
    "La sabidur�a crece con la quietud.",
    "Observa, reflexiona, avanza.",
    "En la calma se encuentra la verdad.",
    "La vida es larga para quien sabe esperar.",
    "No hay prisa en el camino del sabio.",
    "La tortuga llega antes que el impaciente.",
    "Medita en el ahora, el futuro vendr�.",
    "El sabio espera, el necio corre.",
    "Cada d�a es una lecci�n de paciencia.",
    "La contemplaci�n es el sendero.",
    "Lento pero constante, as� se llega.",
    "El tiempo es el maestro m�s antiguo.",
    "Respira profundo, el 28 est� escrito.",
    "La serenidad es tu mayor fortaleza.",
    "Observa el horizonte sin ansiedad.",
    "La espera es meditaci�n en movimiento.",
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
    const hearts = ['??', '??', '??', '??'];
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

function renderTally(days, animateRemoval = false) {
    const container = document.getElementById('counter');

    // Simplified "Visual" Trick:
    // Just render the new state. The user sees the count drop.
    // To make it cooler, let's try to render the "falling" stick.

    container.innerHTML = '';

    const bundles = Math.floor(days / 5);
    const remainder = days % 5;

    // Render full bundles
    for (let i = 0; i < bundles; i++) {
        createBundle(5, true, container);
    }

    // Render remainder
    if (remainder > 0) {
        createBundle(remainder, false, container);
    }

    // If we want to show a falling stick (the one that just vanished)
    if (animateRemoval) {
        const fallingStick = document.createElement('div');
        fallingStick.className = 'stick falling';
        fallingStick.style.height = '60px'; // Approximate bundle height
        fallingStick.style.width = '8px';
        fallingStick.style.marginLeft = '10px';
        container.appendChild(fallingStick);
    }

    // document.getElementById('daysText').innerText = `Faltan ${days} d�as`;
}

function createBundle(count, isCompleted, parent) {
    const bundle = document.createElement('div');
    bundle.className = 'bundle';
    if (isCompleted) bundle.classList.add('completed');

    const verticalCount = isCompleted ? 4 : count;

    for (let i = 0; i < 4; i++) {
        const stick = document.createElement('div');
        stick.className = 'stick';
        if (i >= verticalCount) {
            stick.style.opacity = '0';
        }
        bundle.appendChild(stick);
    }

    if (isCompleted) {
        const diagonal = document.createElement('div');
        diagonal.className = 'stick diagonal';
        bundle.appendChild(diagonal);

        const yuzu = document.createElement('div');
        yuzu.className = 'yuzu';
        bundle.appendChild(yuzu);
    }

    parent.appendChild(bundle);
}

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
if (versionEl) versionEl.innerText = versionEl.innerText = "Versi�n: " + APP_VERSION;

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
                    <button class="admin-btn edit-btn" data-key="${key}">??</button>
                    <button class="admin-btn delete-btn" data-key="${key}">???</button>
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
            if (confirm("Recargar p�gina para ver cambios?")) location.reload();
        });
    });
}

function deleteAdminNote(key) {
    if (confirm('�Seguro que quieres borrar esta nota para siempre?')) {
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
    themeToggle.innerText = isNight ? '??' : '??';

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
        const phrases = ['��am!', '�Rico!', '�Gracias!', '??', '??'];
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
                heart.innerText = '??';

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

// --- Mini-Game Logic: La Cesta de Regalos ---
const playBtn = document.getElementById('playButton');
const gameOverlay = document.getElementById('game-overlay');
const closeGameBtn = document.getElementById('closeGame');
const player = document.getElementById('game-player');
// scoreDisplay defined in updateScoreboard

let gameActive = false;
let score = 0;
let lives = 5; // New state
let itemCounts = {};
let gameLoopId;
let spawnIntervalId;
let items = [];
let mouseX = window.innerWidth / 2;

// Open Game (Reset everything)
playBtn.addEventListener('click', () => {
    gameOverlay.style.display = 'flex';
    void gameOverlay.offsetWidth;
    gameOverlay.style.opacity = '1';
    startGame();
});

// Close Game
closeGameBtn.addEventListener('click', () => {
    gameOverlay.style.opacity = '0';
    setTimeout(() => {
        gameOverlay.style.display = 'none';
        stopGame();
    }, 500);
});

// Player Movement (Mouse/Touch)
window.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    mouseX = e.clientX;
    updatePlayerPosition();
});

window.addEventListener('touchmove', (e) => {
    if (!gameActive) return;
    mouseX = e.touches[0].clientX;
    updatePlayerPosition();
});

function updatePlayerPosition() {
    // Clamp to screen
    const x = Math.max(60, Math.min(window.innerWidth - 60, mouseX));
    player.style.left = x + 'px';
}

function startGame() {
    gameActive = true;
    score = 0;
    lives = 5; // Reset lives
    itemCounts = {};
    updateScoreboard();
    items = [];

    // Hide game over message if it exists
    const lostMsg = document.getElementById('gameOverMessage');
    if (lostMsg) lostMsg.remove();

    // Clear existing items
    document.querySelectorAll('.game-item').forEach(el => el.remove());

    // Start Loops
    spawnIntervalId = setInterval(spawnItem, 1000);
    gameLoop();
}

function stopGame() {
    gameActive = false;
    clearInterval(spawnIntervalId);
    cancelAnimationFrame(gameLoopId);
}

function updateScoreboard() {
    document.getElementById('score').innerText = score;

    // Update Lives Display (UI)
    let livesContainer = document.getElementById('livesContainer');
    if (!livesContainer) {
        // Create if missing
        livesContainer = document.createElement('div');
        livesContainer.id = 'livesContainer';
        livesContainer.className = 'lives-display';
        // Insert after total score
        const scoreTotal = document.querySelector('.score-total');
        scoreTotal.parentNode.insertBefore(livesContainer, scoreTotal.nextSibling);
    }

    // Render Hearts
    let heartsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < lives) {
            heartsHTML += '??';
        } else {
            heartsHTML += '??'; // Broken or empty heart
        }
    }
    livesContainer.innerHTML = heartsHTML;

    const detailsContainer = document.getElementById('scoreDetails');
    detailsContainer.innerHTML = '';

    // Render counts for each item type
    for (const [emoji, count] of Object.entries(itemCounts)) {
        if (count > 0) {
            const badge = document.createElement('div');
            badge.innerText = `${emoji} ${count}`;
            detailsContainer.appendChild(badge);
        }
    }
}

function spawnItem() {
    if (!gameActive) return;

    const types = [
        { text: '??', score: 10, speed: 2, type: 'fruit' },
        { text: '??', score: 10, speed: 2.5, type: 'fruit' },
        { text: '??', score: 10, speed: 3, type: 'fruit' },
        { text: '??', score: 20, speed: 1.5, type: 'rare' },
        { text: '??', score: 50, speed: 3.5, type: 'rare' },
        { text: '??', score: 100, speed: 1, type: 'leaf' } // High score!
    ];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const item = document.createElement('div');
    item.className = 'game-item';
    item.innerText = randomType.text;

    // Random X start
    const startX = Math.random() * (window.innerWidth - 60);
    item.style.left = startX + 'px';
    item.style.top = '-50px';

    gameOverlay.appendChild(item);

    items.push({
        element: item,
        x: startX,
        y: -50,
        speed: randomType.speed,
        type: randomType.type,
        score: randomType.score,
        text: randomType.text,
        wobble: Math.random() * Math.PI * 2
    });
}

function gameLoop() {
    if (!gameActive) return;

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];

        // Move down
        item.y += item.speed;

        // Wobble for leaves
        if (item.type === 'leaf') {
            item.x += Math.sin(item.y / 50 + item.wobble) * 1.5; // Gentle sway
        }

        item.element.style.top = item.y + 'px';
        item.element.style.left = item.x + 'px';

        // Collision Detection
        const playerRect = player.getBoundingClientRect();
        const itemRect = item.element.getBoundingClientRect();

        // Player is bigger now (120px), adjust hitbox slightly
        // Hitbox: center 60% of width/height for fairness
        const hitMarginX = playerRect.width * 0.2;
        const hitMarginY = playerRect.height * 0.2;

        if (
            itemRect.bottom >= playerRect.top + hitMarginY &&
            itemRect.top <= playerRect.bottom - hitMarginY &&
            itemRect.right >= playerRect.left + hitMarginX &&
            itemRect.left <= playerRect.right - hitMarginX
        ) {
            // Collision!
            score += item.score;

            // Update count
            itemCounts[item.text] = (itemCounts[item.text] || 0) + 1;

            updateScoreboard();
            showFeedback(item.x, item.y, '+' + item.score);

            // Remove item
            item.element.remove();
            items.splice(i, 1);
            continue;
        }

        // Remove if off screen (MISS!)
        if (item.y > window.innerHeight) {
            // Penalty for missing
            lives--;
            updateScoreboard();

            // Visual feedback for miss
            showFeedback(item.x, window.innerHeight - 50, '??');

            item.element.remove();
            items.splice(i, 1);

            if (lives <= 0) {
                gameOver();
                return; // Stop loop
            }
        }
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    stopGame();

    const overlay = document.getElementById('game-overlay');

    const msg = document.createElement('div');
    msg.id = 'gameOverMessage';
    msg.style.position = 'absolute';
    msg.style.top = '50%';
    msg.style.left = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.background = 'white';
    msg.style.padding = '30px';
    msg.style.borderRadius = '20px';
    msg.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    msg.style.textAlign = 'center';
    msg.style.zIndex = '300';

    msg.innerHTML = `
        <h2 style="color: #556B2F; margin-top:0;">�Juego Terminado!</h2>
        <p style="font-size: 1.5rem; margin: 10px 0;">Puntuaci�n Final: <b>${score}</b></p>
        <button id="restartBtn" style="
            background: #8FBC8F; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 10px; 
            color: white; 
            font-size: 1.2rem;
            cursor: pointer;
            margin-top: 10px;
        ">Jugar de nuevo</button>
    `;

    overlay.appendChild(msg);

    document.getElementById('restartBtn').addEventListener('click', () => {
        msg.remove();
        startGame();
    });
}

function showFeedback(x, y, text) {
    const feedback = document.createElement('div');
    feedback.style.position = 'absolute';
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    feedback.style.color = '#E6A57E';
    feedback.style.fontWeight = 'bold';
    feedback.style.fontSize = '1.2rem';
    feedback.style.pointerEvents = 'none';
    feedback.innerText = text;
    feedback.style.zIndex = 220;

    // Animate up
    feedback.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-30px)', opacity: 0 }
    ], {
        duration: 800,
        easing: 'ease-out'
    });

    gameOverlay.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}

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
            console.log("Nota guardada con �xito");
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
// RIVER GAME - Cruzando el R�o (Horizontal Zen Version)
// ==========================================

const RiverGame = {
    isRunning: false,
    animationId: null,

    // Player position (Y is vertical movement, X is auto-progress)
    playerY: 50, // percentage from top
    playerX: 100, // pixels from left (starts at shore)

    // Game state
    stability: 100,
    progress: 0, // 0 to 100 (crossing progress)
    crosses: 0, // successful crossings
    obstacles: [],
    powerups: [],
    lastObstacleTime: 0,
    lastPowerupTime: 0,

    // Game dimensions
    riverStart: 80, // left shore width
    riverEnd: 0, // calculated on start

    // Game elements
    overlay: null,
    gameArea: null,
    player: null,
    turtle: null,
    stabilityFill: null,
    progressFill: null,
    crossCount: null,

    // Obstacle types - gentle damage (using universally supported emojis)
    obstacleTypes: [
        { emoji: '🪵', damage: 12 },
        { emoji: '🪨', damage: 15 },
        { emoji: '💫', damage: 18 },
    ],

    // Power-up types
    powerupTypes: [
        { emoji: '🍊', heal: 15 },
        { emoji: '🌸', heal: 25 },
        { emoji: '🍃', heal: 20 },
    ],

    init() {
        this.overlay = document.getElementById('river-overlay');
        this.gameArea = document.getElementById('river-game-area');
        this.player = document.getElementById('river-player');
        this.turtle = this.player?.querySelector('.river-turtle');
        this.stabilityFill = document.getElementById('stabilityFill');
        this.progressFill = document.getElementById('progressFill');
        this.crossCount = document.getElementById('crossCount');

        // Button listeners
        document.getElementById('riverButton')?.addEventListener('click', () => this.start());
        document.getElementById('closeRiver')?.addEventListener('click', () => this.end());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch controls for mobile
        this.setupTouchControls();
    },

    setupTouchControls() {
        if (!this.overlay) return;

        this.overlay.addEventListener('touchmove', (e) => {
            if (!this.isRunning) return;
            const touchY = e.touches[0].clientY;
            const screenHeight = window.innerHeight;
            // Map touch Y to player Y position (15-85%)
            this.playerY = Math.max(15, Math.min(85, (touchY / screenHeight) * 100));
        }, { passive: true });
    },

    keysPressed: {},

    handleKeyDown(e) {
        if (!this.isRunning) return;
        this.keysPressed[e.key] = true;

        // Prevent page scrolling
        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    },

    handleKeyUp(e) {
        this.keysPressed[e.key] = false;
    },

    start() {
        // Calculate river dimensions
        const screenWidth = window.innerWidth;
        this.riverStart = 100; // left shore + some buffer
        this.riverEnd = screenWidth - 100; // right shore

        // Reset game state
        this.stability = 100;
        this.progress = 0;
        this.playerY = 50;
        this.playerX = this.riverStart;
        this.obstacles = [];
        this.powerups = [];
        this.lastObstacleTime = 0;
        this.lastPowerupTime = 0;
        this.isRunning = true;

        // Clear any existing elements
        this.clearGameElements();

        // Show overlay
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);

        // Update UI
        this.updateUI();
        this.updatePlayerPosition();

        // Start game loop
        this.lastFrameTime = performance.now();
        this.gameLoop();
    },

    end() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.clearGameElements();
        }, 500);
    },

    clearGameElements() {
        document.querySelectorAll('.river-obstacle, .river-powerup, .splash, .celebration').forEach(el => el.remove());
        this.obstacles = [];
        this.powerups = [];
    },

    gameLoop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        // Handle vertical input (up/down only)
        this.handleInput(deltaTime);

        // Auto-move forward (left to right) - very slow, zen pace
        const forwardSpeed = 40; // pixels per second
        this.playerX += forwardSpeed * deltaTime;

        // Calculate progress percentage
        const totalDistance = this.riverEnd - this.riverStart;
        this.progress = Math.min(100, ((this.playerX - this.riverStart) / totalDistance) * 100);

        // Spawn obstacles (coming from ahead)
        if (now - this.lastObstacleTime > 2000) {
            this.spawnObstacle();
            this.lastObstacleTime = now;
        }

        // Spawn powerups occasionally
        if (now - this.lastPowerupTime > 3500) {
            this.spawnPowerup();
            this.lastPowerupTime = now;
        }

        // Update obstacles and powerups
        this.updateObstacles(deltaTime);
        this.updatePowerups(deltaTime);

        // Update UI
        this.updateUI();
        this.updatePlayerPosition();

        // Check win condition
        if (this.progress >= 100) {
            this.successCrossing();
            return;
        }

        // Check lose condition
        if (this.stability <= 0) {
            this.failCrossing();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    handleInput(deltaTime) {
        const moveSpeed = 120; // pixels-ish per second (for percentage)

        if (this.keysPressed['ArrowUp'] || this.keysPressed['w']) {
            this.playerY -= moveSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowDown'] || this.keysPressed['s']) {
            this.playerY += moveSpeed * deltaTime;
        }

        // Clamp position
        this.playerY = Math.max(15, Math.min(85, this.playerY));
    },

    updatePlayerPosition() {
        if (!this.player) return;
        this.player.style.left = this.playerX + 'px';
        this.player.style.top = this.playerY + '%';
    },

    spawnObstacle() {
        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const obstacle = document.createElement('div');
        obstacle.className = 'river-obstacle';
        obstacle.innerText = type.emoji;

        // Spawn ahead of player (to the right)
        obstacle.style.left = (this.playerX + 400 + Math.random() * 200) + 'px';
        obstacle.style.top = (15 + Math.random() * 70) + '%';

        this.gameArea.appendChild(obstacle);
        this.obstacles.push({
            element: obstacle,
            x: parseFloat(obstacle.style.left),
            y: parseFloat(obstacle.style.top),
            damage: type.damage
        });
    },

    spawnPowerup() {
        const type = this.powerupTypes[Math.floor(Math.random() * this.powerupTypes.length)];
        const powerup = document.createElement('div');
        powerup.className = 'river-powerup';
        powerup.innerText = type.emoji;

        powerup.style.left = (this.playerX + 350 + Math.random() * 200) + 'px';
        powerup.style.top = (15 + Math.random() * 70) + '%';

        this.gameArea.appendChild(powerup);
        this.powerups.push({
            element: powerup,
            x: parseFloat(powerup.style.left),
            y: parseFloat(powerup.style.top),
            heal: type.heal
        });
    },

    updateObstacles(deltaTime) {
        // Obstacles drift slowly (river current - toward player)
        const driftSpeed = 20; // very slow

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= driftSpeed * deltaTime;
            obs.element.style.left = obs.x + 'px';

            // Check collision
            if (this.checkCollision(obs)) {
                this.hitObstacle(obs);
                obs.element.remove();
                this.obstacles.splice(i, 1);
                continue;
            }

            // Remove if behind player (passed)
            if (obs.x < this.playerX - 100) {
                obs.element.remove();
                this.obstacles.splice(i, 1);
            }
        }
    },

    updatePowerups(deltaTime) {
        const driftSpeed = 15;

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pw = this.powerups[i];
            pw.x -= driftSpeed * deltaTime;
            pw.element.style.left = pw.x + 'px';

            if (this.checkCollision(pw)) {
                this.collectPowerup(pw);
                pw.element.remove();
                this.powerups.splice(i, 1);
                continue;
            }

            if (pw.x < this.playerX - 100) {
                pw.element.remove();
                this.powerups.splice(i, 1);
            }
        }
    },

    checkCollision(item) {
        if (!this.player) return false;
        const playerRect = this.player.getBoundingClientRect();
        const itemRect = item.element.getBoundingClientRect();

        // Smaller hitbox for more forgiving collisions
        const padding = 15;
        return !(playerRect.right - padding < itemRect.left ||
            playerRect.left + padding > itemRect.right ||
            playerRect.bottom - padding < itemRect.top ||
            playerRect.top + padding > itemRect.bottom);
    },

    hitObstacle(obstacle) {
        this.stability -= obstacle.damage;
        this.stability = Math.max(0, this.stability);

        // Turtle wobble
        if (this.turtle) {
            this.turtle.classList.add('wobble');
            setTimeout(() => this.turtle.classList.remove('wobble'), 300);
        }

        this.showFeedback('??', this.player.offsetLeft + 50, this.player.offsetTop);
    },

    collectPowerup(powerup) {
        this.stability = Math.min(100, this.stability + powerup.heal);
        this.showFeedback('??', this.player.offsetLeft + 50, this.player.offsetTop);
    },

    showFeedback(emoji, x, y) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            font-size: 2rem;
            pointer-events: none;
            z-index: 220;
        `;
        feedback.innerText = emoji;

        feedback.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-30px) scale(1.3)', opacity: 0 }
        ], { duration: 600, easing: 'ease-out' });

        this.gameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 600);
    },

    updateUI() {
        if (this.stabilityFill) {
            this.stabilityFill.style.width = this.stability + '%';

            // Color based on stability
            if (this.stability > 60) {
                this.stabilityFill.style.background = 'linear-gradient(to right, #7BAE7F, #A8C686)';
            } else if (this.stability > 30) {
                this.stabilityFill.style.background = 'linear-gradient(to right, #C9A86C, #E8C872)';
            } else {
                this.stabilityFill.style.background = 'linear-gradient(to right, #C98A6C, #E89272)';
            }
        }

        if (this.progressFill) {
            this.progressFill.style.width = this.progress + '%';
        }

        if (this.crossCount) {
            this.crossCount.innerText = this.crosses;
        }
    },

    successCrossing() {
        this.isRunning = false;
        this.crosses++;

        // Celebration effect
        this.showCelebration();

        // Ask to continue
        setTimeout(() => {
            const again = confirm(`?? �Cruzaste el r�o! ??\n\nCruces completados: ${this.crosses}\n\n�Ayudar a la tortuga a cruzar de vuelta?`);
            if (again) {
                this.resetForNextCrossing();
            } else {
                this.end();
            }
        }, 1500);
    },

    showCelebration() {
        const emojis = ['??', '?', '??', '??'];
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const celebration = document.createElement('div');
                celebration.className = 'celebration';
                celebration.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                celebration.style.cssText = `
                    position: absolute;
                    left: ${this.playerX + Math.random() * 100 - 50}px;
                    top: ${this.player.offsetTop + Math.random() * 60 - 30}px;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 220;
                `;

                celebration.animate([
                    { transform: 'translateY(0) scale(0.5)', opacity: 1 },
                    { transform: 'translateY(-50px) scale(1.5)', opacity: 0 }
                ], { duration: 1000, easing: 'ease-out' });

                this.gameArea.appendChild(celebration);
                setTimeout(() => celebration.remove(), 1000);
            }, i * 100);
        }
    },

    resetForNextCrossing() {
        // Reset position to start
        this.playerX = this.riverStart;
        this.playerY = 50;
        this.progress = 0;
        this.stability = 100;
        this.clearGameElements();
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    },

    failCrossing() {
        this.isRunning = false;

        // Splash effect
        const splash = document.createElement('div');
        splash.className = 'splash';
        splash.innerText = '??';
        splash.style.left = this.playerX + 'px';
        splash.style.top = this.player.offsetTop + 'px';
        this.gameArea.appendChild(splash);

        // Hide turtle briefly
        if (this.turtle) {
            this.turtle.style.opacity = '0';
        }

        // Gentle message
        setTimeout(() => {
            if (this.turtle) {
                this.turtle.style.opacity = '1';
            }

            const again = confirm(`?? La tortuga cay� al agua...\n\nPero las tortugas saben nadar un poco.\n�Intentarlo de nuevo?`);
            if (again) {
                this.resetForNextCrossing();
            } else {
                this.end();
            }
        }, 800);
    }
};

// Initialize River Game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    RiverGame.init();
});


