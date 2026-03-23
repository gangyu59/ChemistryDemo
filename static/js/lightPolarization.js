function startLightPolarization(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();
    let angle = 0;

    const lightbulbImage = new Image();
    lightbulbImage.src = 'image/lightbulb.heic';

    lightbulbImage.onload = () => {
        function drawPolarization() {
            // Colorful radial background
            const cx = canvas.width / 2, cy = canvas.height / 2;
            const lightIntensity = Math.cos(angle) ** 2;

            // Deep dark base
            ctx.fillStyle = '#04040e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Rotating rainbow halo behind the scene
            const numRays = 18;
            for (let i = 0; i < numRays; i++) {
                const a = (i / numRays) * Math.PI * 2 + angle * 0.3;
                const hue = (i / numRays) * 360;
                const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * canvas.width, cy + Math.sin(a) * canvas.height);
                grad.addColorStop(0, `hsla(${hue}, 100%, 55%, ${lightIntensity * 0.08})`);
                grad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const spread = Math.PI * 2 / numRays;
                ctx.arc(cx, cy, canvas.width, a - spread / 2, a + spread / 2);
                ctx.closePath();
                ctx.fill();
            }

            // Central radial glow (intensity-dependent)
            const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320);
            radGrad.addColorStop(0, `rgba(255,230,120,${lightIntensity * 0.35})`);
            radGrad.addColorStop(0.4, `rgba(200,120,255,${lightIntensity * 0.15})`);
            radGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = radGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw lightbulb at bottom layer
            ctx.drawImage(lightbulbImage, cx - 100, cy - 100, 200, 200);

            // First polarizer (fixed, blue tint)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(0);
            ctx.fillStyle = 'rgba(40, 80, 255, 0.45)';
            ctx.fillRect(-200, -200, 400, 400);
            ctx.restore();

            // Second polarizer (rotating, purple tint)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.fillStyle = 'rgba(160, 40, 255, 0.45)';
            ctx.fillRect(-200, -200, 400, 400);
            ctx.restore();

            // Light effect — intensity from Malus's law
            ctx.globalAlpha = lightIntensity;
            ctx.drawImage(lightbulbImage, cx - 100, cy - 100, 200, 200);
            ctx.globalAlpha = 1.0;

            // Intensity label
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Intensity: ${Math.round(lightIntensity * 100)}%  |  Malus\u2019s Law: I = I\u2080 cos\u00B2\u03B8`, cx, canvas.height - 20);
            ctx.fillStyle = 'rgba(200,180,255,0.55)';
            ctx.font = '14px Arial';
            ctx.fillText(`Analyzer angle: ${Math.round((angle * 180 / Math.PI) % 360)}\u00B0`, cx, canvas.height - 42);

            angle += 0.01;
            animationFrameId = requestAnimationFrame(drawPolarization);
        }

        clearCanvasAndStop();
        drawPolarization();
    };
}

window.startLightPolarization = startLightPolarization;
