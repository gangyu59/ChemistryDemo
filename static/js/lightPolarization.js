function startLightPolarization(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();
    let angle = 0;

    // Load the lightbulb image
    const lightbulbImage = new Image();
    lightbulbImage.src = 'image/lightbulb.heic';

    lightbulbImage.onload = () => {
        function drawPolarization() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the lightbulb image at the bottom layer
            ctx.drawImage(lightbulbImage, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);

            // Draw first polarizer (middle layer, fixed)
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(0);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(-200, -200, 400, 400);
            ctx.restore();

            // Draw second polarizer (top layer, rotating)
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angle);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(-200, -200, 400, 400);
            ctx.restore();

            // Calculate light intensity using Malus's Law
            const lightIntensity = Math.cos(angle) ** 2;
            ctx.globalAlpha = lightIntensity;

            // Draw light effect
            ctx.drawImage(lightbulbImage, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
            ctx.globalAlpha = 1.0;

            angle += 0.01;
            animationFrameId = requestAnimationFrame(drawPolarization);
        }
				clearCanvasAndStop();
        drawPolarization();
    };
}

window.startLightPolarization = startLightPolarization;