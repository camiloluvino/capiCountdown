// --- FIREBASE CONFIGURATION ---
// ⚠️ IMPORTANTE: Pega aquí abajo el código que te dio Firebase
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
    console.error("Error inicializando Firebase (¿Falta la config?):", e);
}

const notesBtn = document.getElementById('notesButton');
const notesOverlay = document.getElementById('notes-overlay');
const closeNotesBtn = document.getElementById('closeNotes');
const noteInput = document.getElementById('noteInput');
const sendNoteBtn = document.getElementById('sendNote');
const notesList = document.getElementById('notesList');

// Toggle UI
notesBtn.addEventListener('click', () => {
    notesOverlay.style.display = 'flex';
    void notesOverlay.offsetWidth;
    notesOverlay.style.opacity = '1';
    scrollToBottom();
});

closeNotesBtn.addEventListener('click', () => {
    notesOverlay.style.opacity = '0';
    setTimeout(() => {
        notesOverlay.style.display = 'none';
    }, 300);
});


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
            notesList.innerHTML = '<div class="note-message system-message">Escribe la primera nota... ✨</div>';
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
const images = [
    'assets/images/capybara.png',          // Relaxed
    'assets/images/capybara_eating.png',   // Eating
    'assets/images/capybara_sleeping.png', // Sleeping
    'assets/images/capybara_onsen.png',    // Onsen
    'assets/images/capybara_reading.png',  // Reading
    'assets/images/capybara_music.png',    // Music
    'assets/images/capybara_cooking.png'   // Cooking
];

// Preload images
images.forEach(src => {
    const img = new Image();
    img.src = src;
});

const zenMessages = [
    "Ya falta menos que ayer.",
    "El tiempo avanza, quieras o no.",
    "Todo llega a su debido tiempo.",
    "Un día más, un día menos.",
    "La espera es parte del proceso.",
    "El 28 se acerca sin prisa pero sin pausa.",
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
    "Mantén la visión en el 28.",
    "Pequeños pasos, grandes distancias.",
    "La espera construye el carácter.",
    "Ya casi puedes saborearlo.",
    "Tranquilidad y buenos alimentos.",
    "El futuro se construye hoy.",
    "Nada es eterno, ni siquiera la espera.",
    "Sonríe, el tiempo está de tu lado.",
    "La mejor compañía es la calma.",
    "Observa cómo pasan las nubes.",
    "El 28 brillará más que nunca."
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
    const container = document.querySelector('.capybara-container');

    capy.addEventListener('click', (e) => {
        // 1. Wiggle Animation
        capy.classList.remove('petting');
        void capy.offsetWidth; // Trigger reflow
        capy.classList.add('petting');

        // 2. Spawn Hearts
        const hearts = ['❤️', '💖', '💗', '💕'];
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];

        // Position heart near click, but relative to container
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        heart.style.left = (x - 10) + 'px'; // Center
        heart.style.top = (y - 20) + 'px';

        container.appendChild(heart);

        // Cleanup heart
        setTimeout(() => {
            heart.remove();
        }, 1000);
    });
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
    const msgElement = document.getElementById('dailyMessage');

    // Cycle logic: Use daysLeft to pick an image index
    // We use daysLeft so it's consistent for everyone on that specific day
    const index = daysLeft % images.length;
    const msgIndex = daysLeft % zenMessages.length;

    // Fade out, swap, fade in
    imgElement.style.opacity = '0';
    msgElement.style.opacity = '0';

    setTimeout(() => {
        imgElement.src = images[index];
        msgElement.innerText = zenMessages[msgIndex];

        imgElement.style.opacity = '1';
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

    // document.getElementById('daysText').innerText = `Faltan ${days} días`;
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
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            // Clear sequence to prevent double toggling
            keySequence = '';
        }
    });
}
checkDebugMode();

// Version Display
const APP_VERSION = "v1.2 - Actualizado: 23:29 (Lush Forest)";
const versionEl = document.getElementById('versionDisplay');
if (versionEl) versionEl.innerText = versionEl.innerText = "Versión: " + APP_VERSION;

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
        const phrases = ['¡Ñam!', '¡Rico!', '¡Gracias!', '😋', '🍊'];
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
                heart.innerText = '😋';

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
            heartsHTML += '❤️';
        } else {
            heartsHTML += '💔'; // Broken or empty heart
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
        { text: '🍎', score: 10, speed: 2, type: 'fruit' },
        { text: '🍊', score: 10, speed: 2.5, type: 'fruit' },
        { text: '🍉', score: 10, speed: 3, type: 'fruit' },
        { text: '🌸', score: 20, speed: 1.5, type: 'rare' },
        { text: '⭐️', score: 50, speed: 3.5, type: 'rare' },
        { text: '🍂', score: 100, speed: 1, type: 'leaf' } // High score!
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
            showFeedback(item.x, window.innerHeight - 50, '💔');

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
        <h2 style="color: #556B2F; margin-top:0;">¡Juego Terminado!</h2>
        <p style="font-size: 1.5rem; margin: 10px 0;">Puntuación Final: <b>${score}</b></p>
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
