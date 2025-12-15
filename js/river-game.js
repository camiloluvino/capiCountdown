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


