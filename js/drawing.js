// ==========================================
// DRAWING MODULE - Capi Countdown
// ==========================================
// Canvas de dibujo con paletas de materiales
// ==========================================

const DrawingApp = {
    // Canvas elements
    canvas: null,
    ctx: null,

    // State
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    smoothedVelocity: 0,
    pressure: 1, // Simulated pressure (0.2 to 1.0)

    // Current tool settings
    currentTool: 'pencil', // 'pencil' or 'eraser'
    currentMaterial: 'graphite', // 'graphite' or 'watercolor'
    currentColor: '#2d2d2d',
    lineWidth: 4,
    opacity: 1,

    // History for undo
    history: [],
    historyIndex: -1,
    maxHistory: 30,

    // Paletas de materiales
    palettes: {
        graphite: {
            name: 'Grafito',
            colors: [
                { color: '#1a1a1a', name: 'Negro' },
                { color: '#2d2d2d', name: 'Carbón' },
                { color: '#4a4a4a', name: 'Oscuro' },
                { color: '#666666', name: 'Medio' },
                { color: '#888888', name: 'Gris' },
                { color: '#aaaaaa', name: 'Claro' },
                { color: '#cccccc', name: 'Plata' },
                { color: '#e0e0e0', name: 'Suave' }
            ],
            texture: true,
            opacity: 0.9
        },
        watercolor: {
            name: 'Acuarela',
            colors: [
                { color: '#C94C4C', name: 'Rojo' },
                { color: '#E8A87C', name: 'Naranja' },
                { color: '#F7D794', name: 'Amarillo' },
                { color: '#7BAE7F', name: 'Verde' },
                { color: '#5B8FA8', name: 'Azul' },
                { color: '#6B5B95', name: 'Púrpura' },
                { color: '#E6A8D7', name: 'Rosa' },
                { color: '#5D4E37', name: 'Marrón' }
            ],
            texture: false,
            opacity: 0.6
        }
    },

    // Grosores disponibles
    sizes: [
        { value: 2, name: 'Muy fino', class: 's1' },
        { value: 5, name: 'Fino', class: 's2' },
        { value: 12, name: 'Medio', class: 's3' },
        { value: 24, name: 'Grueso', class: 's4' }
    ],

    // LocalStorage key
    storageKey: 'capi_drawings',

    // Initialize
    init() {
        // Get elements
        this.canvas = document.getElementById('drawCanvas');
        if (!this.canvas) {
            console.warn('⚠️ Canvas de dibujo no encontrado');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('drawing-overlay');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Setup event listeners
        this.setupCanvasEvents();
        this.setupToolbarEvents();
        this.setupOverlayEvents();
        this.setupPaletteDropdowns();
        this.setupSizeDropdown();

        // Load saved drawings
        this.loadGallery();

        // Initial state
        this.saveState();
        this.updateToolUI();

        console.log('🎨 Drawing App initialized with materials');
    },

    // Resize canvas to maximize space
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const availableHeight = window.innerHeight - 200; // Leave room for toolbar and gallery
        const availableWidth = container.clientWidth - 20;

        this.canvas.width = Math.min(800, availableWidth);
        this.canvas.height = Math.min(600, availableHeight);

        // Reset context properties after resize
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Restore last state if exists
        if (this.history.length > 0 && this.historyIndex >= 0) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.history[this.historyIndex];
        } else {
            // Fill with white background
            this.ctx.fillStyle = '#FDFBF5';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    // Canvas drawing events
    setupCanvasEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    },

    // Get position relative to canvas
    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    },

    // Start drawing
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.lastTime = performance.now();
        this.velocity = 0;
        this.smoothedVelocity = 0;
        this.pressure = 1;
        this.points = [{ x: pos.x, y: pos.y, pressure: 1 }];

        // Initial dot based on material
        if (this.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.lineWidth, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FDFBF5';
            this.ctx.fill();
        } else if (this.currentMaterial === 'graphite') {
            this.drawGraphiteDot(pos.x, pos.y);
        } else {
            this.drawWatercolorDot(pos.x, pos.y);
        }
    },

    // Draw graphite dot (textured, granular)
    drawGraphiteDot(x, y) {
        const size = this.lineWidth;
        const density = Math.max(8, size * 3); // More particles for larger sizes

        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * size * 0.6;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const particleSize = Math.random() * 1.5 + 0.5;

            this.ctx.beginPath();
            this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            this.ctx.fillStyle = this.currentColor;
            this.ctx.globalAlpha = 0.3 + Math.random() * 0.5;
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    },

    // Draw watercolor dot (soft, diffuse)
    drawWatercolorDot(x, y) {
        const size = this.lineWidth * 1.5;

        // Multiple soft layers
        for (let layer = 3; layer >= 0; layer--) {
            const layerSize = size * (1 + layer * 0.3);
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, layerSize);

            gradient.addColorStop(0, this.hexToRgba(this.currentColor, 0.15 - layer * 0.03));
            gradient.addColorStop(0.5, this.hexToRgba(this.currentColor, 0.08 - layer * 0.02));
            gradient.addColorStop(1, this.hexToRgba(this.currentColor, 0));

            this.ctx.beginPath();
            this.ctx.arc(x, y, layerSize, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
    },

    // Helper: Convert hex to rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Draw with material effect
    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getPos(e);
        const now = performance.now();
        const dt = now - this.lastTime;

        // Calculate velocity (pixels per millisecond)
        const dx = pos.x - this.lastX;
        const dy = pos.y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (dt > 0) {
            this.velocity = distance / dt;
        }

        // Smooth the velocity for natural feel
        this.smoothedVelocity = this.smoothedVelocity * 0.7 + this.velocity * 0.3;

        // Calculate simulated pressure from velocity
        // Slow = high pressure (thick), Fast = low pressure (thin)
        // Velocity typically ranges from 0 to ~2 pixels/ms
        const normalizedVelocity = Math.min(this.smoothedVelocity / 1.5, 1);
        this.pressure = 1 - normalizedVelocity * 0.7; // Range: 0.3 to 1.0
        this.pressure = Math.max(0.25, Math.min(1, this.pressure));

        // Store point with pressure
        this.points.push({ x: pos.x, y: pos.y, pressure: this.pressure });
        if (this.points.length > 5) this.points.shift();

        if (this.currentTool === 'eraser') {
            this.drawEraser(pos);
        } else if (this.currentMaterial === 'graphite') {
            this.drawGraphiteStroke(pos);
        } else {
            this.drawWatercolorStroke(pos);
        }

        this.lastX = pos.x;
        this.lastY = pos.y;
        this.lastTime = now;
    },

    // Eraser stroke
    drawEraser(pos) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = '#FDFBF5';
        this.ctx.lineWidth = this.lineWidth * 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    },

    // GRAPHITE stroke: granular texture with pressure sensitivity
    drawGraphiteStroke(pos) {
        const dx = pos.x - this.lastX;
        const dy = pos.y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return;

        // Pressure-based size and opacity
        const pressureSize = this.lineWidth * (0.5 + this.pressure * 0.8);
        const pressureOpacity = 0.3 + this.pressure * 0.5;

        // Draw base stroke with pressure-based width
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = pressureSize * 0.4;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = pressureOpacity * 0.3;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();

        // More particles with higher pressure (slower = more density)
        const steps = Math.max(1, Math.floor(distance / (3 - this.pressure * 1.5)));
        const particlesPerStep = Math.max(2, Math.floor(pressureSize * 0.6 * (0.5 + this.pressure)));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = this.lastX + dx * t;
            const y = this.lastY + dy * t;

            // Irregular edge offset (more pronounced with higher pressure)
            const edgeIrregularity = (Math.random() - 0.5) * pressureSize * 0.15;

            for (let p = 0; p < particlesPerStep; p++) {
                // Random offset within stroke width - more spread with less pressure
                const angle = Math.random() * Math.PI * 2;
                const spreadFactor = 0.3 + (1 - this.pressure) * 0.3;
                const spread = pressureSize * spreadFactor;
                const offsetX = Math.cos(angle) * Math.random() * spread + edgeIrregularity;
                const offsetY = Math.sin(angle) * Math.random() * spread + edgeIrregularity;

                const particleX = x + offsetX;
                const particleY = y + offsetY;

                // Particle size varies with pressure
                const particleSize = (0.4 + Math.random() * 1.0) * (0.7 + this.pressure * 0.5);

                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                this.ctx.fillStyle = this.currentColor;
                // Variable opacity - higher when slow (more graphite deposited)
                this.ctx.globalAlpha = (0.15 + Math.random() * 0.4) * pressureOpacity;
                this.ctx.fill();
            }
        }

        this.ctx.globalAlpha = 1;
    },

    // WATERCOLOR stroke: soft, diffuse with pressure sensitivity
    drawWatercolorStroke(pos) {
        const dx = pos.x - this.lastX;
        const dy = pos.y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return;

        // Pressure affects size and transparency
        // Slow = more water = bigger spread, less concentrated
        // Fast = less water = smaller, more concentrated
        const pressureFactor = 0.6 + this.pressure * 0.6;
        const baseSize = this.lineWidth * 1.5 * pressureFactor;
        const baseAlpha = 0.08 + (1 - this.pressure) * 0.06; // More transparent when slow

        // Draw overlapping soft circles along the path
        const steps = Math.max(1, Math.floor(distance / (4 - this.pressure * 2)));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = this.lastX + dx * t;
            const y = this.lastY + dy * t;

            // Organic wobble - more when slow (more water spreading)
            const wobbleFactor = 0.15 + this.pressure * 0.15;
            const wobbleX = (Math.random() - 0.5) * baseSize * wobbleFactor;
            const wobbleY = (Math.random() - 0.5) * baseSize * wobbleFactor;

            // Irregular edge variation
            const edgeVar = 1 + (Math.random() - 0.5) * 0.2;
            const thisSize = baseSize * edgeVar;

            // Create soft radial gradient
            const gradient = this.ctx.createRadialGradient(
                x + wobbleX, y + wobbleY, 0,
                x + wobbleX, y + wobbleY, thisSize
            );

            // Watercolor gradient - more transparent at edges
            gradient.addColorStop(0, this.hexToRgba(this.currentColor, baseAlpha * 1.5));
            gradient.addColorStop(0.3, this.hexToRgba(this.currentColor, baseAlpha));
            gradient.addColorStop(0.6, this.hexToRgba(this.currentColor, baseAlpha * 0.5));
            gradient.addColorStop(1, this.hexToRgba(this.currentColor, 0));

            this.ctx.beginPath();
            this.ctx.arc(x + wobbleX, y + wobbleY, thisSize, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        // Edge pooling effect - more frequent when moving slowly (more water)
        const poolChance = 0.5 + this.pressure * 0.3;
        if (distance > 3 && Math.random() > poolChance) {
            const numPools = Math.floor(1 + Math.random() * 2);
            for (let p = 0; p < numPools; p++) {
                const poolX = pos.x + (Math.random() - 0.5) * baseSize * 1.2;
                const poolY = pos.y + (Math.random() - 0.5) * baseSize * 1.2;
                const poolSize = baseSize * (0.2 + Math.random() * 0.3);

                const poolGradient = this.ctx.createRadialGradient(
                    poolX, poolY, 0,
                    poolX, poolY, poolSize
                );
                poolGradient.addColorStop(0, this.hexToRgba(this.currentColor, baseAlpha * 2));
                poolGradient.addColorStop(0.5, this.hexToRgba(this.currentColor, baseAlpha));
                poolGradient.addColorStop(1, this.hexToRgba(this.currentColor, 0));

                this.ctx.beginPath();
                this.ctx.arc(poolX, poolY, poolSize, 0, Math.PI * 2);
                this.ctx.fillStyle = poolGradient;
                this.ctx.fill();
            }
        }
    },


    // Stop drawing
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    },

    // Save state for undo
    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add current state
        this.history.push(this.canvas.toDataURL());
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    },

    // Undo
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
        }
    },

    // Restore from history
    restoreState() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = this.history[this.historyIndex];
    },

    // Clear canvas
    clearCanvas() {
        this.ctx.fillStyle = '#FDFBF5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    },

    // Setup palette dropdowns
    setupPaletteDropdowns() {
        // Graphite palette button
        const graphiteBtn = document.getElementById('palette-graphite');
        const graphiteDropdown = document.getElementById('dropdown-graphite');

        if (graphiteBtn && graphiteDropdown) {
            graphiteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('graphite');
            });
        }

        // Watercolor palette button
        const watercolorBtn = document.getElementById('palette-watercolor');
        const watercolorDropdown = document.getElementById('dropdown-watercolor');

        if (watercolorBtn && watercolorDropdown) {
            watercolorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('watercolor');
            });
        }

        // Color button clicks
        document.querySelectorAll('.palette-dropdown .color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = btn.dataset.color;
                const material = btn.dataset.material;
                this.selectColor(color, material);
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
    },

    toggleDropdown(palette) {
        const dropdown = document.getElementById(`dropdown-${palette}`);
        const isActive = dropdown?.classList.contains('active');

        this.closeAllDropdowns();

        if (!isActive && dropdown) {
            dropdown.classList.add('active');
        }
    },

    closeAllDropdowns() {
        document.querySelectorAll('.palette-dropdown, .size-dropdown').forEach(d => {
            d.classList.remove('active');
        });
    },

    selectColor(color, material) {
        this.currentColor = color;
        this.currentMaterial = material;
        this.currentTool = 'pencil'; // Switch to pencil when selecting color
        this.opacity = this.palettes[material].opacity;
        this.updateToolUI();
        this.closeAllDropdowns();
    },

    // Setup size dropdown
    setupSizeDropdown() {
        const sizeTrigger = document.getElementById('size-trigger');
        const sizeDropdown = document.getElementById('size-dropdown');

        if (sizeTrigger) {
            sizeTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = sizeDropdown?.classList.contains('active');
                this.closeAllDropdowns();
                if (!isActive && sizeDropdown) {
                    sizeDropdown.classList.add('active');
                }
            });
        }

        // Size options
        document.querySelectorAll('.size-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                this.lineWidth = parseInt(opt.dataset.size);
                this.updateToolUI();
                this.closeAllDropdowns();
            });
        });
    },

    // Setup toolbar events
    setupToolbarEvents() {
        // Tool buttons
        document.getElementById('tool-pencil')?.addEventListener('click', () => {
            this.currentTool = 'pencil';
            this.updateToolUI();
        });

        document.getElementById('tool-eraser')?.addEventListener('click', () => {
            this.currentTool = 'eraser';
            this.updateToolUI();
        });

        document.getElementById('tool-undo')?.addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('tool-clear')?.addEventListener('click', () => {
            if (confirm('¿Borrar todo el dibujo?')) {
                this.clearCanvas();
            }
        });

        // Save button (ahora es guardar, no enviar)
        document.getElementById('save-drawing')?.addEventListener('click', () => {
            this.saveDrawing();
        });
    },

    // Update toolbar UI
    updateToolUI() {
        // Tools
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tool-${this.currentTool}`)?.classList.add('active');

        // Palettes
        document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`palette-${this.currentMaterial}`)?.classList.add('active');

        // Colors within palettes
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.currentColor);
        });

        // Size preview
        const sizePreview = document.querySelector('.size-preview-dot');
        if (sizePreview) {
            sizePreview.style.width = Math.min(16, this.lineWidth) + 'px';
            sizePreview.style.height = Math.min(16, this.lineWidth) + 'px';
        }

        // Size options
        document.querySelectorAll('.size-option').forEach(opt => {
            opt.classList.toggle('active', parseInt(opt.dataset.size) === this.lineWidth);
        });
    },

    // Setup overlay events
    setupOverlayEvents() {
        // Open button
        document.getElementById('drawButton')?.addEventListener('click', () => {
            this.open();
        });

        // Close button
        document.getElementById('closeDraw')?.addEventListener('click', () => {
            this.close();
        });

        // Modal close
        document.getElementById('closeDrawingModal')?.addEventListener('click', () => {
            document.getElementById('drawing-modal')?.classList.remove('active');
        });

        // Modal delete button
        document.getElementById('modalDeleteBtn')?.addEventListener('click', () => {
            this.deleteCurrentModalDrawing();
        });

        // Click outside modal to close
        document.getElementById('drawing-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'drawing-modal') {
                e.target.classList.remove('active');
            }
        });
    },

    // Open drawing overlay
    open() {
        this.overlay?.classList.add('active');
        document.getElementById('drawButton')?.classList.remove('has-new');
        this.resizeCanvas();
        this.updateToolUI();
    },

    // Close drawing overlay
    close() {
        this.overlay?.classList.remove('active');
    },

    // Save drawing to localStorage
    saveDrawing() {
        const saveBtn = document.getElementById('save-drawing');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '💾 Guardando...';
        }

        try {
            // Get existing drawings
            const drawings = this.getStoredDrawings();

            // Create new drawing entry
            const newDrawing = {
                id: 'drawing_' + Date.now(),
                imageData: this.canvas.toDataURL('image/png'),
                timestamp: Date.now()
            };

            // Add to beginning (newest first)
            drawings.unshift(newDrawing);

            // Limit to 20 drawings
            if (drawings.length > 20) {
                drawings.pop();
            }

            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(drawings));

            // Clear canvas after saving
            this.clearCanvas();

            // Refresh gallery
            this.loadGallery();

            // Feedback
            if (saveBtn) {
                saveBtn.innerHTML = '✅ ¡Guardado!';
                setTimeout(() => {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '💾 Guardar';
                }, 1500);
            }

            console.log('🎨 Dibujo guardado');

        } catch (error) {
            console.error('Error guardando dibujo:', error);
            alert('Error al guardar el dibujo');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '💾 Guardar';
            }
        }
    },

    // Get drawings from localStorage
    getStoredDrawings() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading drawings:', e);
            return [];
        }
    },

    // Load gallery from localStorage
    loadGallery() {
        const gallery = document.getElementById('drawingGallery');
        if (!gallery) return;

        const drawings = this.getStoredDrawings();
        gallery.innerHTML = '';

        if (drawings.length === 0) {
            gallery.innerHTML = '<div class="gallery-empty">No hay dibujos guardados... ¡Crea el primero! 🎨</div>';
            return;
        }

        drawings.forEach(drawing => {
            this.addToGallery(drawing);
        });
    },

    // Add drawing to gallery
    addToGallery(drawing) {
        const gallery = document.getElementById('drawingGallery');
        if (!gallery) return;

        // Remove empty state if exists
        const empty = gallery.querySelector('.gallery-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.id = drawing.id;

        const img = document.createElement('img');
        img.src = drawing.imageData;
        img.alt = 'Dibujo';

        const time = document.createElement('div');
        time.className = 'gallery-time';
        time.textContent = this.formatTime(drawing.timestamp);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Eliminar';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteDrawing(drawing.id);
        });

        item.appendChild(img);
        item.appendChild(time);
        item.appendChild(deleteBtn);

        // Click to view larger
        item.addEventListener('click', () => {
            this.viewDrawing(drawing);
        });

        gallery.appendChild(item);
    },

    // View drawing in modal
    viewDrawing(drawing) {
        const modal = document.getElementById('drawing-modal');
        const modalImg = document.getElementById('modalDrawingImg');

        if (modal && modalImg) {
            modalImg.src = drawing.imageData;
            modal.dataset.currentId = drawing.id;
            modal.classList.add('active');
        }
    },

    // Delete drawing
    deleteDrawing(id) {
        if (!confirm('¿Eliminar este dibujo?')) return;

        const drawings = this.getStoredDrawings();
        const filtered = drawings.filter(d => d.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));

        // Remove from DOM
        const item = document.querySelector(`.gallery-item[data-id="${id}"]`);
        if (item) {
            item.style.transform = 'scale(0)';
            item.style.opacity = '0';
            setTimeout(() => {
                item.remove();
                // Show empty state if no drawings left
                if (filtered.length === 0) {
                    const gallery = document.getElementById('drawingGallery');
                    if (gallery) {
                        gallery.innerHTML = '<div class="gallery-empty">No hay dibujos guardados... ¡Crea el primero! 🎨</div>';
                    }
                }
            }, 200);
        }

        console.log('🗑️ Dibujo eliminado:', id);
    },

    // Delete from modal
    deleteCurrentModalDrawing() {
        const modal = document.getElementById('drawing-modal');
        const id = modal?.dataset.currentId;
        if (id) {
            modal.classList.remove('active');
            this.deleteDrawing(id);
        }
    },

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        DrawingApp.init();
    }, 500);
});

// Expose globally
window.DrawingApp = DrawingApp;
