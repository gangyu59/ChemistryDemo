function startStaticElectricity(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    // --- State ---
    let charged = false;
    let chargeLevel = 0; // 0..1
    let rubbing = false;
    let time = 0;
    let sparks = [];
    let electrons = [];
    let lightningBolts = [];
    let lightningTimer = 0;

    // Draggable rod
    let rod = { x: canvas.width * 0.62, y: canvas.height * 0.38, angle: -0.5, dragging: false, dragOffX: 0, dragOffY: 0 };
    // Static object (wool pad)
    let woolPos = { x: canvas.width * 0.3, y: canvas.height * 0.5 };

    // Electrons floating on the rod surface
    for (let i = 0; i < 60; i++) {
        electrons.push({
            t: Math.random(),       // position along rod length (0..1)
            side: (Math.random() - 0.5) * 20, // offset perpendicular
            alpha: 0,
            r: 3 + Math.random() * 2,
            speed: 0.003 + Math.random() * 0.004
        });
    }

    function rodEndpoints() {
        const len = 140;
        const cx = rod.x, cy = rod.y;
        return {
            x1: cx - Math.cos(rod.angle) * len,
            y1: cy - Math.sin(rod.angle) * len,
            x2: cx + Math.cos(rod.angle) * len,
            y2: cy + Math.sin(rod.angle) * len
        };
    }

    // --- Lightning bolt generator ---
    function makeLightning(x1, y1, x2, y2, roughness, depth) {
        if (depth === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * roughness;
        const my = (y1 + y2) / 2 + (Math.random() - 0.5) * roughness;
        const left = makeLightning(x1, y1, mx, my, roughness * 0.55, depth - 1);
        const right = makeLightning(mx, my, x2, y2, roughness * 0.55, depth - 1);
        return [...left, ...right];
    }

    function spawnLightning() {
        const ep = rodEndpoints();
        // Lightning arcs from rod tip to nearby "ground" points
        const targets = [
            { x: woolPos.x + (Math.random() - 0.5) * 40, y: woolPos.y + (Math.random() - 0.5) * 40 },
            { x: ep.x1 + (Math.random() - 0.5) * 60, y: ep.y1 + 80 + Math.random() * 100 }
        ];
        const target = targets[Math.floor(Math.random() * targets.length)];
        const pts = makeLightning(ep.x2, ep.y2, target.x, target.y, 50, 7);
        lightningBolts.push({ pts, lifetime: 0.18 + Math.random() * 0.14, age: 0 });

        // Spawn spark particles at origin
        for (let i = 0; i < 18; i++) {
            sparks.push({
                x: ep.x2, y: ep.y2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 0.5 + Math.random() * 0.5,
                age: 0,
                hue: 180 + Math.random() * 80
            });
        }
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#0d0020');
        bg.addColorStop(1, '#1a003a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ambient glow around wool when charged
        if (chargeLevel > 0.1) {
            const glow = ctx.createRadialGradient(woolPos.x, woolPos.y, 5, woolPos.x, woolPos.y, 100 + chargeLevel * 80);
            glow.addColorStop(0, `rgba(255,200,50,${chargeLevel * 0.25})`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(woolPos.x, woolPos.y, 180, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWool() {
        // Draw a fluffy wool pad
        ctx.save();
        ctx.translate(woolPos.x, woolPos.y);
        for (let i = 0; i < 9; i++) {
            const ox = (i % 3 - 1) * 22, oy = (Math.floor(i / 3) - 1) * 16;
            const hue = 30 + i * 5;
            ctx.beginPath();
            ctx.arc(ox, oy, 16, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${hue}, 60%, 70%)`;
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,200,0.7)';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Wool', 0, 46);
        ctx.restore();
    }

    function drawRod() {
        const ep = rodEndpoints();
        ctx.save();

        // Rod glow when charged
        if (chargeLevel > 0.05) {
            ctx.shadowColor = `hsla(260, 100%, 70%, ${chargeLevel})`;
            ctx.shadowBlur = 22 + chargeLevel * 20;
        }

        // Rod body — glass look
        const grad = ctx.createLinearGradient(ep.x1, ep.y1, ep.x2, ep.y2);
        grad.addColorStop(0, `hsla(260, 80%, 30%, 0.9)`);
        grad.addColorStop(0.4, `hsla(260, 100%, 75%, 0.9)`);
        grad.addColorStop(0.6, `hsla(200, 100%, 80%, 0.9)`);
        grad.addColorStop(1, `hsla(260, 80%, 40%, 0.9)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ep.x1, ep.y1);
        ctx.lineTo(ep.x2, ep.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Bright highlight strip
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 4;
        const offX = Math.sin(rod.angle) * 4, offY = -Math.cos(rod.angle) * 4;
        ctx.beginPath();
        ctx.moveTo(ep.x1 + offX, ep.y1 + offY);
        ctx.lineTo(ep.x2 + offX, ep.y2 + offY);
        ctx.stroke();

        ctx.restore();

        // Label
        ctx.fillStyle = 'rgba(200,180,255,0.85)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Glass Rod', rod.x, rod.y + 95);
    }

    function drawElectrons() {
        const ep = rodEndpoints();
        const dx = ep.x2 - ep.x1, dy = ep.y2 - ep.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;

        electrons.forEach(e => {
            e.t = (e.t + e.speed) % 1;
            e.alpha = chargeLevel * (0.5 + 0.5 * Math.sin(e.t * Math.PI * 2 + time * 4));
            if (e.alpha < 0.05) return;

            const px = ep.x1 + ux * e.t * len + nx * e.side;
            const py = ep.y1 + uy * e.t * len + ny * e.side;

            ctx.beginPath();
            ctx.arc(px, py, e.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120, 200, 255, ${e.alpha})`;
            ctx.shadowColor = 'rgba(100,180,255,0.9)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    function drawLightning() {
        lightningBolts = lightningBolts.filter(b => b.age < b.lifetime);
        lightningBolts.forEach(bolt => {
            const t = bolt.age / bolt.lifetime;
            const alpha = (1 - t) * 0.9;
            const pts = bolt.pts;

            // Outer glow
            ctx.strokeStyle = `rgba(180, 120, 255, ${alpha * 0.4})`;
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();

            // Core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();

            bolt.age += 0.016;
        });
    }

    function drawSparks() {
        sparks = sparks.filter(s => s.age < s.life);
        sparks.forEach(s => {
            const t = s.age / s.life;
            s.x += s.vx * (1 - t);
            s.y += s.vy * (1 - t) + 0.1; // slight gravity
            const alpha = 1 - t;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 100%, 80%, ${alpha})`;
            ctx.shadowColor = `hsl(${s.hue}, 100%, 70%)`;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
            s.age += 0.016;
        });
    }

    function drawChargeBar() {
        const bx = 20, by = canvas.height - 50, bw = 180, bh = 18;
        ctx.strokeStyle = 'rgba(200,180,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        grad.addColorStop(0, '#3030ff');
        grad.addColorStop(0.5, '#aa00ff');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, bw * chargeLevel, bh);
        ctx.fillStyle = 'rgba(220,200,255,0.85)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Charge', bx, by - 6);
    }

    function drawInstructions() {
        ctx.fillStyle = 'rgba(200,180,255,0.6)';
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Drag the rod over the wool to charge it \u2014 then watch sparks fly!', canvas.width / 2, 22);
    }

    function isOverRod(px, py) {
        const ep = rodEndpoints();
        const dx = ep.x2 - ep.x1, dy = ep.y2 - ep.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const t = ((px - ep.x1) * dx + (py - ep.y1) * dy) / (len * len);
        const cx = ep.x1 + t * dx, cy = ep.y1 + t * dy;
        return t >= 0 && t <= 1 && Math.hypot(px - cx, py - cy) < 20;
    }

    function isNearWool(px, py) {
        return Math.hypot(px - woolPos.x, py - woolPos.y) < 60;
    }

    function onDown(px, py) {
        if (isOverRod(px, py)) {
            rod.dragging = true;
            rod.dragOffX = px - rod.x;
            rod.dragOffY = py - rod.y;
        }
    }

    function onMove(px, py) {
        if (rod.dragging) {
            rod.x = px - rod.dragOffX;
            rod.y = py - rod.dragOffY;

            // Check proximity to wool for rubbing
            const ep = rodEndpoints();
            const nearWool = isNearWool(ep.x1, ep.y1) || isNearWool(ep.x2, ep.y2);
            if (nearWool) {
                chargeLevel = Math.min(1, chargeLevel + 0.02);
                charged = chargeLevel > 0.3;
            }
        }
    }

    function onUp() {
        rod.dragging = false;
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', e => { const p = getPos(e); onDown(p.x, p.y); });
    canvas.addEventListener('mousemove', e => { const p = getPos(e); onMove(p.x, p.y); });
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getPos(e); onDown(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); const p = getPos(e); onMove(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); onUp(); }, { passive: false });

    function animate() {
        drawBackground();
        drawWool();
        drawRod();
        drawElectrons();
        drawLightning();
        drawSparks();
        drawChargeBar();
        drawInstructions();

        // Passive discharge
        if (!rod.dragging) chargeLevel = Math.max(0, chargeLevel - 0.0008);

        // Lightning spawning
        if (charged && chargeLevel > 0.5) {
            lightningTimer -= 0.016;
            if (lightningTimer <= 0) {
                spawnLightning();
                lightningTimer = 0.3 + Math.random() * 0.5 * (1 - chargeLevel);
                chargeLevel = Math.max(0, chargeLevel - 0.04);
            }
        }

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

window.startStaticElectricity = startStaticElectricity;
