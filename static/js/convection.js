function startConvection(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const W = canvas.width, H = canvas.height;
    let time = 0;

    // Fluid layer geometry
    const cellX = 60, cellY = 100, cellW = W - 120, cellH = H - 230;
    const cellBot = cellY + cellH;

    // Rayleigh-Bénard: multiple convection rolls side by side
    // Each roll: hot fluid rises at center, spreads at top, sinks at edges, spreads at bottom
    const numRolls = 3;
    const rollW = cellW / numRolls;

    // Tracer particles that follow realistic convection velocity field
    const numParticles = 300;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: cellX + Math.random() * cellW,
            y: cellY + Math.random() * cellH,
            trail: []
        });
    }

    // Velocity field: sum of Rayleigh-Bénard rolls
    // Each roll has a rising center and falling edges
    function velocity(x, y) {
        let vx = 0, vy = 0;
        // Normalized position within cell
        const nx = (x - cellX) / cellW;  // 0..1
        const ny = (y - cellY) / cellH;  // 0(top)..1(bottom)

        // Each roll: sinusoidal horizontal, cos vertical
        // vx = A * sin(2π * roll * nx) * cos(π * ny)     <- horizontal circulation
        // vy = -A * cos(2π * roll * nx) * sin(π * ny)    <- vertical (- = up at center of each roll)
        const A = 2.5;
        vx = A * Math.sin(numRolls * Math.PI * 2 * nx) * Math.cos(Math.PI * ny);
        vy = -A * Math.cos(numRolls * Math.PI * 2 * nx) * Math.sin(Math.PI * ny);

        // Small thermal noise / turbulence
        vx += (Math.random() - 0.5) * 0.15;
        vy += (Math.random() - 0.5) * 0.15;

        return { vx, vy };
    }

    function tempAtPos(x, y) {
        // Hot at bottom, cold at top, but modulated by convection roll (hot rising columns)
        const nx = (x - cellX) / cellW;
        const ny = (y - cellY) / cellH; // 0 = top, 1 = bottom
        // Base: hot at bottom
        let t = ny;
        // Modulate: rising columns (at roll centers) are warmer
        t += 0.25 * Math.cos(numRolls * Math.PI * 2 * nx) * Math.sin(Math.PI * ny);
        return Math.max(0, Math.min(1, t));
    }

    function tempToColor(t) {
        // 0=cold blue, 0.5=green/neutral, 1=hot orange-red
        let r, g, b;
        if (t < 0.5) {
            const f = t * 2;
            r = Math.round(f * 40);
            g = Math.round(80 + f * 140);
            b = Math.round(220 - f * 60);
        } else {
            const f = (t - 0.5) * 2;
            r = Math.round(40 + f * 215);
            g = Math.round(220 - f * 190);
            b = Math.round(160 - f * 160);
        }
        return [r, g, b];
    }

    // Pre-rasterize the temperature field as a background image
    function drawTempField() {
        const resolution = 4; // pixels per sample
        for (let px = cellX; px < cellX + cellW; px += resolution) {
            for (let py = cellY; py < cellY + cellH; py += resolution) {
                const t = tempAtPos(px + resolution / 2, py + resolution / 2);
                const [r, g, b] = tempToColor(t);
                ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
                ctx.fillRect(px, py, resolution, resolution);
            }
        }
    }

    // Draw velocity arrows on a coarse grid
    function drawVelocityArrows() {
        const gridX = 8, gridY = 6;
        const dx = cellW / gridX, dy = cellH / gridY;
        for (let i = 0; i <= gridX; i++) {
            for (let j = 0; j <= gridY; j++) {
                const x = cellX + i * dx;
                const y = cellY + j * dy;
                const { vx, vy } = velocity(x, y);
                const mag = Math.sqrt(vx * vx + vy * vy);
                if (mag < 0.1) continue;
                const scale = 10 / mag;
                const ex = x + vx * scale, ey = y + vy * scale;

                const t = tempAtPos(x, y);
                const [r, g, b] = tempToColor(t);
                ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(ex, ey);
                ctx.stroke();

                // Arrowhead
                const angle = Math.atan2(vy, vx);
                const ah = 5;
                ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex - ah * Math.cos(angle - 0.4), ey - ah * Math.sin(angle - 0.4));
                ctx.lineTo(ex - ah * Math.cos(angle + 0.4), ey - ah * Math.sin(angle + 0.4));
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#06060f');
        bg.addColorStop(1, '#10101e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
    }

    function drawCell() {
        // Cell border
        ctx.strokeStyle = 'rgba(180,200,255,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cellX, cellY, cellW, cellH);

        // Hot plate at bottom (glowing orange-red)
        const hotGrad = ctx.createLinearGradient(0, cellBot - 16, 0, cellBot + 20);
        hotGrad.addColorStop(0, 'rgba(255,120,0,0.9)');
        hotGrad.addColorStop(1, 'rgba(255,40,0,0.5)');
        ctx.fillStyle = hotGrad;
        ctx.shadowColor = 'rgba(255,100,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.fillRect(cellX, cellBot, cellW, 18);
        ctx.shadowBlur = 0;

        // Cold plate at top (blue)
        ctx.fillStyle = 'rgba(60,160,255,0.7)';
        ctx.shadowColor = 'rgba(60,160,255,0.7)';
        ctx.shadowBlur = 14;
        ctx.fillRect(cellX, cellY - 18, cellW, 18);
        ctx.shadowBlur = 0;

        // Roll boundary lines (subtle vertical dashes)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        for (let r = 1; r < numRolls; r++) {
            const rx = cellX + r * rollW;
            ctx.beginPath();
            ctx.moveTo(rx, cellY);
            ctx.lineTo(rx, cellBot);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    function drawParticles() {
        particles.forEach(p => {
            // Advance position
            const { vx, vy } = velocity(p.x, p.y);
            p.x += vx * 0.5;
            p.y += vy * 0.5;

            // Wrap/bounce at cell boundaries
            if (p.x < cellX) p.x = cellX + 1;
            if (p.x > cellX + cellW) p.x = cellX + cellW - 1;
            if (p.y < cellY) p.y = cellY + 1;
            if (p.y > cellBot) p.y = cellBot - 1;

            // Trail
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 10) p.trail.shift();

            const t = tempAtPos(p.x, p.y);
            const [r, g, b] = tempToColor(t);

            // Draw trail
            for (let i = 1; i < p.trail.length; i++) {
                const ta = (i / p.trail.length) * 0.45;
                ctx.beginPath();
                ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${ta})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            // Dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
            ctx.fill();
        });
    }

    function drawLabels() {
        // Title
        ctx.fillStyle = 'rgba(180,210,255,0.85)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Rayleigh\u2013B\u00E9nard Convection', 20, 32);
        ctx.fillStyle = 'rgba(140,170,220,0.55)';
        ctx.font = '13px Arial';
        ctx.fillText('Hot fluid rises, cools at top, sinks — forming convection rolls', 20, 54);

        // Plate labels
        ctx.fillStyle = 'rgba(100,180,255,0.85)';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('\u2744  Cold Plate  (\u2193 dense, sinks)', W / 2, cellY - 4);

        ctx.fillStyle = 'rgba(255,160,60,0.85)';
        ctx.fillText('\uD83D\uDD25  Hot Plate  (\u2191 less dense, rises)', W / 2, cellBot + 32);

        // Color scale
        const scaleX = cellX + cellW + 14, scaleH = cellH;
        const scale = ctx.createLinearGradient(0, cellY, 0, cellY + scaleH);
        scale.addColorStop(0, 'rgba(60,160,255,0.85)');
        scale.addColorStop(0.5, 'rgba(40,200,140,0.85)');
        scale.addColorStop(1, 'rgba(255,80,0,0.85)');
        ctx.fillStyle = scale;
        ctx.fillRect(scaleX, cellY, 14, scaleH);
        ctx.strokeStyle = 'rgba(200,200,200,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaleX, cellY, 14, scaleH);
        ctx.fillStyle = 'rgba(180,200,255,0.55)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Cold', scaleX + 18, cellY + 12);
        ctx.fillText('Hot', scaleX + 18, cellY + scaleH - 4);

        // Roll labels
        for (let r = 0; r < numRolls; r++) {
            const rx = cellX + r * rollW + rollW / 2;
            const dir = r % 2 === 0 ? '\u21BB' : '\u21BA'; // clockwise / ccw unicode
            ctx.fillStyle = 'rgba(200,220,255,0.25)';
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(dir, rx, cellY + cellH / 2 + 14);
        }
    }

    function animate() {
        drawBackground();
        drawCell();
        drawTempField();
        drawVelocityArrows();
        drawParticles();
        drawLabels();
        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

window.startConvection = startConvection;
