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
        const trunkLen = Math.min(h * 0.24, 100);

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

        // Generate at a large virtual space, then auto-fit
        grow(w / 2, h - 35, trunkLen, 0, 15, 0);

        // --- AUTO-FIT: compute bounding box and scale/translate to fit canvas ---
        const padding = 25;
        const allPoints = [];
        storedTree.segments.forEach(s => {
            allPoints.push({ x: s.x1, y: s.y1 });
            allPoints.push({ x: s.x2, y: s.y2 });
        });
        storedTree.leafAnchors.forEach(l => {
            // Include leaf size in bounding box
            allPoints.push({ x: l.x - l.size, y: l.y - l.size });
            allPoints.push({ x: l.x + l.size, y: l.y + l.size });
        });

        if (allPoints.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            allPoints.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });

            const treeW = maxX - minX;
            const treeH = maxY - minY;
            const availW = w - padding * 2;
            const availH = h - padding * 2;

            // Only scale if tree exceeds canvas
            const scaleX = treeW > availW ? availW / treeW : 1;
            const scaleY = treeH > availH ? availH / treeH : 1;
            const scale = Math.min(scaleX, scaleY);

            // Center horizontally, anchor bottom with padding
            const treeCenterX = (minX + maxX) / 2;
            const scaledBottom = maxY * scale + (maxY - maxY * scale); // not needed, use offset
            const offsetX = w / 2 - treeCenterX * scale;
            const offsetY = (h - padding) - maxY * scale;

            // Transform all coordinates
            const transform = (x, y) => ({
                x: x * scale + offsetX,
                y: y * scale + offsetY
            });

            storedTree.segments.forEach(s => {
                const p1 = transform(s.x1, s.y1);
                const p2 = transform(s.x2, s.y2);
                s.x1 = p1.x; s.y1 = p1.y;
                s.x2 = p2.x; s.y2 = p2.y;
                s.w *= scale;
            });
            storedTree.leafAnchors.forEach(l => {
                const p = transform(l.x, l.y);
                l.x = p.x; l.y = p.y;
                l.size *= scale;
            });
        }

        // BALANCED distribution: interleave left and right leaves
        const centerX = w / 2;
        const leftLeaves = storedTree.leafAnchors.filter(l => l.x < centerX);
        const rightLeaves = storedTree.leafAnchors.filter(l => l.x >= centerX);

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
        const groundY = h - 30;
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
            // Base bark color with more warmth
            const rBase = Math.round(93 - t * 15);
            const gBase = Math.round(78 - t * 10);
            const bBase = Math.round(55 - t * 5);

            // --- Direction & perpendicular ---
            const dx = seg.x2 - seg.x1;
            const dy = seg.y2 - seg.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return;
            const nx = -dy / len;
            const ny = dx / len;

            const startHalf = seg.w * 0.58;
            const endHalf = seg.w * 0.36;

            // --- ROOT FLARE: widen base of the trunk (depth 0) ---
            let rootFlare = 1.0;
            if (seg.depth === 0) {
                rootFlare = 1.45; // 45% wider at the very base
            } else if (seg.depth === 1) {
                rootFlare = 1.15;
            }
            const actualStartHalf = startHalf * rootFlare;

            // Four corners
            const x1l = seg.x1 + nx * actualStartHalf;
            const y1l = seg.y1 + ny * actualStartHalf;
            const x1r = seg.x1 - nx * actualStartHalf;
            const y1r = seg.y1 - ny * actualStartHalf;
            const x2l = seg.x2 + nx * endHalf;
            const y2l = seg.y2 + ny * endHalf;
            const x2r = seg.x2 - nx * endHalf;
            const y2r = seg.y2 - ny * endHalf;

            // --- CURVED SILHOUETTE for thick branches (depth <= 2) ---
            if (seg.depth <= 2 && seg.w > 5) {
                // Midpoints with slight organic bulge
                const mx = (seg.x1 + seg.x2) / 2;
                const my = (seg.y1 + seg.y2) / 2;
                const bulgeL = seg.w * 0.12 * (seg.depth === 0 ? 1.3 : 1);
                const bulgeR = seg.w * 0.08 * (seg.depth === 0 ? 1.3 : 1);

                // Lateral lighting: left side lighter, right side darker
                const rLight = Math.min(255, rBase + 18);
                const gLight = Math.min(255, gBase + 14);
                const bLight = Math.min(255, bBase + 10);
                const rDark = Math.max(0, rBase - 15);
                const gDark = Math.max(0, gBase - 12);
                const bDark = Math.max(0, bBase - 8);

                // Left half (lighter)
                const gradL = ctx.createLinearGradient(
                    seg.x1 + nx * actualStartHalf, seg.y1,
                    (seg.x1 + seg.x2) / 2, (seg.y1 + seg.y2) / 2
                );
                gradL.addColorStop(0, `rgba(${rLight}, ${gLight}, ${bLight}, ${seg.alpha})`);
                gradL.addColorStop(1, `rgba(${rBase}, ${gBase}, ${bBase}, ${seg.alpha})`);

                ctx.fillStyle = gradL;
                ctx.beginPath();
                ctx.moveTo(x1l, y1l);
                ctx.quadraticCurveTo(mx + nx * bulgeL, my + ny * bulgeL, x2l, y2l);
                ctx.lineTo((x2l + x2r) / 2, (y2l + y2r) / 2);
                ctx.lineTo((x1l + x1r) / 2, (y1l + y1r) / 2);
                ctx.closePath();
                ctx.fill();

                // Right half (darker)
                const gradR = ctx.createLinearGradient(
                    (seg.x1 + seg.x2) / 2, (seg.y1 + seg.y2) / 2,
                    seg.x1 - nx * actualStartHalf, seg.y1
                );
                gradR.addColorStop(0, `rgba(${rBase}, ${gBase}, ${bBase}, ${seg.alpha})`);
                gradR.addColorStop(1, `rgba(${rDark}, ${gDark}, ${bDark}, ${seg.alpha})`);

                ctx.fillStyle = gradR;
                ctx.beginPath();
                ctx.moveTo((x1l + x1r) / 2, (y1l + y1r) / 2);
                ctx.lineTo((x2l + x2r) / 2, (y2l + y2r) / 2);
                ctx.lineTo(x2r, y2r);
                ctx.quadraticCurveTo(mx - nx * bulgeR, my - ny * bulgeR, x1r, y1r);
                ctx.closePath();
                ctx.fill();
            } else {
                // Thinner branches: simple tapered quad with gradient
                const grad = ctx.createLinearGradient(seg.x1, seg.y1, seg.x2, seg.y2);
                grad.addColorStop(0, `rgba(${rBase}, ${gBase}, ${bBase}, ${seg.alpha})`);
                grad.addColorStop(1, `rgba(${Math.round(rBase + 8)}, ${Math.round(gBase + 6)}, ${Math.round(bBase + 4)}, ${seg.alpha})`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(x1l, y1l);
                ctx.lineTo(x2l, y2l);
                ctx.lineTo(x2r, y2r);
                ctx.lineTo(x1r, y1r);
                ctx.closePath();
                ctx.fill();
            }

            // --- BARK TEXTURE (enhanced) ---
            if (seg.w > 3) {
                const isTrunk = seg.depth <= 1;
                const barkIntensity = isTrunk ? 0.28 : 0.15;

                // Irregular vertical cracks (bézier curves)
                const numCracks = isTrunk ? 5 : (seg.w > 6 ? 3 : 2);
                for (let i = 0; i < numCracks; i++) {
                    const frac = (i + 0.5) / numCracks - 0.5; // -0.5 to 0.5
                    const offset = frac * seg.w * 0.45;
                    const crackAlpha = barkIntensity * (0.5 + Math.abs(frac));

                    // Alternate dark and light cracks for depth
                    const isDarkCrack = i % 2 === 0;
                    const cr = isDarkCrack ? 45 : 110;
                    const cg = isDarkCrack ? 32 : 90;
                    const cb = isDarkCrack ? 20 : 65;

                    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(crackAlpha, 0.35)})`;
                    ctx.lineWidth = isDarkCrack ? 0.7 : 0.4;

                    // Bézier crack path (wavy, not straight)
                    const sx = seg.x1 + nx * offset;
                    const sy = seg.y1 + ny * offset;
                    const ex = seg.x2 + nx * offset * 0.55;
                    const ey = seg.y2 + ny * offset * 0.55;
                    const cpx = (sx + ex) / 2 + nx * seg.w * 0.06 * (i % 2 === 0 ? 1 : -1);
                    const cpy = (sy + ey) / 2 + ny * seg.w * 0.06 * (i % 2 === 0 ? -1 : 1);

                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
                    ctx.stroke();
                }

                // Horizontal bark rings (very subtle, trunk only)
                if (isTrunk) {
                    const numRings = 3;
                    for (let r = 0; r < numRings; r++) {
                        const frac = (r + 1) / (numRings + 1);
                        const rx = seg.x1 + dx * frac;
                        const ry = seg.y1 + dy * frac;
                        const halfW = actualStartHalf * (1 - frac) + endHalf * frac;

                        ctx.strokeStyle = `rgba(50, 38, 25, 0.12)`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(rx + nx * halfW * 0.8, ry + ny * halfW * 0.8);
                        ctx.quadraticCurveTo(
                            rx + nx * halfW * 0.1, ry + ny * halfW * 0.1 - 1.5,
                            rx - nx * halfW * 0.8, ry - ny * halfW * 0.8
                        );
                        ctx.stroke();
                    }
                }

                // Wood knots on thick branches (depth 0-1)
                if (seg.depth <= 1 && seg.w > 8) {
                    // One knot per major branch segment
                    const knotFrac = 0.35 + (seg.depth * 0.25);
                    const kx = seg.x1 + dx * knotFrac + nx * seg.w * 0.08;
                    const ky = seg.y1 + dy * knotFrac + ny * seg.w * 0.08;
                    const knotSize = seg.w * 0.12;

                    // Dark oval knot
                    ctx.fillStyle = `rgba(50, 35, 22, 0.30)`;
                    ctx.beginPath();
                    ctx.ellipse(kx, ky, knotSize * 1.2, knotSize * 0.8, seg.depth * 0.3, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner lighter ring
                    ctx.strokeStyle = `rgba(80, 60, 40, 0.20)`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.ellipse(kx, ky, knotSize * 0.7, knotSize * 0.5, seg.depth * 0.3, 0, Math.PI * 2);
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
        canvas.height = 620;
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
