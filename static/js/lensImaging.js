function startLensImaging(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const image = new Image();
    image.src = 'image/horse.heic';

    let dragging = false;
    let objectPosition = 100;
    const focalLength = 150;

    function calculateImagePosition(objectDistance) {
        return (focalLength * objectDistance) / (objectDistance - focalLength);
    }

    function calculateImageSize(objectDistance, objectSize) {
        return (calculateImagePosition(objectDistance) / objectDistance) * objectSize;
    }

    function draw() {
        // Dark gradient background
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#06060f');
        bg.addColorStop(1, '#0d0d1e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle grid
        ctx.strokeStyle = 'rgba(99,102,241,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Principal axis
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Focal-point markers
        const fPoints = [
            { x: canvas.width / 2 - focalLength, label: 'F' },
            { x: canvas.width / 2 + focalLength, label: "F'" },
            { x: canvas.width / 2 - 2 * focalLength, label: '2F' },
            { x: canvas.width / 2 + 2 * focalLength, label: "2F'" }
        ];
        fPoints.forEach(fp => {
            ctx.beginPath();
            ctx.arc(fp.x, canvas.height / 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,200,80,0.7)';
            ctx.fill();
            ctx.fillStyle = 'rgba(255,200,80,0.55)';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(fp.label, fp.x, canvas.height / 2 + 22);
            ctx.strokeStyle = 'rgba(255,200,80,0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 5]);
            ctx.beginPath();
            ctx.moveTo(fp.x, canvas.height / 2 - 130);
            ctx.lineTo(fp.x, canvas.height / 2 + 130);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Convex lens
        ctx.save();
        const lensX = canvas.width / 2;
        const lensH = 180;
        const lGlow = ctx.createRadialGradient(lensX, canvas.height / 2, 0, lensX, canvas.height / 2, lensH);
        lGlow.addColorStop(0, 'rgba(100,180,255,0.1)');
        lGlow.addColorStop(1, 'rgba(60,120,255,0)');
        ctx.fillStyle = lGlow;
        ctx.fillRect(lensX - lensH, canvas.height / 2 - lensH, lensH * 2, lensH * 2);

        ctx.fillStyle = 'rgba(100,180,255,0.18)';
        ctx.strokeStyle = 'rgba(100,200,255,0.75)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(80,160,255,0.5)';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(lensX, canvas.height / 2 - lensH);
        ctx.quadraticCurveTo(lensX + 30, canvas.height / 2, lensX, canvas.height / 2 + lensH);
        ctx.quadraticCurveTo(lensX - 30, canvas.height / 2, lensX, canvas.height / 2 - lensH);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Lens arrowheads
        ctx.strokeStyle = 'rgba(140,220,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lensX - 6, canvas.height / 2 - lensH + 12);
        ctx.lineTo(lensX, canvas.height / 2 - lensH);
        ctx.lineTo(lensX + 6, canvas.height / 2 - lensH + 12);
        ctx.moveTo(lensX - 6, canvas.height / 2 + lensH - 12);
        ctx.lineTo(lensX, canvas.height / 2 + lensH);
        ctx.lineTo(lensX + 6, canvas.height / 2 + lensH - 12);
        ctx.stroke();
        ctx.restore();

        // Object (horse image)
        ctx.drawImage(image, objectPosition - 50, canvas.height / 2 - 100, 100, 100);

        const objectDistance = canvas.width / 2 - objectPosition;
        const imageDistance = calculateImagePosition(objectDistance);
        const imageSize = calculateImageSize(objectDistance, 100);

        let imageX = canvas.width / 2 + imageDistance;
        let isReal = imageDistance > 0;
        let isInverted = objectDistance > focalLength;
        let drawImageSize = Math.abs(imageSize);

        // Colored rays
        const rayPairs = [
            { hue: 0,   oy: -50 },
            { hue: 120, oy: -75 },
            { hue: 210, oy: -100 }
        ];

        rayPairs.forEach(rp => {
            ctx.strokeStyle = `hsla(${rp.hue}, 100%, 65%, 0.55)`;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = `hsl(${rp.hue}, 100%, 60%)`;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(objectPosition, canvas.height / 2 + rp.oy);
            ctx.lineTo(canvas.width / 2, canvas.height / 2 + rp.oy);
            if (isReal) {
                ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
            } else {
                ctx.lineTo(canvas.width, canvas.height / 2 + rp.oy);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(objectPosition, canvas.height / 2 - 100);
            ctx.lineTo(canvas.width / 2, canvas.height / 2);
            if (isReal) {
                ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
            } else {
                ctx.lineTo(canvas.width, canvas.height / 2 + rp.oy);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // Image (horse, possibly inverted)
        ctx.save();
        ctx.translate(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        if (isInverted) ctx.scale(1, -1);
        if (!isReal) ctx.globalAlpha = 0.5;
        ctx.drawImage(image, -drawImageSize / 2, -drawImageSize / 2, drawImageSize, drawImageSize);
        ctx.restore();

        // Guide lines (green)
        ctx.strokeStyle = 'rgba(80,220,120,0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(80,220,120,0.5)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(objectPosition, canvas.height / 2);
        ctx.lineTo(objectPosition, canvas.height / 2 - 100);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(imageX, canvas.height / 2);
        ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Info labels
        ctx.fillStyle = 'rgba(180,210,255,0.6)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`u = ${Math.round(objectDistance)} px`, objectPosition, canvas.height / 2 + 22);
        ctx.fillText(isReal ? 'Real Image' : 'Virtual Image', imageX, canvas.height / 2 + 22);
        ctx.fillStyle = 'rgba(140,210,255,0.6)';
        ctx.fillText('Convex Lens', canvas.width / 2, canvas.height / 2 - lensH - 10);

        ctx.fillStyle = 'rgba(160,180,255,0.4)';
        ctx.fillText('Drag the object left / right', canvas.width / 2, canvas.height - 14);

        animationFrameId = requestAnimationFrame(draw);
    }

    // Scale touch/mouse coords from CSS pixels → canvas coordinate space
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY
        };
    }

    function nearObject(p) {
        return p.x >= objectPosition - 60 && p.x <= objectPosition + 60 &&
               p.y >= canvas.height / 2 - 120 && p.y <= canvas.height / 2 + 10;
    }

    canvas.addEventListener('mousedown', e => { if (nearObject(getPos(e))) dragging = true; });
    canvas.addEventListener('mousemove', e => { if (dragging) objectPosition = Math.max(30, Math.min(canvas.width / 2 - 20, getPos(e).x)); });
    canvas.addEventListener('mouseup', () => dragging = false);
    canvas.addEventListener('mouseleave', () => dragging = false);

    canvas.addEventListener('touchstart', e => {
        if (nearObject(getPos(e))) { dragging = true; e.preventDefault(); }
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
        if (dragging) { e.preventDefault(); objectPosition = Math.max(30, Math.min(canvas.width / 2 - 20, getPos(e).x)); }
    }, { passive: false });
    canvas.addEventListener('touchend', () => dragging = false);

    image.onload = () => { draw(); };
}

window.startLensImaging = startLensImaging;
