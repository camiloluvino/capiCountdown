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

// Open Game -> Show LOBBY instead of auto-starting
if (playBtn) {
    playBtn.addEventListener('click', () => {
        gameOverlay.style.display = 'flex';
        void gameOverlay.offsetWidth;
        gameOverlay.style.opacity = '1';
        showBasketLobby(); // Show lobby instead of starting game
    });
}

// Create and show the lobby screen
function showBasketLobby() {
    // Hide game elements
    if (basketPlayer) basketPlayer.style.display = 'none';
    document.querySelector('.game-ui')?.classList.add('hidden');

    // Remove old lobby if exists
    const oldLobby = document.getElementById('basket-lobby');
    if (oldLobby) oldLobby.remove();

    // Create lobby
    const lobby = document.createElement('div');
    lobby.id = 'basket-lobby';
    lobby.className = 'basket-lobby';
    lobby.innerHTML = `
        <div class="lobby-content">
            <h2>🧺 La Cesta de Regalos</h2>
            <p>¿Cómo quieres jugar?</p>
            <button id="lobby-solo-btn" class="lobby-btn solo">
                🎮 Jugar Solo
            </button>
            <button id="lobby-multi-btn" class="lobby-btn multi">
                👫 Jugar con Pareja
            </button>
            <div id="lobby-multiplayer-section" class="hidden">
                <div class="lobby-divider"></div>
                <div id="lobby-mp-options">
                    <button id="lobby-create-btn" class="lobby-action-btn">🦫 Crear Sala (Capibara)</button>
                    <input type="text" id="lobby-join-code" class="lobby-input" placeholder="Código" maxlength="6">
                    <button id="lobby-join-btn" class="lobby-action-btn">🐢 Unirse (Tortuga)</button>
                </div>
                <div id="lobby-waiting" class="hidden">
                    <div class="character-badge capybara">
                        <span>🦫</span>
                        <small>Eres el Capibara</small>
                    </div>
                    <p>Esperando a tu Tortuga...</p>
                    <div class="lobby-code-display">
                        <span id="lobby-session-code">------</span>
                        <button id="lobby-copy-code">📋</button>
                    </div>
                </div>
                <div id="lobby-connected" class="hidden">
                    <div class="lobby-connected-status">
                        <span class="status-dot"></span>
                        <span>¡Conectados!</span>
                    </div>
                    <div class="lobby-players">
                        <div class="lobby-player" id="lobby-my-char">🦫 Tú</div>
                        <div class="lobby-player partner" id="lobby-partner-char">🐢 Pareja</div>
                    </div>
                    <button id="lobby-start-btn" class="lobby-btn start">🎮 ¡Iniciar Juego!</button>
                </div>
            </div>
        </div>
    `;
    gameOverlay.appendChild(lobby);

    // Setup lobby event listeners
    setupLobbyListeners();
}

function setupLobbyListeners() {
    // Solo play
    document.getElementById('lobby-solo-btn')?.addEventListener('click', () => {
        hideLobbyAndStart();
    });

    // Show multiplayer options
    document.getElementById('lobby-multi-btn')?.addEventListener('click', () => {
        document.getElementById('lobby-multiplayer-section')?.classList.remove('hidden');
        document.getElementById('lobby-multi-btn')?.classList.add('hidden');
        document.getElementById('lobby-solo-btn')?.classList.add('hidden');
    });

    // Create room
    document.getElementById('lobby-create-btn')?.addEventListener('click', async () => {
        if (!window.BasketMultiplayer) return;
        await window.BasketMultiplayer.createSession();
        document.getElementById('lobby-mp-options')?.classList.add('hidden');
        document.getElementById('lobby-waiting')?.classList.remove('hidden');
        document.getElementById('lobby-session-code').innerText = window.BasketMultiplayer.sessionId;

        // Listen for partner connection
        listenForPartnerInLobby();
    });

    // Join room
    document.getElementById('lobby-join-btn')?.addEventListener('click', async () => {
        const code = document.getElementById('lobby-join-code')?.value.trim().toUpperCase();
        if (!code || code.length < 4 || !window.BasketMultiplayer) return;
        await window.BasketMultiplayer.joinSession(code);

        if (window.BasketMultiplayer.isConnected) {
            showLobbyConnected();
        }
    });

    // Copy code
    document.getElementById('lobby-copy-code')?.addEventListener('click', () => {
        const code = document.getElementById('lobby-session-code')?.innerText;
        if (code) {
            navigator.clipboard.writeText(code);
            document.getElementById('lobby-copy-code').innerText = '✓';
            setTimeout(() => {
                document.getElementById('lobby-copy-code').innerText = '📋';
            }, 1500);
        }
    });

    // Start game button
    document.getElementById('lobby-start-btn')?.addEventListener('click', () => {
        // Notify partner that game is starting
        if (window.BasketMultiplayer && window.BasketMultiplayer.sessionRef) {
            window.BasketMultiplayer.sessionRef.update({ gameStarted: true });
        }
        hideLobbyAndStart();
    });
}

