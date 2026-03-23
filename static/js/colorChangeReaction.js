function startColorChangeReaction(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    // --- Reactions ---
    const reactions = [
        { name: 'Iodine Clock',   reagentA: '#f5e642', reagentB: '#1a0066', product: '#1a1a6e', bubbleHue: 60,  desc: 'H2O2 + KI \u2192 sudden blue-black' },
        { name: 'Chemiluminescence', reagentA: '#001a00', reagentB: '#00ff44', product: '#00ff99', bubbleHue: 130, desc: 'Luminol + H2O2 \u2192 glowing green' },
        { name: 'Briggs-Rauscher', reagentA: '#ffdd00', reagentB: '#0044cc', product: '#cc00cc', bubbleHue: 280, desc: 'Oscillating colors' },
        { name: 'pH Indicator',   reagentA: '#ff6600', reagentB: '#0066ff', product: '#ff00aa', bubbleHue: 320, desc: 'Acid + Base \u2192 vivid pink' }
    ];
    let rxnIdx = 0;

    // Beaker geometry (drawn, no image)
    const bkX = canvas.width / 2 - 130, bkY = 120, bkW = 260, bkH = 340;
    const liquidTop = bkY + 80, liquidH = bkH - 100;
    const liquidBot = liquidTop + liquidH;

    // State
    let liquidHue = 40;
    let targetHue = 40;
    let reacting = false;
    let reactionProgress = 0;
    let bubbles = [];
    let droplets = [];
    let glowParticles = [];
    let time = 0;
    let pouringAngle = 0;
    let pouringProgress = 0; // 0..1
    let dropper = { x: bkX + bkW + 60, y: 60, pouring: false };

    function currentRxn() { return reactions[rxnIdx]; }

    function startReaction() {
        if (reacting) return;
        reacting = true;
        reactionProgress = 0;
        targetHue = currentRxn().bubbleHue;
        dropper.pouring = true;
        pouringProgress = 0;

        // Spawn bubbles
        for (let i = 0; i < 80; i++) {
            bubbles.push({
                x: bkX + 30 + Math.random() * (bkW - 60),
                y: liquidBot - Math.random() * 30,
                r: 3 + Math.random() * 6,
                vy: -(0.5 + Math.random() * 1.5),
                vx: (Math.random() - 0.5) * 0.4,
                hue: currentRxn().bubbleHue,
                alpha: 0.7 + Math.random() * 0.3,
                delay: Math.random() * 1.5
            });
        }

        // Glow burst particles
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            glowParticles.push({
                x: bkX + bkW / 2, y: liquidTop + liquidH / 2,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0, maxLife: 1 + Math.random(),
                hue: currentRxn().bubbleHue, r: 3 + Math.random() * 5
            });
        }
    }

    function drawBackground() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#0d0d1f');
        bg.addColorStop(1, '#1a1a35');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Lab bench surface
        const bench = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
        bench.addColorStop(0, '#2a2a3a');
        bench.addColorStop(1, '#1a1a28');
        ctx.fillStyle = bench;
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        ctx.strokeStyle = 'rgba(100,100,160,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.lineTo(canvas.width, canvas.height - 80);
        ctx.stroke();
    }

    function drawBeaker() {
        // Beaker glow when reacting
        if (reacting) {
            const rxn = currentRxn();
            const gGrad = ctx.createRadialGradient(bkX + bkW / 2, liquidTop + liquidH / 2, 10, bkX + bkW / 2, liquidTop + liquidH / 2, bkW);
            const glowAlpha = 0.12 + 0.08 * Math.sin(time * 5) + reactionProgress * 0.15;
            gGrad.addColorStop(0, `hsla(${rxn.bubbleHue}, 100%, 60%, ${glowAlpha * 2})`);
            gGrad.addColorStop(1, `hsla(${rxn.bubbleHue}, 100%, 50%, 0)`);
            ctx.fillStyle = gGrad;
            ctx.fillRect(bkX - 60, bkY - 40, bkW + 120, bkH + 80);
        }

        // Liquid fill
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bkX + 8, liquidTop);
        ctx.lineTo(bkX + bkW - 8, liquidTop);
        ctx.lineTo(bkX + bkW - 8, liquidBot);
        ctx.lineTo(bkX + 8, liquidBot);
        ctx.closePath();
        ctx.clip();

        // Gradient liquid
        const lGrad = ctx.createLinearGradient(bkX, liquidTop, bkX, liquidBot);
        lGrad.addColorStop(0, `hsla(${liquidHue}, 90%, 55%, 0.85)`);
        lGrad.addColorStop(1, `hsla(${liquidHue + 20}, 90%, 30%, 0.9)`);
        ctx.fillStyle = lGrad;
        ctx.fillRect(bkX, liquidTop, bkW, liquidH + 5);

        // Surface shimmer
        ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.04 * Math.sin(time * 2)})`;
        ctx.fillRect(bkX + 8, liquidTop, bkW - 16, 6);

        ctx.restore();

        // Bubbles
        bubbles = bubbles.filter(b => b.y > liquidTop - 10);
        bubbles.forEach(b => {
            if (b.delay > 0) { b.delay -= 0.016; return; }
            b.y += b.vy;
            b.x += b.vx + 0.2 * Math.sin(time * 3 + b.x);
            b.r *= 1.003;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${b.hue}, 80%, 80%, ${b.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = `hsla(${b.hue}, 80%, 90%, 0.15)`;
            ctx.fill();
        });

        // Beaker glass outline
        ctx.save();
        ctx.strokeStyle = 'rgba(180,220,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Tapered beaker
        ctx.moveTo(bkX + 20, bkY);
        ctx.lineTo(bkX, liquidBot);
        ctx.lineTo(bkX + bkW, liquidBot);
        ctx.lineTo(bkX + bkW - 20, bkY);
        ctx.stroke();

        // Rim
        ctx.beginPath();
        ctx.moveTo(bkX - 5, bkY);
        ctx.lineTo(bkX + bkW + 5, bkY);
        ctx.stroke();

        // Measurement lines
        ctx.strokeStyle = 'rgba(180,220,255,0.3)';
        ctx.lineWidth = 1;
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(180,220,255,0.5)';
        for (let i = 1; i <= 4; i++) {
            const gy = liquidBot - i * (liquidH / 4);
            ctx.beginPath();
            ctx.moveTo(bkX + 14, gy);
            ctx.lineTo(bkX + 40, gy);
            ctx.stroke();
            ctx.fillText(`${i * 50}`, bkX + 12, gy + 4);
        }

        // Glass highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bkX + 18, bkY + 10);
        ctx.lineTo(bkX + 10, liquidBot - 20);
        ctx.stroke();
        ctx.restore();
    }

    function drawDropper() {
        // Dropper bottle on the right
        const dx = dropper.x, dy = dropper.y;
        const rxn = currentRxn();

        // Dropper body
        const dGrad = ctx.createLinearGradient(dx - 18, 0, dx + 18, 0);
        dGrad.addColorStop(0, `hsl(${rxn.bubbleHue + 40}, 70%, 25%)`);
        dGrad.addColorStop(1, `hsl(${rxn.bubbleHue + 40}, 70%, 55%)`);
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.roundRect(dx - 18, dy, 36, 70, 8);
        ctx.fill();
        ctx.strokeStyle = `hsl(${rxn.bubbleHue + 40}, 70%, 70%)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Nozzle
        ctx.fillStyle = `hsl(${rxn.bubbleHue + 40}, 50%, 40%)`;
        ctx.beginPath();
        ctx.moveTo(dx - 5, dy + 70);
        ctx.lineTo(dx + 5, dy + 70);
        ctx.lineTo(dx + 2, dy + 88);
        ctx.lineTo(dx - 2, dy + 88);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(rxn.name.split(' ')[0], dx, dy + 40);

        // Animated drip
        if (dropper.pouring && pouringProgress < 1) {
            pouringProgress = Math.min(1, pouringProgress + 0.005);
            const dropY = dy + 88 + pouringProgress * (liquidTop - dy - 88);
            if (dropY < liquidTop + 20) {
                ctx.beginPath();
                ctx.ellipse(dx, dropY, 5, 8, 0, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${rxn.bubbleHue}, 100%, 65%, 0.85)`;
                ctx.shadowColor = `hsl(${rxn.bubbleHue}, 100%, 60%)`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                // Drop hit liquid — trigger color shift
                dropper.pouring = false;
                droplets = [];
            }
        }

        // Instructions
        ctx.fillStyle = 'rgba(180,200,255,0.6)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click / tap to add reagent', canvas.width / 2, canvas.height - 30);
    }

    function drawGlowParticles() {
        glowParticles = glowParticles.filter(p => p.life < p.maxLife);
        glowParticles.forEach(p => {
            const t = p.life / p.maxLife;
            const alpha = Math.sin(t * Math.PI) * 0.7;
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.97; p.vy *= 0.97;
            p.life += 0.016;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
            ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    function drawReactionLabel() {
        const rxn = currentRxn();
        ctx.fillStyle = `hsla(${rxn.bubbleHue}, 80%, 70%, 0.9)`;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(rxn.name, 20, 40);
        ctx.fillStyle = 'rgba(180,200,255,0.6)';
        ctx.font = '15px Arial';
        ctx.fillText(rxn.desc, 20, 65);

        // Next button
        ctx.fillStyle = 'rgba(100,150,255,0.25)';
        ctx.beginPath();
        ctx.roundRect(canvas.width - 130, 20, 110, 34, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(180,210,255,0.85)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Next Reaction \u2192', canvas.width - 75, 42);
    }

    function animate() {
        drawBackground();

        // Smoothly shift liquid hue toward target
        if (reacting) {
            reactionProgress = Math.min(1, reactionProgress + 0.004);
            liquidHue += (targetHue - liquidHue) * 0.015;
            if (reactionProgress >= 1) reacting = false;
        }

        drawBeaker();
        drawGlowParticles();
        drawDropper();
        drawReactionLabel();
        time += 0.016;
        animationFrameId = requestAnimationFrame(animate);
    }

    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        // Next reaction button
        if (px > canvas.width - 130 && py < 60) {
            rxnIdx = (rxnIdx + 1) % reactions.length;
            liquidHue = reactions[rxnIdx].bubbleHue - 80;
            bubbles = []; glowParticles = [];
            reacting = false; reactionProgress = 0;
            return;
        }
        startReaction();
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        const px = t.clientX - rect.left, py = t.clientY - rect.top;
        if (px > canvas.width - 130 && py < 60) {
            rxnIdx = (rxnIdx + 1) % reactions.length;
            liquidHue = reactions[rxnIdx].bubbleHue - 80;
            bubbles = []; glowParticles = [];
            reacting = false; reactionProgress = 0;
            return;
        }
        startReaction();
    }, { passive: false });

    animate();
}

window.startColorChangeReaction = startColorChangeReaction;
