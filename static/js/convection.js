function startConvection(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const W = canvas.width, H = canvas.height;
    let time = 0;

    // Fluid cell dimensions
    const cellW = W * 0.72, cellH = H * 0.52;
    const cellX = (W - cellW) / 2, cellY = (H - cellH) / 2 - 20;

    // Convection particles
    const numParticles = 280;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
        particles.push(makeParticle(true));
    }

    function makeParticle(init) {
        // Particles follow a convection loop: rise in center, fall at sides
        // Use a figure-8 / torus path
        const loop = Math.floor(Math.random() * 2); // 0 = left loop, 1 = right loop
        return {
            loop,
            phase: init ? Math.random() * Math.PI * 2 : 0,
            speed: 0.008 + Math.random() * 0.012,
            r: 2.5 + Math.random() * 2,
            opacity: 0.5 + Math.random() * 0.5
        };
    }

    function loopPos(loop, phase) {
        // Elliptical loop inside cell
        const lw = cellW * 0.42, lh = cellH * 0.38;
        const cx = loop === 0
            ? cellX + cellW * 0.27
            : cellX + cellW * 0.73;
        const cy = cellY + cellH * 0.5;

        // Counterclockwise rising center, falling edges
        const x = cx + Math.cos(-phase) * lw * 0.46;
        const y = cy + Math.sin(-phase) * lh * 0.46;
        return { x, y };
    }

    function tempAtY(y) {
        // Hot at bottom, cold at top
        return 1 - (y - cellY) / cellH;
    }

    function tempToColor(t) {
        // t=0 cold (blue), t=1 hot (orange-red)
        if (t < 0.5) {
            const f = t * 2;
            return [Math.round(f * 120), Math.round(80 + f * 120), Math.round(220 - f * 80)];
        } else {
            const f = (t - 0.5) * 2;
            return [Math.round(120 + f * 135), Math.round(200 - f * 160), Math.round(140 - f * 140)];
        }
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#060610');
        bg.addColorStop(1, '#10101e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
    }

    function drawCell() {
        // Temperature gradient fill for the fluid cell
        const grad = ctx.createLinearGradient(0, cellY, 0, cellY + cellH);
        grad.addColorStop(0, 'rgba(40, 60, 160, 0.35)');
        grad.addColorStop(0.5, 'rgba(30, 120, 80, 0.25)');
        grad.addColorStop(1, 'rgba(200, 80, 20, 0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY, cellW, cellH, 12);
        ctx.fill();

        // Cell border
        ctx.strokeStyle = 'rgba(180,200,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY, cellW, cellH, 12);
        ctx.stroke();

        // Hot plate at bottom
        const hotGrad = ctx.createLinearGradient(cellX, cellY + cellH - 14, cellX, cellY + cellH);
        hotGrad.addColorStop(0, 'rgba(255,100,0,0.6)');
        hotGrad.addColorStop(1, 'rgba(255,40,0,0.8)');
        ctx.fillStyle = hotGrad;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY + cellH - 14, cellW, 14, [0, 0, 12, 12]);
        ctx.fill();
        ctx.shadowColor = 'rgba(255,80,0,0.8)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY + cellH - 14, cellW, 14, [0, 0, 12, 12]);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cold plate at top
        ctx.fillStyle = 'rgba(60,160,255,0.55)';
        ctx.shadowColor = 'rgba(60,160,255,0.6)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(cellX, cellY, cellW, 12, [12, 12, 0, 0]);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawArrows() {
        // Show convection loop arrows
        [0, 1].forEach(loop => {
            const arcs = 8;
            for (let i = 0; i < arcs; i++) {
                const phase = (i / arcs) * Math.PI * 2 + time * 0.4;
                const nextPhase = ((i + 1) / arcs) * Math.PI * 2 + time * 0.4;
                const p1 = loopPos(loop, phase);
                const p2 = loopPos(loop, nextPhase);

                const t = tempAtY(p1.y);
                const [r, g, b] = tempToColor(t);
                const alpha = 0.12 + 0.08 * Math.sin(phase + time);
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.lineWidth = 20;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });
    }

    function drawParticles() {
        particles.forEach((p, idx) => {
            p.phase += p.speed;
            const pos = loopPos(p.loop, p.phase);

            // Clip to cell
            if (pos.x < cellX || pos.x > cellX + cellW || pos.y < cellY || pos.y > cellY + cellH) return;

            const t = tempAtY(pos.y);
            const [r, g, b] = tempToColor(t);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    function drawLabels() {
        // Hot label
        ctx.fillStyle = 'rgba(255,160,60,0.85)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 Hot Plate', cellX + cellW / 2, cellY + cellH + 28);

        // Cold label
        ctx.fillStyle = 'rgba(100,180,255,0.85)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('❄ Cold Plate', cellX + cellW / 2, cellY - 18);

        // Up arrows (center) and down arrows (edges) — tiny icons
        const midX = cellX + cellW / 2;
        ctx.fillStyle = 'rgba(255,160,60,0.5)';
        ctx.font = '20px Arial';
        ctx.fillText('↑', midX, cellY + cellH * 0.6);

        ctx.fillStyle = 'rgba(100,180,255,0.5)';
        ctx.fillText('↓', cellX + 18, cellY + cellH * 0.4);
        ctx.fillText('↓', cellX + cellW - 18, cellY + cellH * 0.4);

        // Color scale
        const scaleX = cellX + cellW + 22, scaleY = cellY, scaleH = cellH;
        const scale = ctx.createLinearGradient(0, scaleY, 0, scaleY + scaleH);
        scale.addColorStop(0, 'rgba(60,160,255,0.85)');
        scale.addColorStop(0.5, 'rgba(30,200,120,0.85)');
        scale.addColorStop(1, 'rgba(255,80,0,0.85)');
        ctx.fillStyle = scale;
        ctx.fillRect(scaleX, scaleY, 16, scaleH);
        ctx.strokeStyle = 'rgba(200,200,200,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaleX, scaleY, 16, scaleH);
        ctx.fillStyle = 'rgba(200,200,255,0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Cold', scaleX + 20, scaleY + 14);
        ctx.fillText('Hot', scaleX + 20, scaleY + scaleH - 4);

        // Title & description
        ctx.fillStyle = 'rgba(180,210,255,0.8)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Convection Currents', 20, 32);
        ctx.fillStyle = 'rgba(140,170,220,0.55)';
        ctx.font = '13px Arial';
        ctx.fillText('Hot fluid rises at center, cools at top, sinks at edges', 20, 52);
    }

    function animate() {
        drawBackground();
        drawCell();
        drawArrows();
        drawParticles();
        drawLabels();
        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

window.startConvection = startConvection;
