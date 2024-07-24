function startBlackbodyRadiation(canvas, ctx, clearCanvasAndStop) {
    let animationFrameId; // 确保变量在使用前已初始化

    const originalClearCanvasAndStop = clearCanvasAndStop; // 保存原始的清理函数

    // 定义新的清理函数
    const stopAnimationAndClearCanvas = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (originalClearCanvasAndStop) {
            originalClearCanvasAndStop(); // 调用原始的清理函数
        }
    };

    clearCanvasAndStop = stopAnimationAndClearCanvas; // 更新外部传入的清理函数
    clearCanvasAndStop(); // 确保清理之前的动画和定时器

    const numWavelengths = 400;
    const temperatures = [3000, 4000, 5000, 6000];
    let currentTempIndex = 0;

    function planck(wavelength, temp) {
        const h = 6.626e-34;
        const c = 3e8;
        const k = 1.381e-23;
        return (2 * h * c * c) / (Math.pow(wavelength, 5) * (Math.exp((h * c) / (wavelength * k * temp)) - 1));
    }

    function drawBlackbodyAndSpectrum() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const maxIntensity = planck(500e-9, temperatures[currentTempIndex]);

        // Draw background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw blackbody
        const blackbodyColor = `hsl(${240 - (temperatures[currentTempIndex] - 3000) / 3000 * 240}, 100%, 50%)`;
        ctx.fillStyle = blackbodyColor;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 4, 100, 0, Math.PI * 2);
        ctx.fill();

        // Draw spectrum
        const spectrumHeight = canvas.height / 3 - 100;
        const spectrumYPosition = canvas.height / 2 + 160;
        for (let i = 0; i < numWavelengths; i++) {
            const wavelength = (i / numWavelengths) * 700e-9 + 300e-9;
            const intensity = planck(wavelength, temperatures[currentTempIndex]) / maxIntensity;
            const x = (i / numWavelengths) * canvas.width;
            const y = spectrumYPosition + (1 - intensity) * spectrumHeight;

            ctx.fillStyle = `hsl(${(wavelength - 300e-9) / 400e-9 * 240}, 100%, 50%)`;
            ctx.fillRect(x, y, canvas.width / numWavelengths, canvas.height - y);
        }

        // Draw temperature label
        ctx.fillStyle = 'white'; // 修改为白色以确保在黑色背景上可见
        ctx.font = '48px Arial';
        ctx.fillText(`${temperatures[currentTempIndex]}K`, canvas.width / 2 - 60, canvas.height / 4 + 20);
    }

    function changeTemperature() {
        currentTempIndex = (currentTempIndex + 1) % temperatures.length;
        drawBlackbodyAndSpectrum();
    }

    // 确保在每次启动演示时重新添加事件监听器
    canvas.addEventListener('touchstart', changeTemperature);

    // 强制更新画布
    function animate() {
        drawBlackbodyAndSpectrum();
        animationFrameId = requestAnimationFrame(animate);
    }

    animate(); // 启动动画

    // 在演示结束时移除事件监听器
    return () => {
        canvas.removeEventListener('touchstart', changeTemperature);
    };
}

window.startBlackbodyRadiation = startBlackbodyRadiation;