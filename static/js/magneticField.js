function startMagneticField(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    let northPole = { x: canvas.width / 4, y: canvas.height / 2 };
    let southPole = { x: 3 * canvas.width / 4, y: canvas.height / 2 };
    let draggingPole = null;
    let time = 0;

    const numLines = 24;
    const stepsPerLine = 300;
    const stepSize = 4;

    function getField(x, y) {
        const dx1 = x - northPole.x, dy1 = y - northPole.y;
        const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 1;
        const dx2 = x - southPole.x, dy2 = y - southPole.y;
        const r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
        const fx = (dx1 / (r1 * r1 * r1)) - (dx2 / (r2 * r2 * r2));
        const fy = (dy1 / (r1 * r1 * r1)) - (dy2 / (r2 * r2 * r2));
        const mag = Math.sqrt(fx * fx + fy * fy) + 1e-10;
        return { fx: fx / mag, fy: fy / mag };
    }

    function drawFieldLines() {
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            let x = northPole.x + Math.cos(angle) * 18;
            let y = northPole.y + Math.sin(angle) * 18;

            const points = [{ x, y }];
            for (let s = 0; s < stepsPerLine; s++) {
                const { fx, fy } = getField(x, y);
                x += fx * stepSize;
                y += fy * stepSize;
                points.push({ x, y });
                if (Math.hypot(x - southPole.x, y - southPole.y) < 20) break;
                if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;
            }

            if (points.length < 2) continue;

            for (let p = 1; p < points.length; p++) {
                const t = p / points.length;
                const hue = (160 + i * 14 + time * 40) % 360;
                const alpha = 0.5 + 0.5 * Math.sin(t * Math.PI);
                ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
                ctx.lineWidth = 1.5 + Math.sin(t * Math.PI) * 1.5;
                ctx.beginPath();
                ctx.moveTo(points[p - 1].x, points[p - 1].y);
                ctx.lineTo(points[p].x, points[p].y);
                ctx.stroke();
            }

            // Animated glowing dot flowing along the line
            if (points.length > 10) {
                const tArrow = ((time * 0.5 + i / numLines) % 1);
                const idx = Math.floor(tArrow * (points.length - 1));
                const pt = points[idx];
                const hue = (60 + i * 15) % 360;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${hue}, 100%, 85%)`;
                ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    function drawPole(pole, isNorth) {
        const hue = isNorth ? 0 : 220;
        const label = isNorth ? 'N' : 'S';

        // Pulsing outer glow
        const pulse = 0.3 + 0.15 * Math.sin(time * 3 + (isNorth ? 0 : Math.PI));
        const grad = ctx.createRadialGradient(pole.x, pole.y, 5, pole.x, pole.y, 75);
        grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${pulse})`);
        grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(pole.x, pole.y, 75, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Pole body
        const bodyGrad = ctx.createRadialGradient(pole.x - 12, pole.y - 12, 4, pole.x, pole.y, 44);
        bodyGrad.addColorStop(0, `hsl(${hue}, 100%, 85%)`);
        bodyGrad.addColorStop(1, `hsl(${hue}, 100%, 38%)`);
        ctx.beginPath();
        ctx.arc(pole.x, pole.y, 44, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, pole.x, pole.y);
    }

    function animate() {
        // Dark space background with subtle gradient
        const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
        bgGrad.addColorStop(0, '#0a0a2e');
        bgGrad.addColorStop(1, '#000010');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawFieldLines();
        drawPole(northPole, true);
        drawPole(southPole, false);

        // Label
        ctx.fillStyle = 'rgba(180,220,255,0.7)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Drag the poles \u2014 watch the field lines reshape', canvas.width / 2, 14);

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', e => {
        const p = getPos(e);
        if (Math.hypot(p.x - northPole.x, p.y - northPole.y) < 50) draggingPole = northPole;
        else if (Math.hypot(p.x - southPole.x, p.y - southPole.y) < 50) draggingPole = southPole;
    });
    canvas.addEventListener('mousemove', e => { if (draggingPole) { const p = getPos(e); draggingPole.x = p.x; draggingPole.y = p.y; } });
    canvas.addEventListener('mouseup', () => draggingPole = null);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getPos(e); if (Math.hypot(p.x - northPole.x, p.y - northPole.y) < 50) draggingPole = northPole; else if (Math.hypot(p.x - southPole.x, p.y - southPole.y) < 50) draggingPole = southPole; }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (draggingPole) { const p = getPos(e); draggingPole.x = p.x; draggingPole.y = p.y; } }, { passive: false });
    canvas.addEventListener('touchend', () => draggingPole = null);

    animate();
}

window.startMagneticField = startMagneticField;
