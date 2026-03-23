function startLightPolarization(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    let time = 0;
    let analyzerAngle = 0; // second polarizer angle (draggable)
    let dragging = false;
    let autoRotate = true;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Layout: source -> polarizer 1 (fixed) -> polarizer 2 (rotating) -> screen
    const srcX = 60;
    const pol1X = cx - 180;
    const pol2X = cx + 50;
    const screenX = canvas.width - 60;

    // Malus's law: I = I0 * cos^2(theta)
    function intensity() {
        return Math.cos(analyzerAngle) ** 2;
    }

    // Draw a glowing light source (LED-style)
    function drawSource() {
        // Beam from source to pol1
        const bIntensity = 1.0;
        for (let y = -80; y <= 80; y += 14) {
            const hue = ((y + 80) / 160) * 300;
            ctx.beginPath();
            ctx.moveTo(srcX, cy + y);
            ctx.lineTo(pol1X, cy + y);
            ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.12)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Source glow
        const sGrad = ctx.createRadialGradient(srcX, cy, 0, srcX, cy, 55);
        sGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        sGrad.addColorStop(0.3, 'rgba(255,240,180,0.8)');
        sGrad.addColorStop(1, 'rgba(255,200,50,0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(srcX, cy, 55, 0, Math.PI * 2);
        ctx.fill();

        // Bulb
        ctx.beginPath();
        ctx.arc(srcX, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,230,0.95)';
        ctx.shadowColor = 'rgba(255,220,80,1)';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Source', srcX, cy + 38);
    }

    function drawPolarizer(px, angle, label, isFixed) {
        ctx.save();
        ctx.translate(px, cy);
        ctx.rotate(angle);

        // Filter plate
        const plateH = 160;
        const plateW = 22;
        const pGrad = ctx.createLinearGradient(-plateW / 2, 0, plateW / 2, 0);
        if (isFixed) {
            pGrad.addColorStop(0, 'rgba(80,160,255,0.15)');
            pGrad.addColorStop(0.5, 'rgba(80,160,255,0.55)');
            pGrad.addColorStop(1, 'rgba(80,160,255,0.15)');
        } else {
            pGrad.addColorStop(0, 'rgba(255,120,80,0.15)');
            pGrad.addColorStop(0.5, 'rgba(255,120,80,0.6)');
            pGrad.addColorStop(1, 'rgba(255,120,80,0.15)');
        }
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.roundRect(-plateW / 2, -plateH / 2, plateW, plateH, 4);
        ctx.fill();

        // Grating lines showing polarization direction
        const lineColor = isFixed ? 'rgba(120,200,255,0.7)' : 'rgba(255,160,100,0.7)';
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        for (let l = -plateH / 2 + 8; l < plateH / 2; l += 10) {
            ctx.beginPath();
            ctx.moveTo(-plateW / 2 + 2, l);
            ctx.lineTo(plateW / 2 - 2, l);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = isFixed ? 'rgba(100,180,255,0.8)' : 'rgba(255,140,80,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-plateW / 2, -plateH / 2, plateW, plateH, 4);
        ctx.stroke();

        ctx.restore();

        // Arrow showing polarization axis
        ctx.save();
        ctx.translate(px, cy);
        const arrowLen = 65;
        const arrowColor = isFixed ? '#80ccff' : '#ff9966';
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = arrowColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen);
        ctx.lineTo(0, arrowLen);
        ctx.stroke();
        // Arrowheads
        const ah = 8;
        ctx.beginPath();
        ctx.moveTo(-ah / 2, -arrowLen + ah);
        ctx.lineTo(0, -arrowLen);
        ctx.lineTo(ah / 2, -arrowLen + ah);
        ctx.moveTo(-ah / 2, arrowLen - ah);
        ctx.lineTo(0, arrowLen);
        ctx.lineTo(ah / 2, arrowLen - ah);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Label
        ctx.fillStyle = isFixed ? '#80ccff' : '#ff9966';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, px, cy - 100);
        const deg = Math.round((isFixed ? 0 : analyzerAngle * 180 / Math.PI) % 360);
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.font = '12px Arial';
        ctx.fillText(`${deg}°`, px, cy + 100);
    }

    function drawBeamSegments() {
        const I = intensity();
        const beamAlpha = I;

        // Segment pol1 -> pol2: polarized (single direction), always full intensity from pol1
        const beamY = cy;
        const numRays = 9;
        for (let i = 0; i < numRays; i++) {
            const oy = (i - numRays / 2) * 14;
            const hue = (i / numRays) * 240;
            // After pol1: linearly polarized
            ctx.beginPath();
            ctx.moveTo(pol1X + 12, beamY + oy);
            ctx.lineTo(pol2X - 12, beamY + oy);
            ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.2)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Segment pol2 -> screen: attenuated by cos^2(theta)
        if (I > 0.01) {
            for (let i = 0; i < numRays; i++) {
                const oy = (i - numRays / 2) * 14 * (0.3 + I * 0.7);
                const hue = (i / numRays) * 240;
                ctx.beginPath();
                ctx.moveTo(pol2X + 12, beamY + oy);
                ctx.lineTo(screenX, beamY + oy);
                ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${beamAlpha * 0.35})`;
                ctx.lineWidth = 2 + I * 2;
                ctx.stroke();
            }
        }
    }

    function drawScreen() {
        const I = intensity();
        const hue = (1 - I) * 240; // bright white -> dark blue

        // Screen glow
        const sGrad = ctx.createRadialGradient(screenX, cy, 0, screenX, cy, 80 + I * 40);
        sGrad.addColorStop(0, `hsla(${hue}, 80%, ${40 + I * 50}%, ${I * 0.9})`);
        sGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(screenX, cy, 120, 0, Math.PI * 2);
        ctx.fill();

        // Screen rect
        ctx.fillStyle = `hsla(${hue}, 70%, ${10 + I * 20}%, 1)`;
        ctx.strokeStyle = 'rgba(200,200,200,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(screenX - 12, cy - 80, 24, 160, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Screen', screenX, cy + 100);
        ctx.fillText(`${Math.round(I * 100)}%`, screenX, cy - 92);
    }

    function drawIntensityMeter() {
        const I = intensity();
        const bx = cx - 80, by = canvas.height - 80, bw = 160, bh = 22;
        ctx.strokeStyle = 'rgba(200,200,200,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        const iGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        iGrad.addColorStop(0, '#0044ff');
        iGrad.addColorStop(0.5, '#00ffcc');
        iGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = iGrad;
        ctx.fillRect(bx, by, bw * I, bh);

        ctx.fillStyle = 'rgba(220,220,220,0.85)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Intensity: ${Math.round(I * 100)}%  |  Malus\'s Law: I = I\u2080 cos\u00B2\u03B8`, cx, by - 8);
    }

    function drawAngleDial() {
        const dialX = cx + 50, dialY = cy;
        const dialR = 42;

        ctx.beginPath();
        ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,140,80,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Angle indicator line
        ctx.save();
        ctx.translate(dialX, dialY);
        ctx.rotate(analyzerAngle);
        ctx.strokeStyle = '#ff9966';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff6633';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -dialR);
        ctx.lineTo(0, dialR);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Drag hint
        ctx.fillStyle = 'rgba(255,140,80,0.5)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('drag to rotate', dialX, dialY + dialR + 14);
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#080810');
        bg.addColorStop(1, '#10101a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Axis guide
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(srcX, cy);
        ctx.lineTo(screenX, cy);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawTitle() {
        ctx.fillStyle = 'rgba(180,220,255,0.7)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Light Polarization \u2014 Malus\'s Law', 16, 28);
        ctx.fillStyle = 'rgba(150,180,220,0.5)';
        ctx.font = '13px Arial';
        ctx.fillText('Drag the analyzer to rotate it. Watch the intensity change!', 16, 50);
    }

    function animate() {
        if (autoRotate && !dragging) {
            analyzerAngle += 0.005;
        }
        drawBackground();
        drawTitle();
        drawSource();
        drawBeamSegments();
        drawPolarizer(pol1X, 0, 'Polarizer (fixed)', true);
        drawPolarizer(pol2X, analyzerAngle, 'Analyzer', false);
        drawScreen();
        drawAngleDial();
        drawIntensityMeter();
        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    // Drag on analyzer dial
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', e => {
        const p = getPos(e);
        if (Math.hypot(p.x - pol2X, p.y - cy) < 60) { dragging = true; autoRotate = false; }
    });
    canvas.addEventListener('mousemove', e => {
        if (dragging) {
            const p = getPos(e);
            analyzerAngle = Math.atan2(p.y - cy, p.x - pol2X) + Math.PI / 2;
        }
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getPos(e); if (Math.hypot(p.x - pol2X, p.y - cy) < 80) { dragging = true; autoRotate = false; } }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (dragging) { const p = getPos(e); analyzerAngle = Math.atan2(p.y - cy, p.x - pol2X) + Math.PI / 2; } }, { passive: false });
    canvas.addEventListener('touchend', () => dragging = false);

    animate();
}

window.startLightPolarization = startLightPolarization;
