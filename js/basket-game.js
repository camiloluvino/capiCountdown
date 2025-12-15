// ==========================================
// MINI-GAME: La Cesta de Regalos
// ==========================================

const playBtn = document.getElementById('playButton');
const gameOverlay = document.getElementById('game-overlay');
const closeGameBtn = document.getElementById('closeGame');
const basketPlayer = document.getElementById('game-player');

let basketGameActive = false;
let basketScore = 0;
let basketLives = 5;
let basketItemCounts = {};
let basketGameLoopId;
let basketSpawnIntervalId;
let basketItems = [];
let basketMouseX = window.innerWidth / 2;

// Open Game (Reset everything)
if (playBtn) {
    playBtn.addEventListener('click', () => {
        gameOverlay.style.display = 'flex';
        void gameOverlay.offsetWidth;
        gameOverlay.style.opacity = '1';
        startBasketGame();
    });
}

// Close Game
if (closeGameBtn) {
    closeGameBtn.addEventListener('click', () => {
        gameOverlay.style.opacity = '0';
        setTimeout(() => {
            gameOverlay.style.display = 'none';
            stopBasketGame();
        }, 500);
    });
}

// Player Movement (Mouse/Touch)
window.addEventListener('mousemove', (e) => {
    if (!basketGameActive) return;
    basketMouseX = e.clientX;
    updateBasketPlayerPosition();
});

window.addEventListener('touchmove', (e) => {
    if (!basketGameActive) return;
    basketMouseX = e.touches[0].clientX;
    updateBasketPlayerPosition();
});

function updateBasketPlayerPosition() {
    if (!basketPlayer) return;
    const x = Math.max(60, Math.min(window.innerWidth - 60, basketMouseX));
    basketPlayer.style.left = x + 'px';
}

function startBasketGame() {
    basketGameActive = true;
    basketScore = 0;
    basketLives = 5;
    basketItemCounts = {};
    updateBasketScoreboard();
    basketItems = [];

    // Hide game over message if exists
    const lostMsg = document.getElementById('gameOverMessage');
    if (lostMsg) lostMsg.remove();

    // Clear existing items
    document.querySelectorAll('.game-item').forEach(el => el.remove());

    // Start Loops
    basketSpawnIntervalId = setInterval(spawnBasketItem, 1000);
    basketGameLoop();
}

function stopBasketGame() {
    basketGameActive = false;
    clearInterval(basketSpawnIntervalId);
    cancelAnimationFrame(basketGameLoopId);
}

function updateBasketScoreboard() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = basketScore;

    // Update Lives Display
    let livesContainer = document.getElementById('livesContainer');
    if (!livesContainer) {
        livesContainer = document.createElement('div');
        livesContainer.id = 'livesContainer';
        livesContainer.className = 'lives-display';
        const scoreTotal = document.querySelector('.score-total');
        if (scoreTotal) scoreTotal.parentNode.insertBefore(livesContainer, scoreTotal.nextSibling);
    }

    // Render Hearts
    let heartsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < basketLives) {
            heartsHTML += '❤️';
        } else {
            heartsHTML += '🖤';
        }
    }
    livesContainer.innerHTML = heartsHTML;

    const detailsContainer = document.getElementById('scoreDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = '';
        for (const [emoji, count] of Object.entries(basketItemCounts)) {
            if (count > 0) {
                const badge = document.createElement('div');
                badge.innerText = `${emoji} ${count}`;
                detailsContainer.appendChild(badge);
            }
        }
    }
}

function spawnBasketItem() {
    if (!basketGameActive) return;

    const types = [
        { text: '🍎', score: 10, speed: 2, type: 'fruit' },
        { text: '🍊', score: 10, speed: 2.5, type: 'fruit' },
        { text: '🍇', score: 10, speed: 3, type: 'fruit' },
        { text: '🎁', score: 20, speed: 1.5, type: 'rare' },
        { text: '⭐', score: 50, speed: 3.5, type: 'rare' },
        { text: '🍂', score: 100, speed: 1, type: 'leaf' }
    ];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const item = document.createElement('div');
    item.className = 'game-item';
    item.innerText = randomType.text;

    const startX = Math.random() * (window.innerWidth - 60);
    item.style.left = startX + 'px';
    item.style.top = '-50px';

    gameOverlay.appendChild(item);

    basketItems.push({
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

function basketGameLoop() {
    if (!basketGameActive) return;

    for (let i = basketItems.length - 1; i >= 0; i--) {
        const item = basketItems[i];

        item.y += item.speed;

        if (item.type === 'leaf') {
            item.x += Math.sin(item.y / 50 + item.wobble) * 1.5;
        }

        item.element.style.top = item.y + 'px';
        item.element.style.left = item.x + 'px';

        // Collision Detection
        if (basketPlayer) {
            const playerRect = basketPlayer.getBoundingClientRect();
            const itemRect = item.element.getBoundingClientRect();

            const hitMarginX = playerRect.width * 0.2;
            const hitMarginY = playerRect.height * 0.2;

            if (
                itemRect.bottom >= playerRect.top + hitMarginY &&
                itemRect.top <= playerRect.bottom - hitMarginY &&
                itemRect.right >= playerRect.left + hitMarginX &&
                itemRect.left <= playerRect.right - hitMarginX
            ) {
                basketScore += item.score;
                basketItemCounts[item.text] = (basketItemCounts[item.text] || 0) + 1;
                updateBasketScoreboard();
                showBasketFeedback(item.x, item.y, '+' + item.score);
                item.element.remove();
                basketItems.splice(i, 1);
                continue;
            }
        }

        // Remove if off screen (MISS!)
        if (item.y > window.innerHeight) {
            basketLives--;
            updateBasketScoreboard();
            showBasketFeedback(item.x, window.innerHeight - 50, '💔');
            item.element.remove();
            basketItems.splice(i, 1);

            if (basketLives <= 0) {
                basketGameOver();
                return;
            }
        }
    }

    basketGameLoopId = requestAnimationFrame(basketGameLoop);
}

function basketGameOver() {
    stopBasketGame();

    const msg = document.createElement('div');
    msg.id = 'gameOverMessage';
    msg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        text-align: center;
        z-index: 300;
    `;

    msg.innerHTML = `
        <h2 style="color: #556B2F; margin-top:0;">¡Juego Terminado!</h2>
        <p style="font-size: 1.5rem; margin: 10px 0;">Puntuación Final: <b>${basketScore}</b></p>
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

    gameOverlay.appendChild(msg);

    document.getElementById('restartBtn').addEventListener('click', () => {
        msg.remove();
        startBasketGame();
    });
}

function showBasketFeedback(x, y, text) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        color: #E6A57E;
        font-weight: bold;
        font-size: 1.2rem;
        pointer-events: none;
        z-index: 220;
    `;
    feedback.innerText = text;

    feedback.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-30px)', opacity: 0 }
    ], { duration: 800, easing: 'ease-out' });

    gameOverlay.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}
