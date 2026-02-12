/**
 * Tree Countdown - "El Árbol del Reencuentro" 🌳
 * 
 * Organic fractal tree with leaves that fill based on progress.
 * Progress = (21 - daysLeft + 1) / 21
 * 
 * v2 — Polished aesthetics:
 *  - Delicate leaf sizes (5-8px)
 *  - Left/right balanced leaf distribution
 *  - Near-invisible buds
 *  - Harmonious green palette
 *  - Compact canopy (tighter branch angles)
 *  - Robust trunk
 *  - Gentle breeze animation
 */

(function () {
    const canvasId = 'tree-canvas';
    let canvas, ctx;
    const TOTAL_DAYS = 21;
    let treeConfig = window.AppConfig?.tree || {
        trunkColor: '#5D4E37',
        leafColors: ['#8FBC8F', '#A2D5A2', '#7BAE7F', '#B5CC8E', '#C4D7A4']
    };

    // State
    let progress = 0;
    let storedTree = { segments: [], leafAnchors: [] };
    let animFrameId = null;
    let windTime = 0;

    // Seeded PRNG for deterministic tree shape
    let seed = 42;
    function seededRandom() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    // =========================================
    // FRACTAL TREE GEOMETRY
    // =========================================

    function generateGeometry() {
        storedTree = { segments: [], leafAnchors: [] };
        if (!canvas) return;

        seed = 42;

        const w = canvas.width;
        const h = canvas.height;
        const trunkLen = Math.min(h * 0.18, 75);

        function grow(x, y, len, angle, width, depth) {
            const endX = x + Math.cos(angle - Math.PI / 2) * len;
            const endY = y + Math.sin(angle - Math.PI / 2) * len;

            const layerAlpha = 0.55 + depth * 0.08;

            storedTree.segments.push({
                x1: x, y1: y, x2: endX, y2: endY,
                w: width, depth: depth, alpha: Math.min(1, layerAlpha)
            });

            if (len > 9) {
                // COMPACT canopy: tighter angles (0.35-0.50 instead of 0.45-0.65)
                const angleVar1 = 0.35 + seededRandom() * 0.15;
                const angleVar2 = 0.35 + seededRandom() * 0.15;
                const lenVar1 = 0.68 + seededRandom() * 0.10;
                const lenVar2 = 0.68 + seededRandom() * 0.10;
                const widthShrink = 0.65 + seededRandom() * 0.08;

                grow(endX, endY, len * lenVar1, angle + angleVar1, width * widthShrink, depth + 1);
                grow(endX, endY, len * lenVar2, angle - angleVar2, width * widthShrink, depth + 1);
            } else {
                // Terminal → leaf anchor
                // DELICATE leaves: 5-8px (not 6-12)
                const leafSize = 5 + seededRandom() * 3;
                const leafOpacity = 0.72 + seededRandom() * 0.23;
                const leafShape = seededRandom() > 0.5 ? 'round' : 'long';

                // Track which side of the tree (for balanced distribution)
                const side = endX < w / 2 ? 'left' : 'right';

                storedTree.leafAnchors.push({
                    x: endX, y: endY, angle: angle,
                    size: leafSize, opacity: leafOpacity, shape: leafShape,
                    depth: depth, side: side
                });
            }
        }

        // ROBUST trunk: width 12 (was 9)
        grow(w / 2, h - 30, trunkLen, 0, 12, 0);

        // BALANCED distribution: interleave left and right leaves
        const leftLeaves = storedTree.leafAnchors.filter(l => l.side === 'left');
        const rightLeaves = storedTree.leafAnchors.filter(l => l.side === 'right');

        // Shuffle each side independently
        leftLeaves.sort(() => seededRandom() - 0.5);
        rightLeaves.sort(() => seededRandom() - 0.5);

        // Interleave: left, right, left, right...
        const balanced = [];
        const maxLen = Math.max(leftLeaves.length, rightLeaves.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < leftLeaves.length) balanced.push(leftLeaves[i]);
            if (i < rightLeaves.length) balanced.push(rightLeaves[i]);
        }
        storedTree.leafAnchors = balanced;
    }

    // =========================================
    // DRAWING
    // =========================================

    function draw() {
        if (!ctx || !canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        drawGround(w, h);
        drawBranches();

        const total = storedTree.leafAnchors.length;
        const filledCount = Math.round(total * progress);

        drawBuds(filledCount, total);
        drawLeaves(filledCount, total);
    }

    function drawGround(w, h) {
        const groundY = h - 25;
        const gradient = ctx.createRadialGradient(w / 2, groundY + 15, 10, w / 2, groundY + 15, w * 0.38);
        gradient.addColorStop(0, 'rgba(120, 150, 90, 0.30)');
        gradient.addColorStop(0.7, 'rgba(120, 150, 90, 0.12)');
        gradient.addColorStop(1, 'rgba(120, 150, 90, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(w / 2, groundY + 12, w * 0.35, 16, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBranches() {
        ctx.lineCap = 'round';
        const sorted = [...storedTree.segments].sort((a, b) => a.depth - b.depth);

        sorted.forEach(seg => {
            const t = seg.depth / 6;
            const r = Math.round(93 - t * 15);
            const g = Math.round(78 - t * 10);
            const bv = Math.round(55 - t * 5);

            // --- Tapered branch shape (filled quad instead of line) ---
            // Calculate perpendicular direction
            const dx = seg.x2 - seg.x1;
            const dy = seg.y2 - seg.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return;
            const nx = -dy / len;  // perpendicular normal
            const ny = dx / len;

            const startHalf = seg.w * 0.55;  // wider at start
            const endHalf = seg.w * 0.35;    // narrower at end

            // Four corners of the tapered shape
            const x1l = seg.x1 + nx * startHalf;
            const y1l = seg.y1 + ny * startHalf;
            const x1r = seg.x1 - nx * startHalf;
            const y1r = seg.y1 - ny * startHalf;
            const x2l = seg.x2 + nx * endHalf;
            const y2l = seg.y2 + ny * endHalf;
            const x2r = seg.x2 - nx * endHalf;
            const y2r = seg.y2 - ny * endHalf;

            // Fill with gradient
            const grad = ctx.createLinearGradient(seg.x1, seg.y1, seg.x2, seg.y2);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${bv}, ${seg.alpha})`);
            grad.addColorStop(1, `rgba(${Math.round(r + 8)}, ${Math.round(g + 6)}, ${Math.round(bv + 4)}, ${seg.alpha})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x1l, y1l);
            ctx.lineTo(x2l, y2l);
            ctx.lineTo(x2r, y2r);
            ctx.lineTo(x1r, y1r);
            ctx.closePath();
            ctx.fill();

            // Bark texture: subtle darker streaks on thicker branches
            if (seg.w > 4) {
                const barkAlpha = 0.08 + (seg.w / 30);
                ctx.strokeStyle = `rgba(60, 45, 30, ${Math.min(barkAlpha, 0.2)})`;
                ctx.lineWidth = 0.5;

                // 2-3 bark lines along the branch
                const numLines = seg.w > 7 ? 3 : 2;
                for (let i = 0; i < numLines; i++) {
                    const offset = (i / (numLines - 1) - 0.5) * seg.w * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(seg.x1 + nx * offset, seg.y1 + ny * offset);
                    ctx.lineTo(seg.x2 + nx * offset * 0.6, seg.y2 + ny * offset * 0.6);
                    ctx.stroke();
                }
            }
        });
    }

    function drawBuds(filledCount, total) {
        // NEAR-INVISIBLE buds (opacity 0.08)
        for (let i = filledCount; i < total; i++) {
            const spot = storedTree.leafAnchors[i];
            ctx.fillStyle = 'rgba(140, 180, 100, 0.08)';
            ctx.beginPath();
            ctx.ellipse(spot.x, spot.y, 2.5, 3.5, spot.angle, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawLeaves(filledCount, total) {
        const colors = treeConfig.leafColors;

        for (let i = 0; i < filledCount && i < total; i++) {
            const spot = storedTree.leafAnchors[i];
            const color = colors[i % colors.length];

            // Per-leaf breeze sway
            const leafWind = Math.sin(windTime + i * 0.7) * 1.2;
            const dx = spot.x + leafWind;
            const dy = spot.y + Math.sin(windTime * 0.8 + i * 0.5) * 0.6;

            ctx.globalAlpha = spot.opacity;
            ctx.fillStyle = color;

            ctx.beginPath();
            if (spot.shape === 'round') {
                ctx.ellipse(dx, dy, spot.size * 0.7, spot.size * 0.6, spot.angle + 0.3, 0, Math.PI * 2);
            } else {
                ctx.ellipse(dx, dy, spot.size, spot.size * 0.38, spot.angle + 0.2, 0, Math.PI * 2);
            }
            ctx.fill();

            // Subtle vein
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(dx - 1.5, dy);
            ctx.lineTo(dx + 1.5, dy);
            ctx.stroke();

            ctx.globalAlpha = 1;
        }
    }

    // =========================================
    // ANIMATION
    // =========================================

    function animate() {
        windTime += 0.012;
        draw();
        animFrameId = requestAnimationFrame(animate);
    }

    // =========================================
    // CANVAS
    // =========================================

    function resizeCanvas() {
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = Math.min(parent.clientWidth || 400, 600);
        canvas.height = 420;
        generateGeometry();
        draw();
    }

    // =========================================
    // PUBLIC API
    // =========================================

    window.renderTree = function (daysLeft) {
        let p = (TOTAL_DAYS - daysLeft + 1) / TOTAL_DAYS;
        p = Math.max(0, Math.min(1, p));
        progress = p;
        if (!animFrameId) draw();
    };

    // =========================================
    // INIT
    // =========================================

    window.initTreeCountdown = function () {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initTreeCountdown);
    } else {
        setTimeout(window.initTreeCountdown, 0);
    }

})();
