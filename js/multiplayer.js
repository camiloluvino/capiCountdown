// ==========================================
// BASKET GAME MULTIPLAYER - Capi Countdown
// ==========================================
// Sistema de sesiones compartidas específico para La Cesta de Regalos

const BasketMultiplayer = {
    // Estado del sistema
    isConnected: false,
    sessionId: null,
    playerId: null,
    partnerId: null,
    sessionRef: null,
    partnerScore: 0,

    // Identidad de personaje
    isHost: false,  // true = Capibara (creador), false = Tortuga (invitado)
    myCharacter: null,  // 'capybara' o 'turtle'
    partnerCharacter: null,

    // Callbacks
    onPartnerScoreUpdate: null,

    // Handler reference for cleanup
    _beforeUnloadHandler: null,

    // Inicializar el sistema
    init() {
        if (!window.database) {
            console.warn('⚠️ Firebase no disponible, multijugador deshabilitado');
            return;
        }

        // Obtener o crear ID de jugador
        this.playerId = localStorage.getItem('capi_user_id');
        if (!this.playerId) {
            this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('capi_user_id', this.playerId);
        }

        // Agregar UI al game overlay
        this.createUI();

        console.log('🎮 Basket Multiplayer initialized. Player ID:', this.playerId);
    },

    // Crear interfaz en el game overlay
    createUI() {
        const gameOverlay = document.getElementById('game-overlay');
        if (!gameOverlay) return;

        // Botón de multijugador dentro del juego
        const mpContainer = document.createElement('div');
        mpContainer.id = 'basket-mp-container';
        mpContainer.className = 'basket-mp-container';
        mpContainer.innerHTML = `
            <button id="basket-mp-btn" class="basket-mp-btn" title="Jugar con pareja">👫</button>
            <div id="basket-mp-panel" class="basket-mp-panel hidden">
                <div id="basket-mp-disconnected">
                    <p>¡Juega con tu pareja!</p>
                    <button id="basket-mp-create" class="basket-mp-action-btn">🦫 Crear Sala (Capibara)</button>
                    <div class="basket-mp-divider">o</div>
                    <input type="text" id="basket-mp-code-input" class="basket-mp-input" placeholder="Código" maxlength="6">
                    <button id="basket-mp-join" class="basket-mp-action-btn">🐢 Unirse (Tortuga)</button>
                </div>
                <div id="basket-mp-waiting" class="hidden">
                    <div class="character-badge capybara">
                        <span>🦫</span>
                        <small>Eres el Capibara</small>
                    </div>
                    <p>Esperando a tu Tortuga...</p>
                    <div class="basket-mp-code-box">
                        <span id="basket-mp-code">------</span>
                        <button id="basket-mp-copy" title="Copiar">📋</button>
                    </div>
                    <button id="basket-mp-cancel" class="basket-mp-cancel-btn">Cancelar</button>
                </div>
                <div id="basket-mp-connected" class="hidden">
                    <div class="basket-mp-partner-status">
                        <span class="status-dot"></span>
                        <span>¡Conectados!</span>
                    </div>
                    <div class="basket-mp-scores-row">
                        <div class="mp-score-box" id="my-score-box">
                            <div class="character-icon" id="my-character-icon">🦫</div>
                            <small>Tú</small>
                            <span id="basket-mp-my-score">0</span>
                        </div>
                        <div class="mp-score-box partner" id="partner-score-box">
                            <div class="character-icon" id="partner-character-icon">🐢</div>
                            <small>Pareja</small>
                            <span id="basket-mp-partner-score">0</span>
                        </div>
                    </div>
                    <button id="basket-mp-disconnect" class="basket-mp-cancel-btn">Salir</button>
                </div>
            </div>
        `;
        gameOverlay.appendChild(mpContainer);

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Toggle panel
        document.getElementById('basket-mp-btn')?.addEventListener('click', () => {
            document.getElementById('basket-mp-panel')?.classList.toggle('hidden');
        });

        // Create session
        document.getElementById('basket-mp-create')?.addEventListener('click', () => {
            this.createSession();
        });

        // Join session
        document.getElementById('basket-mp-join')?.addEventListener('click', () => {
            const code = document.getElementById('basket-mp-code-input')?.value.trim().toUpperCase();
            if (code && code.length >= 4) {
                this.joinSession(code);
            }
        });

        // Copy code
        document.getElementById('basket-mp-copy')?.addEventListener('click', () => {
            const code = document.getElementById('basket-mp-code')?.innerText;
            if (code) {
                navigator.clipboard.writeText(code);
                document.getElementById('basket-mp-copy').innerText = '✓';
                setTimeout(() => {
                    document.getElementById('basket-mp-copy').innerText = '📋';
                }, 1500);
            }
        });

        // Cancel/Disconnect
        document.getElementById('basket-mp-cancel')?.addEventListener('click', () => {
            this.leaveSession();
        });
        document.getElementById('basket-mp-disconnect')?.addEventListener('click', () => {
            this.leaveSession();
        });
    },

    // Generar código
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Crear sesión (SOY CAPIBARA)
    async createSession() {
        const code = this.generateCode();
        this.sessionId = code;
        this.isHost = true;
        this.myCharacter = 'capybara';
        this.partnerCharacter = 'turtle';

        try {
            this.sessionRef = window.database.ref('basket_sessions/' + code);

            await this.sessionRef.set({
                createdAt: Date.now(),
                host: this.playerId,
                players: {
                    [this.playerId]: { score: 0, joinedAt: Date.now(), character: 'capybara' }
                },
                status: 'waiting'
            });

            this.listenToSession();
            this.showWaitingUI(code);

            // Bind beforeunload only once
            this._bindBeforeUnload();
            console.log('🦫 Capibara session created:', code);

        } catch (error) {
            console.error('Error creating session:', error);
            alert('Error al crear sala');
        }
    },

    // Unirse a sesión (SOY TORTUGA)
    async joinSession(code) {
        this.sessionId = code.toUpperCase();
        this.sessionRef = window.database.ref('basket_sessions/' + this.sessionId);
        this.isHost = false;
        this.myCharacter = 'turtle';
        this.partnerCharacter = 'capybara';

        try {
            const snapshot = await this.sessionRef.once('value');
            const session = snapshot.val();

            if (!session) {
                alert('Sala no encontrada');
                return;
            }

            if (session.status === 'full') {
                alert('La sala está llena');
                return;
            }

            await this.sessionRef.child('players/' + this.playerId).set({
                score: 0, joinedAt: Date.now(), character: 'turtle'
            });
            await this.sessionRef.update({ status: 'full' });

            this.listenToSession();
            this.showConnectedUI();

            // Bind beforeunload only once
            this._bindBeforeUnload();
            console.log('🐢 Turtle joined session:', code);

        } catch (error) {
            console.error('Error joining session:', error);
            alert('Error al unirse');
        }
    },

    // Escuchar cambios
    listenToSession() {
        if (!this.sessionRef) return;

        this.sessionRef.on('value', (snapshot) => {
            const session = snapshot.val();
            if (!session) {
                this.handleSessionDeleted();
                return;
            }

            const players = session.players || {};
            const playerIds = Object.keys(players);

            this.partnerId = playerIds.find(id => id !== this.playerId);

            if (this.partnerId && !this.isConnected) {
                this.isConnected = true;
                this.showConnectedUI();
            }

            if (this.partnerId && players[this.partnerId]) {
                this.partnerScore = players[this.partnerId].score || 0;
                this.updatePartnerScoreDisplay();
            }
        });

        this.sessionRef.child('players').on('child_removed', (snapshot) => {
            if (snapshot.key !== this.playerId) {
                this.isConnected = false;
                this.partnerId = null;
                this.showWaitingUI(this.sessionId);
            }
        });
    },

    // Actualizar mi puntuación
    updateMyScore(score) {
        if (!this.sessionRef || !this.playerId) return;
        this.sessionRef.child('players/' + this.playerId).update({ score: score });

        const el = document.getElementById('basket-mp-my-score');
        if (el) el.innerText = score;
    },

    updatePartnerScoreDisplay() {
        const el = document.getElementById('basket-mp-partner-score');
        if (el) el.innerText = this.partnerScore;
    },

    // UI helpers
    showWaitingUI(code) {
        document.getElementById('basket-mp-disconnected')?.classList.add('hidden');
        document.getElementById('basket-mp-connected')?.classList.add('hidden');
        document.getElementById('basket-mp-waiting')?.classList.remove('hidden');
        document.getElementById('basket-mp-code').innerText = code;
    },

    showConnectedUI() {
        document.getElementById('basket-mp-disconnected')?.classList.add('hidden');
        document.getElementById('basket-mp-waiting')?.classList.add('hidden');
        document.getElementById('basket-mp-connected')?.classList.remove('hidden');
        document.getElementById('basket-mp-btn')?.classList.add('connected');

        // Mostrar iconos de personaje correctos
        const myIcon = document.getElementById('my-character-icon');
        const partnerIcon = document.getElementById('partner-character-icon');
        const myBox = document.getElementById('my-score-box');
        const partnerBox = document.getElementById('partner-score-box');

        if (this.myCharacter === 'capybara') {
            if (myIcon) myIcon.innerText = '🦫';
            if (partnerIcon) partnerIcon.innerText = '🐢';
            myBox?.classList.add('capybara');
            partnerBox?.classList.add('turtle');
        } else {
            if (myIcon) myIcon.innerText = '🐢';
            if (partnerIcon) partnerIcon.innerText = '🦫';
            myBox?.classList.add('turtle');
            partnerBox?.classList.add('capybara');
        }
    },

    showDisconnectedUI() {
        document.getElementById('basket-mp-waiting')?.classList.add('hidden');
        document.getElementById('basket-mp-connected')?.classList.add('hidden');
        document.getElementById('basket-mp-disconnected')?.classList.remove('hidden');
        document.getElementById('basket-mp-btn')?.classList.remove('connected');
    },

    handleSessionDeleted() {
        this.isConnected = false;
        this.sessionId = null;
        this.partnerId = null;
        this.sessionRef = null;
        this.showDisconnectedUI();
    },

    async leaveSession() {
        if (this.sessionRef && this.playerId) {
            try {
                await this.sessionRef.child('players/' + this.playerId).remove();
                const snapshot = await this.sessionRef.child('players').once('value');
                if (!snapshot.exists()) {
                    await this.sessionRef.remove();
                } else {
                    await this.sessionRef.update({ status: 'waiting' });
                }
            } catch (error) {
                console.error('Error leaving session:', error);
            }
        }

        if (this.sessionRef) this.sessionRef.off();

        // Remove beforeunload listener
        this._unbindBeforeUnload();

        this.isConnected = false;
        this.sessionId = null;
        this.partnerId = null;
        this.sessionRef = null;
        this.showDisconnectedUI();
    },

    hasPartner() {
        return this.isConnected && this.partnerId !== null;
    },

    // Bind beforeunload only once (prevents memory leak from duplicate listeners)
    _bindBeforeUnload() {
        if (this._beforeUnloadHandler) return; // Already bound
        this._beforeUnloadHandler = () => this.leaveSession();
        window.addEventListener('beforeunload', this._beforeUnloadHandler);
    },

    // Remove beforeunload listener
    _unbindBeforeUnload() {
        if (this._beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this._beforeUnloadHandler);
            this._beforeUnloadHandler = null;
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        BasketMultiplayer.init();
    }, 800);
});

// Exponer globalmente
window.BasketMultiplayer = BasketMultiplayer;
