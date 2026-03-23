function startDryIceSublimation(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const W = canvas.width, H = canvas.height;
    let time = 0;

    // Bowl / container
    const bowlCx = W / 2, bowlY = H * 0.55, bowlRx = 160, bowlRy = 45;

    // Dry ice blocks
    const iceBlocks = [
        { x: bowlCx - 55, y: bowlY - 28, w: 80, h: 40, melt: 0 },
        { x: bowlCx + 10, y: bowlY - 22, w: 65, h: 35, melt: 0 },
        { x: bowlCx - 95, y: bowlY - 18, w: 50, h: 30, melt: 0 }
    ];

    // CO2 fog particles
    let fogParticles = [];
    // Sublimation jet particles (tiny fast CO2 molecules)
    let jetParticles = [];
    // Mist wisps (big fluffy)
    let mistWisps = [];

    let sublimating = false;
    let sublimationLevel = 0; // 0..1
    let waterAdded = false;
    let pouringAngle = 0, pourProgress = 0;
    let pourX = W * 0.75, pourY = H * 0.22;
    let waterDroplets = [];
    let waterInBowl = 0; // 0..1
    let iceAge = 0;

    // --- Particle factories ---
    function makeFog() {
        const bx = bowlCx + (Math.random() - 0.5) * bowlRx * 1.4;
        return {
            x: bx,
            y: bowlY - 10 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(0.4 + Math.random() * 0.8),
            r: 22 + Math.random() * 30,
            life: 0,
            maxLife: 3 + Math.random() * 3,
            alpha: 0.25 + Math.random() * 0.2,
            hue: 180 + Math.random() * 40
        };
    }

    function makeJet(block) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        const speed = 1.5 + Math.random() * 2.5;
        return {
            x: block.x + Math.random() * block.w,
            y: block.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
            life: 0,
            maxLife: 0.5 + Math.random() * 0.5,
            r: 1.5 + Math.random() * 2
        };
    }

    function makeMist() {
        return {
            x: bowlCx + (Math.random() - 0.5) * bowlRx * 1.6,
            y: bowlY + bowlRy * 0.5,
            vx: (Math.random() - 0.5) * 2,
            vy: 0.2 + Math.random() * 0.6,
            r: 35 + Math.random() * 50,
            life: 0,
            maxLife: 4 + Math.random() * 4,
            alpha: 0.18 + Math.random() * 0.12
        };
    }

    function makeWaterDrop() {
        return {
            x: pourX + (Math.random() - 0.5) * 20,
            y: pourY + 60,
            vy: 2 + Math.random() * 1.5,
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

        // Lab table surface
        const tg = ctx.createLinearGradient(0, H * 0.75, 0, H);
        tg.addColorStop(0, '#1e1e2e');
        tg.addColorStop(1, '#0e0e18');
        ctx.fillStyle = tg;
        ctx.fillRect(0, H * 0.75, W, H * 0.25);
        ctx.strokeStyle = 'rgba(100,100,160,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.75);
        ctx.lineTo(W, H * 0.75);
        ctx.stroke();
    }

    function drawBowl() {
        // Water tint
        if (waterInBowl > 0.01) {
            const wGrad = ctx.createLinearGradient(bowlCx - bowlRx, bowlY, bowlCx + bowlRx, bowlY);
            wGrad.addColorStop(0, `rgba(30,120,200,${waterInBowl * 0.35})`);
            wGrad.addColorStop(1, `rgba(60,160,240,${waterInBowl * 0.25})`);
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(bowlCx, bowlY + 18, bowlRx * 0.9, bowlRy * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = wGrad;
            ctx.fill();
            ctx.restore();
        }

        // Bowl body
        ctx.save();
        const bGrad = ctx.createLinearGradient(bowlCx - bowlRx, bowlY, bowlCx + bowlRx, bowlY + 50);
        bGrad.addColorStop(0, 'rgba(100,130,180,0.25)');
        bGrad.addColorStop(0.5, 'rgba(160,190,230,0.4)');
        bGrad.addColorStop(1, 'rgba(80,110,160,0.3)');
        ctx.fillStyle = bGrad;

        ctx.beginPath();
        ctx.moveTo(bowlCx - bowlRx, bowlY);
        ctx.quadraticCurveTo(bowlCx - bowlRx, bowlY + 60, bowlCx, bowlY + 65);
        ctx.quadraticCurveTo(bowlCx + bowlRx, bowlY + 60, bowlCx + bowlRx, bowlY);
        ctx.ellipse(bowlCx, bowlY, bowlRx, bowlRy, 0, 0, Math.PI, true);
        ctx.fill();

        // Bowl rim
        ctx.strokeStyle = 'rgba(180,210,255,0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(bowlCx, bowlY, bowlRx, bowlRy, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(160,190,240,0.5)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Bowl', bowlCx, bowlY + 82);
    }

    function drawIce() {
        iceBlocks.forEach(block => {
            if (block.melt >= 1) return;
            const shrink = 1 - block.melt * 0.5;
            const bx = block.x + block.w * (1 - shrink) / 2;
            const by = block.y + block.h * (1 - shrink) / 2;
            const bw = block.w * shrink;
            const bh = block.h * shrink;

            // CO2 ice — blueish-white
            const iGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
            iGrad.addColorStop(0, 'rgba(200,230,255,0.95)');
            iGrad.addColorStop(0.5, 'rgba(160,200,240,0.88)');
            iGrad.addColorStop(1, 'rgba(100,150,210,0.8)');
            ctx.fillStyle = iGrad;
            ctx.shadowColor = 'rgba(150,200,255,0.6)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 5);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.roundRect(bx + bw * 0.1, by + bh * 0.1, bw * 0.5, bh * 0.25, 3);
            ctx.fill();

            // Slow melt
            if (sublimating) block.melt = Math.min(1, block.melt + 0.0008 * sublimationLevel);
        });

        ctx.fillStyle = 'rgba(180,220,255,0.65)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Dry Ice (CO\u2082)', bowlCx, bowlY - 50);
    }

    function drawFogParticles() {
        fogParticles = fogParticles.filter(p => p.life < p.maxLife);
        fogParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = p.alpha * Math.sin(t * Math.PI) * sublimationLevel;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.4 + t * 0.6), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 60%, 85%, ${alpha})`;
            ctx.fill();
            p.x += p.vx + 0.3 * Math.sin(time * 1.5 + p.x * 0.01);
            p.y += p.vy;
            p.vx *= 0.99;
            p.life += 0.016;
        });
    }

    function drawJetParticles() {
        jetParticles = jetParticles.filter(p => p.life < p.maxLife);
        jetParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = (1 - t) * 0.6 * sublimationLevel;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,230,255,${alpha})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.05;
            p.life += 0.016;
        });
    }

    function drawMistWisps() {
        mistWisps = mistWisps.filter(p => p.life < p.maxLife);
        mistWisps.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = p.alpha * Math.sin(t * Math.PI);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.3 + t * 0.7), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,210,240,${alpha})`;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.r += 0.3;
            p.vx += (Math.random() - 0.5) * 0.05;
            p.life += 0.016;
        });
    }

    function drawWaterDroplets() {
        waterDroplets = waterDroplets.filter(d => !d.landed);
        waterDroplets.forEach(d => {
            if (!d.landed) {
                d.y += d.vy;
                d.vy += 0.15;
                ctx.beginPath();
                ctx.ellipse(d.x, d.y, 4, 6, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(80,160,255,0.75)';
                ctx.fill();
                if (d.y > bowlY + 10) {
                    d.landed = true;
                    waterInBowl = Math.min(1, waterInBowl + 0.04);
                    sublimationLevel = Math.min(1, sublimationLevel + 0.08);
                }
            }
            d.life += 0.016;
        });
    }

    function drawWaterJug() {
        // Simple jug at top-right
        const jx = pourX, jy = pourY;

        // Jug body
        const jGrad = ctx.createLinearGradient(jx - 22, jy, jx + 22, jy);
        jGrad.addColorStop(0, 'rgba(60,140,220,0.4)');
        jGrad.addColorStop(0.5, 'rgba(100,180,255,0.6)');
        jGrad.addColorStop(1, 'rgba(60,140,220,0.4)');
        ctx.fillStyle = jGrad;
        ctx.beginPath();
        ctx.roundRect(jx - 22, jy, 44, 58, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,200,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(jx + 22, jy + 28, 14, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = 'rgba(120,200,255,0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spout
        ctx.fillStyle = 'rgba(100,180,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(jx - 22, jy + 50);
        ctx.lineTo(jx - 34, jy + 58);
        ctx.lineTo(jx - 22, jy + 58);
        ctx.closePath();
        ctx.fill();

        // Water level
        ctx.fillStyle = 'rgba(80,160,255,0.5)';
        ctx.fillRect(jx - 20, jy + 10, 40, 40);

        ctx.fillStyle = 'rgba(160,200,255,0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Water', jx, jy + 72);
    }

    function drawHUD() {
        ctx.fillStyle = 'rgba(180,220,255,0.8)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Dry Ice Sublimation', 16, 28);
        ctx.fillStyle = 'rgba(140,180,220,0.55)';
        ctx.font = '13px Arial';
        ctx.fillText('CO\u2082 sublimates directly from solid \u2192 gas (no liquid phase!)', 16, 50);

        // Sublimation level bar
        const bx = 16, by = H - 40, bw = 200, bh = 16;
        ctx.strokeStyle = 'rgba(150,200,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        const sg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        sg.addColorStop(0, '#0088ff');
        sg.addColorStop(1, '#ffffff');
        ctx.fillStyle = sg;
        ctx.fillRect(bx, by, bw * sublimationLevel, bh);
        ctx.fillStyle = 'rgba(180,210,255,0.6)';
        ctx.font = '12px Arial';
        ctx.fillText('Sublimation intensity', bx, by - 5);

        ctx.fillStyle = 'rgba(160,200,255,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click / tap the bowl to add water and intensify sublimation', W / 2, H - 12);
    }

    function addWater() {
        for (let i = 0; i < 5; i++) waterDroplets.push(makeWaterDrop());
    }

    function animate() {
        // Passive sublimation even without water
        sublimating = true;
        if (!waterAdded) sublimationLevel = 0.15 + 0.05 * Math.sin(time * 0.5);

        // Passive decay
        sublimationLevel = Math.max(0.1, sublimationLevel - 0.0005);
        iceAge += 0.016;

        // Spawn particles
        if (sublimationLevel > 0.05) {
            const rate = sublimationLevel;
            if (Math.random() < rate * 0.5) fogParticles.push(makeFog());
            if (Math.random() < rate * 0.7) fogParticles.push(makeFog());
            if (Math.random() < rate * 0.4) mistWisps.push(makeMist());
            iceBlocks.forEach(block => {
                if (block.melt < 1 && Math.random() < rate * 0.5) {
                    jetParticles.push(makeJet(block));
                }
            });
        }

        drawBackground();
        drawBowl();
        drawFogParticles();
        drawMistWisps();
        drawJetParticles();
        drawIce();
        drawWaterDroplets();
        drawWaterJug();
        drawHUD();

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    canvas.addEventListener('click', e => {
        const p = getPos(e);
        // Click near bowl or jug
        if (Math.hypot(p.x - bowlCx, p.y - bowlY) < bowlRx + 20) {
            addWater();
            waterAdded = true;
        }
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const p = getPos(e);
        if (Math.hypot(p.x - bowlCx, p.y - bowlY) < bowlRx + 30) {
            addWater();
            waterAdded = true;
        }
    }, { passive: false });

    animate();
}

window.startDryIceSublimation = startDryIceSublimation;
