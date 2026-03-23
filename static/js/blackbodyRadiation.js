function startBlackbodyRadiation(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const h = 6.626e-34, c = 3e8, k = 1.381e-23;

    function planck(lam, T) {
        return (2 * h * c * c) / (Math.pow(lam, 5) * (Math.exp((h * c) / (lam * k * T)) - 1));
    }

    // Wien's displacement: peak wavelength
    function peakWavelength(T) { return 2.898e-3 / T; }

    const temperatures = [1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000];
    let tempIdx = 3; // start at 4000K
    let displayTemp = temperatures[tempIdx];
    let targetTemp = temperatures[tempIdx];
    let time = 0;
    let photons = [];

    // Convert wavelength (nm) to approximate RGB
    function wavToRGB(wl) {
        // wl in nm (380..780)
        let r, g, b;
        if (wl < 380) { r = 0.5; g = 0; b = 0.5; }
        else if (wl < 440) { r = (440 - wl) / 60; g = 0; b = 1; }
        else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
        else if (wl < 510) { r = 0; g = 1; b = (510 - wl) / 20; }
        else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
        else if (wl < 645) { r = 1; g = (645 - wl) / 65; b = 0; }
        else if (wl < 780) { r = 1; g = 0; b = 0; }
        else { r = 0.5; g = 0; b = 0; }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // Map temperature to body color
    function tempToBodyColor(T) {
        if (T < 1500) return `hsl(0, 80%, ${10 + (T - 1000) / 500 * 15}%)`;
        if (T < 2500) return `hsl(${(T - 1500) / 1000 * 20}, 90%, ${25 + (T - 1500) / 1000 * 20}%)`;
        if (T < 4000) return `hsl(${20 + (T - 2500) / 1500 * 20}, 100%, ${45 + (T - 2500) / 1500 * 15}%)`;
        if (T < 6000) return `hsl(${40 + (T - 4000) / 2000 * 20}, 100%, ${60 + (T - 4000) / 2000 * 10}%)`;
        return `hsl(${60 + (T - 6000) / 4000 * 60}, 40%, ${70 + (T - 6000) / 4000 * 20}%)`;
    }

    function spawnPhoton(T) {
        // Sample a random wavelength from the spectrum (biased toward peak)
        const peak = peakWavelength(T) * 1e9; // nm
        const wl = Math.max(200, Math.min(900, peak + (Math.random() - 0.5) * peak * 0.8));
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        const cx = canvas.width / 2, cy = canvas.height * 0.36;
        return {
            x: cx + Math.cos(angle) * 30,
            y: cy + Math.sin(angle) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            wl,
            life: 0,
            maxLife: 1.5 + Math.random() * 1.5,
            r: 3 + Math.random() * 3
        };
    }

    // Precompute normalized spectrum for current temp
    function computeSpectrum(T) {
        const numW = 400;
        const pts = [];
        let maxI = 0;
        for (let i = 0; i < numW; i++) {
            const wl = (380 + (i / numW) * 400) * 1e-9;
            const I = planck(wl, T);
            pts.push(I);
            if (I > maxI) maxI = I;
        }
        return pts.map(v => v / maxI);
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#02020a');
        bg.addColorStop(1, '#080818');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawStarfield() {
        // Subtle stars — more glow at higher temps
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 60; i++) {
            const sx = (Math.sin(i * 1.7) * 0.5 + 0.5) * canvas.width;
            const sy = (Math.sin(i * 2.3) * 0.5 + 0.5) * canvas.height * 0.7;
            const sr = 0.5 + Math.sin(i + time) * 0.4;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.2, sr), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBody(T) {
        const cx = canvas.width / 2, cy = canvas.height * 0.36;
        const R = 70 + Math.min(30, (T - 1000) / 300);

        // Outer glow
        const outerR = R * (2 + (T / 10000));
        const gGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, outerR);
        const glowHue = T > 6000 ? 55 : T > 4000 ? 40 : T > 2500 ? 25 : 10;
        const glowAlpha = Math.min(0.45, T / 20000);
        gGrad.addColorStop(0, `hsla(${glowHue}, 100%, 70%, ${glowAlpha})`);
        gGrad.addColorStop(0.4, `hsla(${glowHue}, 100%, 50%, ${glowAlpha * 0.4})`);
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fill();

        // Body surface
        const bodyGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
        const col = tempToBodyColor(T);
        bodyGrad.addColorStop(0, 'white');
        bodyGrad.addColorStop(0.3, col);
        bodyGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = col;
        ctx.shadowBlur = 30 + T / 500;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Temperature label on body
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = `bold ${R > 80 ? 22 : 18}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(displayTemp)} K`, cx, cy);
        ctx.textBaseline = 'alphabetic';

        // Wien peak label
        const peakNm = Math.round(peakWavelength(T) * 1e9);
        ctx.fillStyle = 'rgba(200,220,255,0.6)';
        ctx.font = '13px Arial';
        ctx.fillText(`Peak: ${peakNm} nm`, cx, cy + R + 18);
    }

    function drawPhotons(T) {
        photons = photons.filter(p => p.life < p.maxLife);
        if (photons.length < 60) photons.push(spawnPhoton(T));

        photons.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = Math.sin(t * Math.PI) * 0.8;
            const [r, g, b] = wavToRGB(Math.max(380, Math.min(780, p.wl)));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (1 + t * 2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
            p.x += p.vx;
            p.y += p.vy;
            p.life += 0.016;
        });
    }

    function drawSpectrum(T) {
        const numW = 400;
        const specX = 40, specY = canvas.height * 0.62;
        const specW = canvas.width - 80, specH = 120;
        const segW = specW / numW;

        // Title
        ctx.fillStyle = 'rgba(180,210,255,0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Emission Spectrum (Planck Curve)', specX, specY - 16);

        // Axis
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(specX, specY);
        ctx.lineTo(specX + specW, specY);
        ctx.moveTo(specX, specY);
        ctx.lineTo(specX, specY - specH);
        ctx.stroke();

        const spectrum = computeSpectrum(T);

        // Draw filled spectrum bars
        for (let i = 0; i < numW; i++) {
            const wlNm = 380 + (i / numW) * 400;
            const [r, g, b] = wavToRGB(wlNm);
            const barH = spectrum[i] * specH;
            const x = specX + i * segW;

            ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
            ctx.fillRect(x, specY - barH, segW + 1, barH);
        }

        // Planck curve overlay
        ctx.beginPath();
        ctx.moveTo(specX, specY);
        for (let i = 0; i < numW; i++) {
            ctx.lineTo(specX + i * segW + segW / 2, specY - spectrum[i] * specH);
        }
        ctx.lineTo(specX + specW, specY);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Peak marker
        const peakNm = peakWavelength(T) * 1e9;
        if (peakNm >= 380 && peakNm <= 780) {
            const peakX = specX + ((peakNm - 380) / 400) * specW;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(peakX, specY);
            ctx.lineTo(peakX, specY - specH - 5);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(peakNm)} nm`, peakX, specY - specH - 10);
        }

        // Wavelength axis labels
        ctx.fillStyle = 'rgba(180,180,180,0.6)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        const wlLabels = [380, 450, 550, 650, 750];
        wlLabels.forEach(wl => {
            const lx = specX + ((wl - 380) / 400) * specW;
            ctx.fillText(`${wl}`, lx, specY + 14);
        });
        ctx.fillStyle = 'rgba(150,150,150,0.5)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Wavelength (nm)', specX + specW, specY + 24);
    }

    function drawTempSelector() {
        const bx = 40, by = canvas.height - 55;
        ctx.fillStyle = 'rgba(180,210,255,0.6)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Temperature:', bx, by - 6);

        temperatures.forEach((T, i) => {
            const tx = bx + i * 70;
            const isSelected = i === tempIdx;
            ctx.fillStyle = isSelected ? `rgba(255,200,80,0.9)` : 'rgba(100,130,180,0.5)';
            ctx.beginPath();
            ctx.roundRect(tx, by, 62, 30, 6);
            ctx.fill();
            ctx.fillStyle = isSelected ? '#000' : 'rgba(220,220,255,0.8)';
            ctx.font = isSelected ? 'bold 12px Arial' : '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${T >= 1000 ? (T / 1000).toFixed(0) + 'k' : T}K`, tx + 31, by + 20);
        });
    }

    function animate() {
        // Smooth temp transition
        displayTemp += (targetTemp - displayTemp) * 0.04;

        drawBackground();
        drawStarfield();
        drawBody(displayTemp);
        drawPhotons(displayTemp);
        drawSpectrum(displayTemp);
        drawTempSelector();

        ctx.fillStyle = 'rgba(180,210,255,0.5)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click a temperature button or tap the star to cycle', canvas.width / 2, 28);

        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        const by = canvas.height - 55;
        const bx = 40;
        // Check temp buttons
        temperatures.forEach((T, i) => {
            const tx = bx + i * 70;
            if (px >= tx && px <= tx + 62 && py >= by && py <= by + 30) {
                tempIdx = i;
                targetTemp = temperatures[i];
                photons = [];
            }
        });
        // Click on star
        const cx = canvas.width / 2, cy2 = canvas.height * 0.36;
        if (Math.hypot(px - cx, py - cy2) < 90) {
            tempIdx = (tempIdx + 1) % temperatures.length;
            targetTemp = temperatures[tempIdx];
            photons = [];
        }
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        const px = t.clientX - rect.left, py = t.clientY - rect.top;
        const by = canvas.height - 55, bx = 40;
        temperatures.forEach((T, i) => {
            const tx = bx + i * 70;
            if (px >= tx && px <= tx + 62 && py >= by && py <= by + 30) {
                tempIdx = i; targetTemp = T; photons = [];
            }
        });
        const cx = canvas.width / 2, cy2 = canvas.height * 0.36;
        if (Math.hypot(px - cx, py - cy2) < 90) {
            tempIdx = (tempIdx + 1) % temperatures.length;
            targetTemp = temperatures[tempIdx];
            photons = [];
        }
    }, { passive: false });

    animate();
}

window.startBlackbodyRadiation = startBlackbodyRadiation;
