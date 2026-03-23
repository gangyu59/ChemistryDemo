function startVolcanicEruption(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    let time = 0;
    let lavaParticles = [];
    let ashParticles = [];
    let emberParticles = [];
    let smokeParticles = [];
    let lavaFlows = [];
    let shockwaveR = 0, shockwaveAlpha = 0;
    let eruptionIntensity = 0;
    let eruptionPhase = 0; // 0=building, 1=erupting, 2=cooling
    let phaseTimer = 0;

    const cx = canvas.width / 2;
    const volcanoBaseY = canvas.height;
    const craterY = canvas.height * 0.38;
    const craterX = cx;

    // Pre-generate lava flow paths on volcano sides
    function initLavaFlows() {
        lavaFlows = [];
        for (let side = -1; side <= 1; side += 2) {
            for (let f = 0; f < 3; f++) {
                const pts = [];
                let x = craterX + side * (10 + f * 12);
                let y = craterY + 10;
                while (y < volcanoBaseY) {
                    x += side * (0.8 + Math.random() * 0.6) + (Math.random() - 0.5) * 2;
                    y += 6 + Math.random() * 3;
                    pts.push({ x, y });
                }
                lavaFlows.push({ pts, progress: 0, hue: 10 + f * 8, width: 4 + f * 2 });
            }
        }
    }
    initLavaFlows();

    function spawnLava() {
        const spread = 60 + eruptionIntensity * 80;
        lavaParticles.push({
            x: craterX + (Math.random() - 0.5) * 30,
            y: craterY,
            vx: (Math.random() - 0.5) * spread * 0.12,
            vy: -(12 + Math.random() * 22) * (0.5 + eruptionIntensity * 0.7),
            life: 0,
            maxLife: 1.2 + Math.random() * 1.0,
            r: 5 + Math.random() * 10,
            hue: 5 + Math.random() * 30,
            gravity: 0.35 + Math.random() * 0.2
        });
    }

    function spawnAsh() {
        ashParticles.push({
            x: craterX + (Math.random() - 0.5) * 20,
            y: craterY - 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(1.5 + Math.random() * 3),
            life: 0,
            maxLife: 3 + Math.random() * 4,
            r: 1 + Math.random() * 2.5,
            drift: (Math.random() - 0.5) * 0.05
        });
    }

    function spawnSmoke() {
        smokeParticles.push({
            x: craterX + (Math.random() - 0.5) * 40,
            y: craterY - 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(0.6 + Math.random() * 1),
            life: 0,
            maxLife: 4 + Math.random() * 3,
            r: 20 + Math.random() * 30,
            alpha: 0.3 + Math.random() * 0.2
        });
    }

    function spawnEmber() {
        emberParticles.push({
            x: craterX + (Math.random() - 0.5) * 20,
            y: craterY,
            vx: (Math.random() - 0.5) * 8,
            vy: -(5 + Math.random() * 10),
            life: 0,
            maxLife: 1.5 + Math.random(),
            r: 2 + Math.random() * 3,
            trail: []
        });
    }

    function drawSky() {
        const nightness = 0.6 + 0.3 * Math.sin(time * 0.1);
        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        sky.addColorStop(0, `rgb(${Math.round(10 + eruptionIntensity * 40)},${Math.round(5 + eruptionIntensity * 15)},${Math.round(20 + eruptionIntensity * 10)})`);
        sky.addColorStop(0.5, `rgb(${Math.round(30 + eruptionIntensity * 60)},${Math.round(15 + eruptionIntensity * 20)},${Math.round(10)})`);
        sky.addColorStop(1, `rgb(${Math.round(50 + eruptionIntensity * 80)},${Math.round(25 + eruptionIntensity * 30)},${Math.round(10)})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    }

    function drawVolcano() {
        // Volcano silhouette
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, volcanoBaseY);
        ctx.lineTo(cx - 320, volcanoBaseY);
        ctx.lineTo(cx - 120, craterY + 60);
        ctx.lineTo(craterX - 35, craterY);
        ctx.lineTo(craterX + 35, craterY);
        ctx.lineTo(cx + 120, craterY + 60);
        ctx.lineTo(cx + 320, volcanoBaseY);
        ctx.lineTo(canvas.width, volcanoBaseY);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const vGrad = ctx.createLinearGradient(0, craterY, 0, volcanoBaseY);
        vGrad.addColorStop(0, '#2a1a08');
        vGrad.addColorStop(0.4, '#1a0e04');
        vGrad.addColorStop(1, '#0d0704');
        ctx.fillStyle = vGrad;
        ctx.fill();

        // Rock texture highlight
        ctx.strokeStyle = 'rgba(80,40,10,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Ground / lava lake floor
        const ground = ctx.createLinearGradient(0, volcanoBaseY - 60, 0, canvas.height);
        ground.addColorStop(0, '#1a0a02');
        ground.addColorStop(1, '#050200');
        ctx.fillStyle = ground;
        ctx.fillRect(0, volcanoBaseY - 2, canvas.width, canvas.height - volcanoBaseY + 2);

        // Lava crack glow in ground
        for (let i = 0; i < 5; i++) {
            const crackX = 50 + i * (canvas.width - 100) / 4;
            const glow = ctx.createRadialGradient(crackX, volcanoBaseY, 0, crackX, volcanoBaseY, 80);
            const pulse = 0.2 + 0.15 * Math.sin(time * 2.5 + i);
            glow.addColorStop(0, `rgba(255,80,0,${pulse})`);
            glow.addColorStop(1, 'rgba(255,30,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(crackX - 80, volcanoBaseY - 20, 160, 60);
        }
    }

    function drawLavaFlows() {
        lavaFlows.forEach(flow => {
            if (eruptionIntensity < 0.3) return;
            flow.progress = Math.min(1, flow.progress + eruptionIntensity * 0.005);
            const numPts = Math.floor(flow.progress * flow.pts.length);
            if (numPts < 2) return;

            for (let i = 1; i < numPts; i++) {
                const t = i / flow.pts.length;
                const alpha = (1 - t * 0.5) * eruptionIntensity;
                const heat = Math.max(0, 1 - t * 1.2);
                const hue = flow.hue + t * 20;
                ctx.strokeStyle = `hsla(${hue}, 100%, ${40 + heat * 30}%, ${alpha})`;
                ctx.lineWidth = flow.width * (1 - t * 0.4);
                ctx.lineCap = 'round';
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 6 + heat * 10;
                ctx.beginPath();
                ctx.moveTo(flow.pts[i - 1].x, flow.pts[i - 1].y);
                ctx.lineTo(flow.pts[i].x, flow.pts[i].y);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
    }

    function drawCraterGlow() {
        const glow = ctx.createRadialGradient(craterX, craterY, 5, craterX, craterY, 80 + eruptionIntensity * 60);
        const alpha = 0.2 + eruptionIntensity * 0.5 + 0.1 * Math.sin(time * 8);
        glow.addColorStop(0, `rgba(255,180,0,${alpha})`);
        glow.addColorStop(0.4, `rgba(255,60,0,${alpha * 0.5})`);
        glow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(craterX, craterY, 120 + eruptionIntensity * 60, 40 + eruptionIntensity * 20, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSmoke() {
        smokeParticles = smokeParticles.filter(p => p.life < p.maxLife);
        smokeParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = p.alpha * Math.sin(t * Math.PI) * 0.5;
            const grayness = Math.floor(60 + t * 80);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.3 + t * 0.7), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${grayness},${grayness - 10},${grayness - 20},${alpha})`;
            ctx.fill();
            p.x += p.vx + p.drift;
            p.y += p.vy;
            p.r += 0.3;
            p.vx *= 0.99;
            p.life += 0.016;
        });
    }

    function drawAsh() {
        ashParticles = ashParticles.filter(p => p.life < p.maxLife && p.y > -10);
        ashParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = (1 - t) * 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100,80,60,${alpha})`;
            ctx.fill();
            p.x += p.vx + p.drift;
            p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.05;
            p.life += 0.016;
        });
    }

    function drawLavaParticles() {
        lavaParticles = lavaParticles.filter(p => p.life < p.maxLife && p.y < volcanoBaseY + 20);
        lavaParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const heat = Math.max(0, 1 - t * 1.1);
            const hue = p.hue + t * 25;
            const lightness = 45 + heat * 35;
            const alpha = 1 - t * 0.6;

            // Draw trail
            if (p.trail && p.trail.length > 1) {
                for (let i = 1; i < p.trail.length; i++) {
                    const ta = (i / p.trail.length) * alpha * 0.4;
                    ctx.beginPath();
                    ctx.arc(p.trail[i].x, p.trail[i].y, p.r * 0.6 * (i / p.trail.length), 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, ${ta})`;
                    ctx.fill();
                }
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (1 - t * 0.3), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = heat * 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            if (!p.trail) p.trail = [];
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 6) p.trail.shift();

            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.995;
            p.life += 0.016;
        });
    }

    function drawEmbers() {
        emberParticles = emberParticles.filter(p => p.life < p.maxLife);
        emberParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = 1 - t;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,${Math.round(200 - t * 160)},0,${alpha})`;
            ctx.shadowColor = 'rgba(255,120,0,0.8)';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.vx *= 0.98;
            p.life += 0.016;
        });
    }

    function drawShockwave() {
        if (shockwaveAlpha > 0) {
            ctx.beginPath();
            ctx.arc(craterX, craterY, shockwaveR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,200,100,${shockwaveAlpha})`;
            ctx.lineWidth = 4;
            ctx.stroke();
            shockwaveR += 8;
            shockwaveAlpha -= 0.025;
        }
    }

    function drawHUD() {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, 10, 200, 55);
        ctx.fillStyle = 'rgba(255,180,50,0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Volcanic Eruption', 20, 32);
        ctx.fillStyle = 'rgba(200,150,80,0.7)';
        ctx.font = '13px Arial';
        ctx.fillText(`Intensity: ${Math.round(eruptionIntensity * 100)}%`, 20, 52);

        // Click hint
        ctx.fillStyle = 'rgba(255,200,100,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click / tap to trigger eruption', canvas.width / 2, canvas.height - 15);
    }

    function triggerEruption() {
        eruptionPhase = 1;
        eruptionIntensity = 0;
        phaseTimer = 0;
        shockwaveR = 0;
        shockwaveAlpha = 0.9;
        lavaFlows.forEach(f => f.progress = 0);
    }

    function animate() {
        // Update phase
        phaseTimer += 0.016;
        if (eruptionPhase === 1) {
            eruptionIntensity = Math.min(1, eruptionIntensity + 0.025);
            if (phaseTimer > 5) { eruptionPhase = 2; phaseTimer = 0; }
        } else if (eruptionPhase === 2) {
            eruptionIntensity = Math.max(0, eruptionIntensity - 0.008);
            if (eruptionIntensity <= 0) eruptionPhase = 0;
        } else {
            // Low idle glow
            eruptionIntensity = 0.05 + 0.03 * Math.sin(time * 2);
        }

        // Spawn particles
        if (eruptionIntensity > 0.05) {
            const rate = eruptionIntensity;
            if (Math.random() < rate * 0.7) spawnLava();
            if (Math.random() < rate * 0.5) spawnLava();
            if (Math.random() < rate * 0.4) spawnEmber();
            if (Math.random() < rate * 0.15) spawnSmoke();
            if (Math.random() < rate * 0.3) spawnAsh();
        } else {
            if (Math.random() < 0.06) spawnSmoke();
            if (Math.random() < 0.02) spawnAsh();
        }

        drawSky();
        drawVolcano();
        drawLavaFlows();
        drawCraterGlow();
        drawSmoke();
        drawAsh();
        drawLavaParticles();
        drawEmbers();
        drawShockwave();
        drawHUD();

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    canvas.addEventListener('click', triggerEruption);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); triggerEruption(); }, { passive: false });

    triggerEruption();
    animate();
}

window.startVolcanicEruption = startVolcanicEruption;
