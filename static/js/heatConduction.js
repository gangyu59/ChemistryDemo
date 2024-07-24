function startHeatConduction(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const barLength = canvas.width - 100;
    const numPoints = 100;
    const materials = [
        { name: "Metal", conductionSpeed: 0.5 },
        { name: "Wood", conductionSpeed: 0.35 },
        { name: "Plastic", conductionSpeed: 0.2 },
        { name: "Rubber", conductionSpeed: 0.05 }
    ];
    let currentMaterialIndex = 0;
    let temperatures = new Array(numPoints).fill(20); // Initial temperature
    temperatures[0] = 100; // Heat source

    function drawBar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < numPoints; i++) {
            const x = (i / numPoints) * barLength + 50;
            const color = Math.min(255, (temperatures[i] / 100) * 255);
            ctx.fillStyle = `rgb(${color}, 0, 0)`;
            ctx.fillRect(x, canvas.height / 2 - 20, barLength / numPoints, 40);
        }

        // Draw material name
        ctx.fillStyle = 'black';
        ctx.font = '40px Arial'; // 字体大小加倍
        ctx.fillText(materials[currentMaterialIndex].name, canvas.width / 2 - 50, canvas.height / 2 - 60);

        // Draw heat source icon (fire icon)
        ctx.font = '100px Arial';
        ctx.fillText('🔥', 10, canvas.height / 2 + 110);
    }

    function updateTemperatures() {
        const newTemperatures = temperatures.slice();
        for (let i = 1; i < numPoints - 1; i++) {
            newTemperatures[i] += materials[currentMaterialIndex].conductionSpeed * (temperatures[i - 1] + temperatures[i + 1] - 2 * temperatures[i]);
        }
        temperatures.splice(0, temperatures.length, ...newTemperatures);
    }

    function animate() {
        updateTemperatures();
        drawBar();
        animationFrameId = requestAnimationFrame(animate);
    }

    function switchMaterial() {
        currentMaterialIndex = (currentMaterialIndex + 1) % materials.length;
        temperatures = new Array(numPoints).fill(20); // Reset temperatures
        temperatures[0] = 100; // Reset heat source
    }

    canvas.addEventListener('click', switchMaterial);
		
    clearCanvasAndStop();
    animate();
}

window.startHeatConduction = startHeatConduction;