function listenForPartnerInLobby() {
    if (!window.BasketMultiplayer || !window.BasketMultiplayer.sessionRef) return;

    // Check periodically for partner
    const checkPartner = setInterval(() => {
        if (window.BasketMultiplayer.hasPartner()) {
            clearInterval(checkPartner);
            showLobbyConnected();
        }
    }, 500);

    // Also listen for game start signal from partner
    window.BasketMultiplayer.sessionRef.on('value', (snapshot) => {
        const session = snapshot.val();
        if (session && session.gameStarted) {
            hideLobbyAndStart();
        }
    });
}

function showLobbyConnected() {
    document.getElementById('lobby-mp-options')?.classList.add('hidden');
    document.getElementById('lobby-waiting')?.classList.add('hidden');
    document.getElementById('lobby-connected')?.classList.remove('hidden');

    // Update character display
    if (window.BasketMultiplayer) {
        const myChar = document.getElementById('lobby-my-char');
        const partnerChar = document.getElementById('lobby-partner-char');
        if (window.BasketMultiplayer.myCharacter === 'capybara') {
            if (myChar) myChar.innerHTML = '🦫 Tú (Capibara)';
            if (partnerChar) partnerChar.innerHTML = '🐢 Pareja (Tortuga)';
        } else {
            if (myChar) myChar.innerHTML = '🐢 Tú (Tortuga)';
            if (partnerChar) partnerChar.innerHTML = '🦫 Pareja (Capibara)';
        }
    }
}

function hideLobbyAndStart() {
    const lobby = document.getElementById('basket-lobby');
    if (lobby) lobby.remove();

    // Show game elements
    if (basketPlayer) basketPlayer.style.display = '';
    document.querySelector('.game-ui')?.classList.remove('hidden');

    // Start the actual game
    startBasketGame();
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

    // Show partner indicator if connected
    if (window.BasketMultiplayer && window.BasketMultiplayer.hasPartner()) {
        showBasketPartnerIndicator();
    }

    // Start Loops
    basketSpawnIntervalId = setInterval(spawnBasketItem, 1000);
    basketGameLoop();
}

function stopBasketGame() {
    basketGameActive = false;
    clearInterval(basketSpawnIntervalId);
    cancelAnimationFrame(basketGameLoopId);
    hideBasketPartnerIndicator();
}

// Multiplayer: Show partner indicator during game
function showBasketPartnerIndicator() {
    if (document.getElementById('basket-partner-indicator')) return;
    if (!window.BasketMultiplayer || !window.BasketMultiplayer.hasPartner()) return;

    const indicator = document.createElement('div');
    indicator.id = 'basket-partner-indicator';
    indicator.className = 'basket-partner-indicator';
    indicator.innerHTML = `
        <span>👫 Pareja conectada</span>
        <span class="partner-live-score" id="basket-partner-live">0 pts</span>
    `;
    gameOverlay.appendChild(indicator);

    // Update score display periodically
    const updateInterval = setInterval(() => {
        if (!basketGameActive) {
            clearInterval(updateInterval);
            return;
        }
        const el = document.getElementById('basket-partner-live');
        if (el && window.BasketMultiplayer) {
            el.innerText = window.BasketMultiplayer.partnerScore + ' pts';
        }
    }, 500);
}

function hideBasketPartnerIndicator() {
    const indicator = document.getElementById('basket-partner-indicator');
    if (indicator) indicator.remove();
}

function updateBasketScoreboard() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = basketScore;

    // Sync multiplayer score
    if (window.BasketMultiplayer && window.BasketMultiplayer.hasPartner()) {
        window.BasketMultiplayer.updateMyScore(basketScore);
    }

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
