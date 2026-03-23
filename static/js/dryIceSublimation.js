function startDryIceSublimation(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const W = canvas.width, H = canvas.height;
    let time = 0;

    // Bowl centered, in the lower half
    const bowlCx = W / 2, bowlY = H * 0.58, bowlRx = 160, bowlRy = 48;

    // Water jug: directly above the bowl
    const jugCx = bowlCx, jugTopY = H * 0.06;

    // Dry ice blocks inside the bowl
    const iceBlocks = [
        { x: bowlCx - 75, y: bowlY - 30, w: 80, h: 42, melt: 0 },
        { x: bowlCx + 5,  y: bowlY - 24, w: 65, h: 36, melt: 0 },
        { x: bowlCx - 110, y: bowlY - 18, w: 48, h: 28, melt: 0 }
    ];

    let fogParticles = [];
    let jetParticles = [];
    let mistWisps = [];
    let waterDroplets = [];
    let waterInBowl = 0;
    let sublimationLevel = 0.15;
    let waterAdded = false;

    // --- particle factories ---
    function makeFog() {
        const bx = bowlCx + (Math.random() - 0.5) * bowlRx * 1.4;
        return {
            x: bx, y: bowlY - 5 + (Math.random() - 0.5) * 18,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(0.5 + Math.random() * 1.0),
            r: 20 + Math.random() * 28,
            life: 0, maxLife: 2.5 + Math.random() * 2.5,
            alpha: 0.22 + Math.random() * 0.18,
            hue: 185 + Math.random() * 30
        };
    }

    function makeJet(block) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
        const speed = 1.5 + Math.random() * 2.5;
        return {
            x: block.x + Math.random() * block.w, y: block.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
            life: 0, maxLife: 0.5 + Math.random() * 0.4,
            r: 1.5 + Math.random() * 2
        };
    }

    function makeMist() {
        return {
            x: bowlCx + (Math.random() - 0.5) * bowlRx * 1.8,
            y: bowlY + bowlRy * 0.4,
            vx: (Math.random() - 0.5) * 1.8, vy: 0.3 + Math.random() * 0.7,
            r: 30 + Math.random() * 45,
            life: 0, maxLife: 4 + Math.random() * 4,
            alpha: 0.15 + Math.random() * 0.12
        };
    }

    // Drop falls from spout of jug downward to bowl
    function makeWaterDrop() {
        return {
            x: jugCx + (Math.random() - 0.5) * 10,
            y: jugTopY + 90,    // spout exit, just below jug
            vy: 1.5 + Math.random(),
            life: 0,
            landed: false
        };
    }

    // --- Drawing ---
    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#06060f');
        bg.addColorStop(1, '#101018');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Lab surface
        const tg = ctx.createLinearGradient(0, H * 0.78, 0, H);
        tg.addColorStop(0, '#1e1e2e'); tg.addColorStop(1, '#0e0e18');
        ctx.fillStyle = tg;
        ctx.fillRect(0, H * 0.78, W, H * 0.22);
        ctx.strokeStyle = 'rgba(100,100,160,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, H * 0.78); ctx.lineTo(W, H * 0.78); ctx.stroke();
    }

    function drawWaterJug() {
        const jx = jugCx, jy = jugTopY;
        const jW = 48, jH = 70;

        // Jug body
        const jGrad = ctx.createLinearGradient(jx - jW / 2, 0, jx + jW / 2, 0);
        jGrad.addColorStop(0, 'rgba(60,140,220,0.4)');
        jGrad.addColorStop(0.5, 'rgba(120,190,255,0.65)');
        jGrad.addColorStop(1, 'rgba(60,140,220,0.4)');
        ctx.fillStyle = jGrad;
        ctx.beginPath();
        ctx.roundRect(jx - jW / 2, jy, jW, jH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,210,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Handle (right side)
        ctx.beginPath();
        ctx.arc(jx + jW / 2 + 12, jy + jH * 0.45, 14, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = 'rgba(120,200,255,0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Water fill inside
        ctx.fillStyle = 'rgba(80,170,255,0.45)';
        ctx.beginPath();
        ctx.roundRect(jx - jW / 2 + 4, jy + 10, jW - 8, jH - 18, 4);
        ctx.fill();

        // Spout (bottom center narrow nozzle)
        ctx.fillStyle = 'rgba(100,180,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(jx - 6, jy + jH);
        ctx.lineTo(jx + 6, jy + jH);
        ctx.lineTo(jx + 4, jy + jH + 16);
        ctx.lineTo(jx - 4, jy + jH + 16);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(160,200,255,0.6)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Water', jx, jy - 8);

        // Dashed line showing where drops will fall
        ctx.strokeStyle = 'rgba(80,160,255,0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(jugCx, jy + jH + 16);
        ctx.lineTo(jugCx, bowlY - bowlRy);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawBowl() {
        // Water tint inside bowl
        if (waterInBowl > 0.01) {
            const wGrad = ctx.createLinearGradient(bowlCx - bowlRx, bowlY, bowlCx + bowlRx, bowlY);
            wGrad.addColorStop(0, `rgba(30,120,200,${waterInBowl * 0.32})`);
            wGrad.addColorStop(1, `rgba(60,160,240,${waterInBowl * 0.22})`);
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(bowlCx, bowlY + 20, bowlRx * 0.88, bowlRy * 0.78, 0, 0, Math.PI * 2);
            ctx.fillStyle = wGrad;
            ctx.fill();
            ctx.restore();
        }

        // Bowl body
        ctx.save();
        const bGrad = ctx.createLinearGradient(bowlCx - bowlRx, bowlY, bowlCx, bowlY + 65);
        bGrad.addColorStop(0, 'rgba(100,130,180,0.22)');
        bGrad.addColorStop(0.5, 'rgba(160,190,230,0.38)');
        bGrad.addColorStop(1, 'rgba(80,110,160,0.28)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(bowlCx - bowlRx, bowlY);
        ctx.quadraticCurveTo(bowlCx - bowlRx, bowlY + 62, bowlCx, bowlY + 68);
        ctx.quadraticCurveTo(bowlCx + bowlRx, bowlY + 62, bowlCx + bowlRx, bowlY);
        ctx.ellipse(bowlCx, bowlY, bowlRx, bowlRy, 0, 0, Math.PI, true);
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,210,255,0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(bowlCx, bowlY, bowlRx, bowlRy, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(160,190,240,0.5)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Bowl', bowlCx, bowlY + 86);
    }

    function drawIce() {
        iceBlocks.forEach(block => {
            if (block.melt >= 1) return;
            const shrink = 1 - block.melt * 0.5;
            const bx = block.x + block.w * (1 - shrink) / 2;
            const by = block.y + block.h * (1 - shrink) / 2;
            const bw = block.w * shrink, bh = block.h * shrink;

            const iGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
            iGrad.addColorStop(0, 'rgba(200,235,255,0.95)');
            iGrad.addColorStop(0.5, 'rgba(160,205,245,0.88)');
            iGrad.addColorStop(1, 'rgba(100,155,215,0.8)');
            ctx.fillStyle = iGrad;
            ctx.shadowColor = 'rgba(150,200,255,0.55)';
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath(); ctx.roundRect(bx + bw * 0.1, by + bh * 0.1, bw * 0.5, bh * 0.25, 3); ctx.fill();

            if (sublimationLevel > 0.1) block.melt = Math.min(1, block.melt + 0.0007 * sublimationLevel);
        });

        ctx.fillStyle = 'rgba(180,225,255,0.65)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Dry Ice (CO\u2082)', bowlCx, bowlY - 52);
    }

    function drawFog() {
        fogParticles = fogParticles.filter(p => p.life < p.maxLife);
        fogParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = p.alpha * Math.sin(t * Math.PI) * Math.min(1, sublimationLevel * 3);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.4 + t * 0.6), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 60%, 88%, ${alpha})`;
            ctx.fill();
            p.x += p.vx + 0.25 * Math.sin(time * 1.5 + p.x * 0.01);
            p.y += p.vy; p.vx *= 0.99; p.life += 0.016;
        });
    }

    function drawJets() {
        jetParticles = jetParticles.filter(p => p.life < p.maxLife);
        jetParticles.forEach(p => {
            const t = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,235,255,${(1 - t) * 0.55})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life += 0.016;
        });
    }

    function drawMist() {
        mistWisps = mistWisps.filter(p => p.life < p.maxLife);
        mistWisps.forEach(p => {
            const t = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.3 + t * 0.7), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,215,240,${p.alpha * Math.sin(t * Math.PI)})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy; p.r += 0.25; p.vx += (Math.random() - 0.5) * 0.04; p.life += 0.016;
        });
    }

    function drawWaterDroplets() {
        waterDroplets = waterDroplets.filter(d => !d.landed);
        waterDroplets.forEach(d => {
            d.y += d.vy; d.vy += 0.18;
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 4, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(80,170,255,0.78)';
            ctx.fill();
            if (d.y > bowlY) {
                d.landed = true;
                waterInBowl = Math.min(1, waterInBowl + 0.035);
                sublimationLevel = Math.min(1, sublimationLevel + 0.10);
            }
            d.life += 0.016;
        });
    }

    function drawHUD() {
        ctx.fillStyle = 'rgba(180,220,255,0.85)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Dry Ice Sublimation', 16, 28);
        ctx.fillStyle = 'rgba(140,180,220,0.55)';
        ctx.font = '13px Arial';
        ctx.fillText('CO\u2082 sublimates directly solid \u2192 gas (skips liquid)', 16, 50);

        // Sublimation intensity bar
        const bx = 16, by = H - 40, bw = 200, bh = 16;
        ctx.strokeStyle = 'rgba(150,200,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        const sg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        sg.addColorStop(0, '#0088ff'); sg.addColorStop(1, '#aaeeff');
        ctx.fillStyle = sg;
        ctx.fillRect(bx, by, bw * Math.min(1, sublimationLevel), bh);
        ctx.fillStyle = 'rgba(160,210,255,0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Sublimation intensity', bx, by - 5);

        ctx.fillStyle = 'rgba(160,200,255,0.45)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click / tap to pour water on the dry ice', W / 2, H - 12);
    }

    function addWater() {
        for (let i = 0; i < 6; i++) waterDroplets.push(makeWaterDrop());
    }

    function animate() {
        sublimationLevel = Math.max(0.12, sublimationLevel - 0.0004);

        if (sublimationLevel > 0.05) {
            if (Math.random() < sublimationLevel * 0.55) fogParticles.push(makeFog());
            if (Math.random() < sublimationLevel * 0.4)  mistWisps.push(makeMist());
            iceBlocks.forEach(b => {
                if (b.melt < 1 && Math.random() < sublimationLevel * 0.5) jetParticles.push(makeJet(b));
            });
        }

        drawBackground();
        drawWaterJug();
        drawBowl();
        drawFog();
        drawMist();
        drawJets();
        drawIce();
        drawWaterDroplets();
        drawHUD();

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    canvas.addEventListener('click', () => addWater());
    canvas.addEventListener('touchstart', e => { addWater(); }, { passive: true });

    animate();
}

window.startDryIceSublimation = startDryIceSublimation;
