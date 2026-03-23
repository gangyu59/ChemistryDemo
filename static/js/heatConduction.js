function startHeatConduction(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const numPoints = 120;
    const barX = 60, barY = canvas.height / 2 - 35;
    const barW = canvas.width - 120, barH = 70;
    const materials = [
        { name: 'Silver',   symbol: 'Ag', conductivity: 0.55, color: '#c0c0c0' },
        { name: 'Copper',   symbol: 'Cu', conductivity: 0.48, color: '#b87333' },
        { name: 'Iron',     symbol: 'Fe', conductivity: 0.28, color: '#808080' },
        { name: 'Glass',    symbol: '',   conductivity: 0.08, color: '#aaddff' },
        { name: 'Wood',     symbol: '',   conductivity: 0.04, color: '#8b6914' },
        { name: 'Rubber',   symbol: '',   conductivity: 0.012, color: '#222222' }
    ];
    let matIdx = 0;
    let temps = new Array(numPoints).fill(20);
    temps[0] = 900;
    let time = 0;
    let fireParticles = [];

    // Floating heat particles
    let heatParticles = [];
    for (let i = 0; i < 80; i++) {
        heatParticles.push(spawnHeatParticle(true));
    }

    function spawnHeatParticle(init) {
        const t = init ? Math.random() : 0;
        const barFrac = Math.random();
        const temp = temps[Math.floor(barFrac * numPoints)] || 20;
        const heat = Math.max(0, (temp - 20) / 880);
        return {
            x: barX + barFrac * barW,
            y: barY + Math.random() * barH,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(0.3 + Math.random() * 0.8) * (0.2 + heat),
            life: init ? Math.random() : 0,
            maxLife: 1.5 + Math.random(),
            hue: 20 + heat * 40,
            heat
        };
    }

    function spawnFireParticle() {
        return {
            x: barX - 18 + (Math.random() - 0.5) * 30,
            y: barY + barH + 10 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(2 + Math.random() * 5),
            life: 0,
            maxLife: 0.4 + Math.random() * 0.5,
            size: 6 + Math.random() * 10
        };
    }

    function tempToColor(t) {
        // black -> dark red -> red -> orange -> yellow -> white
        const nt = Math.max(0, Math.min(1, (t - 20) / 880));
        let r, g, b;
        if (nt < 0.25) {
            r = nt * 4 * 200; g = 0; b = 0;
        } else if (nt < 0.5) {
            const f = (nt - 0.25) * 4;
            r = 200 + f * 55; g = f * 100; b = 0;
        } else if (nt < 0.75) {
            const f = (nt - 0.5) * 4;
            r = 255; g = 100 + f * 155; b = 0;
        } else {
            const f = (nt - 0.75) * 4;
            r = 255; g = 255; b = f * 255;
        }
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    }

    function updateTemps() {
        const alpha = materials[matIdx].conductivity;
        const next = temps.slice();
        next[0] = 900;
        for (let i = 1; i < numPoints - 1; i++) {
            next[i] += alpha * (temps[i - 1] + temps[i + 1] - 2 * temps[i]);
        }
        next[numPoints - 1] = Math.max(20, next[numPoints - 1] - 0.05);
        temps = next;
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#111118');
        bg.addColorStop(1, '#1a1a28');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawBar() {
        const segW = barW / numPoints;
        for (let i = 0; i < numPoints; i++) {
            const color = tempToColor(temps[i]);
            ctx.fillStyle = color;
            ctx.fillRect(barX + i * segW, barY, segW + 1, barH);
        }

        // Glow from hot end
        const hotGrad = ctx.createRadialGradient(barX, barY + barH / 2, 0, barX, barY + barH / 2, 120);
        hotGrad.addColorStop(0, `rgba(255,160,0,${0.15 + 0.1 * Math.sin(time * 6)})`);
        hotGrad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = hotGrad;
        ctx.fillRect(barX - 80, barY - 60, 200, barH + 120);

        // Bar border
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
    }

    function drawFire() {
        // Spawn new fire particles
        if (fireParticles.length < 60) {
            for (let i = 0; i < 3; i++) fireParticles.push(spawnFireParticle());
        }
        fireParticles = fireParticles.filter(p => p.life < p.maxLife);
        fireParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = (1 - t) * 0.9;
            const hue = 20 + t * 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 100%, ${50 + t * 30}%, ${alpha})`;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // flicker upward then curl
            p.vx += (Math.random() - 0.5) * 0.3;
            p.life += 0.016;
        });

        // Fire source icon
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('\uD83D\uDD25', barX, barY + barH + 68);
    }

    function drawHeatParticles() {
        heatParticles.forEach((p, idx) => {
            const barFrac = (p.x - barX) / barW;
            const tempIdx = Math.floor(Math.max(0, Math.min(1, barFrac)) * (numPoints - 1));
            const heat = Math.max(0, (temps[tempIdx] - 20) / 880);
            if (heat < 0.02) { heatParticles[idx] = spawnHeatParticle(false); return; }

            p.x += p.vx;
            p.y += p.vy;
            p.life += 0.016;
            if (p.life > p.maxLife || p.y < barY - 60) {
                heatParticles[idx] = spawnHeatParticle(false);
                return;
            }
            const t = p.life / p.maxLife;
            const alpha = Math.sin(t * Math.PI) * heat * 0.7;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + heat * 4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${20 + heat * 40}, 100%, 65%, ${alpha})`;
            ctx.fill();
        });
    }

    function drawTempScale() {
        // Temperature labels along the bar
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const x = barX + (i / steps) * barW;
            const idx = Math.floor((i / steps) * (numPoints - 1));
            const t = Math.round(temps[idx]);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${t}°C`, x, barY - 8);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, barY);
            ctx.lineTo(x, barY - 5);
            ctx.stroke();
        }
    }

    function drawMaterialInfo() {
        const mat = materials[matIdx];
        // Panel
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.roundRect(barX, barY + barH + 90, barW, 80, 12);
        ctx.fill();

        ctx.fillStyle = mat.color;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(mat.name + (mat.symbol ? ` (${mat.symbol})` : ''), barX + 18, barY + barH + 128);

        // Conductivity bar
        const bw = 220;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(barX + 18, barY + barH + 140, bw, 12);
        const kGrad = ctx.createLinearGradient(barX + 18, 0, barX + 18 + bw, 0);
        kGrad.addColorStop(0, '#0060ff');
        kGrad.addColorStop(1, '#ff4400');
        ctx.fillStyle = kGrad;
        ctx.fillRect(barX + 18, barY + barH + 140, bw * (mat.conductivity / 0.55), 12);
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Thermal conductivity: ${mat.conductivity} (relative)`, barX + 18, barY + barH + 163);

        ctx.fillStyle = 'rgba(180,200,255,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Tap / click to switch material', barX + barW, barY + barH + 163);
    }

    function animate() {
        updateTemps();
        drawBackground();
        drawBar();
        drawHeatParticles();
        drawFire();
        drawTempScale();
        drawMaterialInfo();
        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    function switchMaterial() {
        matIdx = (matIdx + 1) % materials.length;
        temps = new Array(numPoints).fill(20);
        temps[0] = 900;
    }

    canvas.addEventListener('click', switchMaterial);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); switchMaterial(); }, { passive: false });

    animate();
}

window.startHeatConduction = startHeatConduction;
