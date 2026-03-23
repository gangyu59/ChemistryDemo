function startLensImaging(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const focalLength = 150;
    const lensX = canvas.width / 2;
    const lensH = 180;

    let objectX = 180;
    const objectY = canvas.height / 2;
    const objectH = 90;
    let dragging = false;
    let time = 0;

    // Ray colors
    const rayColors = [
        { hue: 0,   label: 'Red'   },
        { hue: 120, label: 'Green' },
        { hue: 220, label: 'Blue'  }
    ];

    function imageCalc(objX) {
        const u = lensX - objX; // object distance (positive)
        if (u <= 0) return null;
        const v = (focalLength * u) / (u - focalLength); // image distance (+ = real)
        const mag = v / u;
        return { v, mag, imgX: lensX + v, isReal: v > 0, isInverted: v > 0 };
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#06060f');
        bg.addColorStop(1, '#0d0d1e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawAxis() {
        // Principal axis
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, objectY);
        ctx.lineTo(canvas.width, objectY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Focal points
        const fPoints = [lensX - focalLength, lensX + focalLength, lensX - 2 * focalLength, lensX + 2 * focalLength];
        const fLabels = ['F', "F'", '2F', "2F'"];
        fPoints.forEach((fx, i) => {
            ctx.beginPath();
            ctx.arc(fx, objectY, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,200,100,0.6)';
            ctx.fill();
            ctx.fillStyle = 'rgba(255,200,100,0.5)';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(fLabels[i], fx, objectY + 22);

            // Vertical guide lines at F and 2F
            ctx.strokeStyle = 'rgba(255,200,100,0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 5]);
            ctx.beginPath();
            ctx.moveTo(fx, objectY - lensH);
            ctx.lineTo(fx, objectY + lensH);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    function drawLens() {
        ctx.save();
        // Lens body glow
        const lGlow = ctx.createRadialGradient(lensX, objectY, 0, lensX, objectY, lensH);
        lGlow.addColorStop(0, 'rgba(100,180,255,0.1)');
        lGlow.addColorStop(1, 'rgba(60,120,255,0)');
        ctx.fillStyle = lGlow;
        ctx.fillRect(lensX - lensH, objectY - lensH, lensH * 2, lensH * 2);

        // Lens shape
        ctx.fillStyle = 'rgba(100,180,255,0.18)';
        ctx.strokeStyle = 'rgba(100,200,255,0.7)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(80,160,255,0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(lensX, objectY - lensH);
        ctx.quadraticCurveTo(lensX + 30, objectY, lensX, objectY + lensH);
        ctx.quadraticCurveTo(lensX - 30, objectY, lensX, objectY - lensH);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrowheads on lens
        ctx.strokeStyle = 'rgba(140,220,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lensX - 6, objectY - lensH + 12);
        ctx.lineTo(lensX, objectY - lensH);
        ctx.lineTo(lensX + 6, objectY - lensH + 12);
        ctx.moveTo(lensX - 6, objectY + lensH - 12);
        ctx.lineTo(lensX, objectY + lensH);
        ctx.lineTo(lensX + 6, objectY + lensH - 12);
        ctx.stroke();

        ctx.restore();
        ctx.fillStyle = 'rgba(140,210,255,0.6)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Convex Lens', lensX, objectY - lensH - 10);
    }

    function drawObject(x) {
        const arrowHue = 80;
        // Arrow body
        ctx.strokeStyle = `hsl(${arrowHue}, 100%, 60%)`;
        ctx.lineWidth = 4;
        ctx.shadowColor = `hsl(${arrowHue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x, objectY);
        ctx.lineTo(x, objectY - objectH);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrowhead
        ctx.fillStyle = `hsl(${arrowHue}, 100%, 65%)`;
        ctx.shadowColor = `hsl(${arrowHue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, objectY - objectH - 14);
        ctx.lineTo(x - 9, objectY - objectH + 3);
        ctx.lineTo(x + 9, objectY - objectH + 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Object label
        ctx.fillStyle = `hsl(${arrowHue}, 80%, 60%)`;
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Object', x, objectY + 20);

        // Distance label
        const u = lensX - x;
        ctx.fillStyle = 'rgba(200,220,255,0.5)';
        ctx.font = '12px Arial';
        ctx.fillText(`u = ${Math.round(u)} px`, x, objectY + 38);
    }

    function drawImage(img) {
        if (!img) return;
        const { imgX, isReal, isInverted, v, mag } = img;
        if (isNaN(imgX) || !isFinite(imgX)) return;

        const iH = Math.abs(objectH * mag);
        const clampedH = Math.min(iH, canvas.height * 0.45);
        const dir = isInverted ? 1 : -1; // 1 = top from axis going down
        const alpha = isReal ? 0.9 : 0.45;

        const hue = isReal ? 30 : 260;

        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = `hsl(${hue}, 100%, 55%)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(imgX, objectY);
        ctx.lineTo(imgX, objectY + dir * clampedH);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const tip = objectY + dir * (clampedH + 14);
        ctx.moveTo(imgX, tip);
        ctx.lineTo(imgX - 8, tip - dir * 14);
        ctx.lineTo(imgX + 8, tip - dir * 14);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isReal ? 'Real Image' : 'Virtual Image', imgX, objectY + 20);
        ctx.fillStyle = 'rgba(200,200,255,0.5)';
        ctx.font = '12px Arial';
        ctx.fillText(`v = ${Math.round(v)} | m = ${Math.abs(mag).toFixed(2)}x`, imgX, objectY + 38);
    }

    function drawRays(img) {
        if (!img) return;
        const { imgX, isReal, isInverted, mag } = img;
        if (isNaN(imgX) || !isFinite(imgX)) return;

        const tipY = objectY - objectH;
        const iH = Math.min(Math.abs(objectH * mag), canvas.height * 0.45);
        const imgTipY = objectY + (isInverted ? 1 : -1) * iH;

        rayColors.forEach((rc, ri) => {
            const alpha = 0.6;
            const offset = (ri - 1) * 3;

            ctx.save();
            ctx.shadowColor = `hsl(${rc.hue}, 100%, 60%)`;
            ctx.shadowBlur = 5;
            ctx.strokeStyle = `hsla(${rc.hue}, 100%, 65%, ${alpha})`;
            ctx.lineWidth = 1.8;

            // Ray 1: parallel to axis then through back focal point
            ctx.beginPath();
            ctx.moveTo(objectX, tipY + offset);
            ctx.lineTo(lensX, tipY + offset);
            if (isReal) {
                ctx.lineTo(imgX, imgTipY + offset);
                ctx.lineTo(imgX + 40, imgTipY + (imgTipY - tipY) * 0.25 + offset);
            } else {
                ctx.lineTo(canvas.width, tipY + (canvas.width - lensX) * (imgTipY - tipY) / (imgX - lensX) + offset);
                ctx.setLineDash([5, 5]);
                ctx.moveTo(lensX, tipY + offset);
                ctx.lineTo(imgX, imgTipY + offset);
                ctx.setLineDash([]);
            }
            ctx.stroke();

            // Ray 2: through lens center (undeviated)
            ctx.beginPath();
            ctx.moveTo(objectX, tipY + offset);
            ctx.lineTo(lensX, objectY + offset);
            if (isReal) {
                ctx.lineTo(imgX, imgTipY + offset);
            } else {
                ctx.lineTo(canvas.width, objectY + (canvas.width - lensX) * (imgTipY - objectY) / (imgX - lensX) + offset);
            }
            ctx.stroke();

            ctx.restore();
        });
    }

    function drawInfoPanel(img) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 230, 90, 10);
        ctx.fill();

        ctx.fillStyle = 'rgba(180,220,255,0.8)';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Lens Imaging', 22, 32);

        ctx.fillStyle = 'rgba(160,200,240,0.6)';
        ctx.font = '13px Arial';
        if (img) {
            const { v, mag, isReal, isInverted } = img;
            ctx.fillText(`f = ${focalLength} px  |  u = ${Math.round(lensX - objectX)} px`, 22, 52);
            ctx.fillText(`v = ${Math.round(v)} px  |  m = ${Math.abs(mag).toFixed(2)}`, 22, 70);
            ctx.fillText(`${isReal ? 'Real' : 'Virtual'}, ${isInverted ? 'Inverted' : 'Upright'}`, 22, 88);
        }

        ctx.fillStyle = 'rgba(160,180,255,0.4)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Drag the object arrow left / right', canvas.width / 2, canvas.height - 15);
    }

    function draw() {
        const img = imageCalc(objectX);
        drawBackground();
        drawAxis();
        drawLens();
        drawRays(img);
        drawObject(objectX);
        drawImage(img);
        drawInfoPanel(img);
        time += 0.016;
        animationFrameId = requestAnimationFrame(draw);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    function nearObject(px, py) {
        return Math.abs(px - objectX) < 30 && py > objectY - objectH - 20 && py < objectY + 20;
    }

    canvas.addEventListener('mousedown', e => { const p = getPos(e); if (nearObject(p.x, p.y)) dragging = true; });
    canvas.addEventListener('mousemove', e => { if (dragging) { const p = getPos(e); objectX = Math.max(30, Math.min(lensX - 20, p.x)); } });
    canvas.addEventListener('mouseup', () => dragging = false);
    canvas.addEventListener('mouseleave', () => dragging = false);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getPos(e); if (nearObject(p.x, p.y)) dragging = true; }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (dragging) { const p = getPos(e); objectX = Math.max(30, Math.min(lensX - 20, p.x)); } }, { passive: false });
    canvas.addEventListener('touchend', () => dragging = false);

    draw();
}

window.startLensImaging = startLensImaging;
