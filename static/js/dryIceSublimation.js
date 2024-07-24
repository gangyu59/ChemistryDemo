function startDryIceSublimation(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();
    // Load dry ice image
    const dryIceImage = new Image();
    dryIceImage.src = 'image/dryice.heic'; // 请确保图像文件名和路径正确

    const particles = [];
    const numParticles = 5000;

    function createParticle() {
        return {
            x: canvas.width / 2 + (Math.random() - 0.5) * 50,
            y: canvas.height - 80 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.1, // 横向扩散速度减慢
            vy: Math.random() * -0.1 - 0.05, // 纵向扩散速度减慢
            alpha: Math.random() * 0.5 + 0.5, // 初始透明度
            lifetime: Math.random() * 2 + 2, // 粒子的生命周期
            angle: Math.random() * Math.PI * 2, // 初始角度
            angularVelocity: (Math.random() - 0.5) * 0.02 // 角速度
        };
    }

    function addVortexEffect(particle) {
        const vortexStrength = 0.01;
        const dx = particle.x - canvas.width / 2;
        const dy = particle.y - (canvas.height - 80);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = vortexStrength / (distance + 1); // 防止距离为0
        const forceX = -dy * force;
        const forceY = dx * force;
        particle.vx += forceX;
        particle.vy += forceY;
    }

    for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle());
    }

    function drawParticles() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.angle);
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`; // 使用白色的雾气效果
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2); // 粒子更小
            ctx.fill();
            ctx.restore();
        });
    }

    function updateParticles() {
        particles.forEach(particle => {
            addVortexEffect(particle);
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.angle += particle.angularVelocity; // 更新角度
            particle.alpha -= 0.002; // 消失速度减慢
            particle.lifetime -= 0.01;
            if (particle.alpha <= 0 || particle.lifetime <= 0) {
                Object.assign(particle, createParticle());
            }
        });
    }

    function drawDryIce() {
        ctx.drawImage(dryIceImage, canvas.width / 2 - 250, canvas.height - 160, 500, 120); // 图像更大，更扁平
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black'; // 设置背景为黑色
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawDryIce();
        drawParticles();
        updateParticles();
        animationFrameId = requestAnimationFrame(animate);
    }

    dryIceImage.onload = function() {
        animate();
    };
}
window.startDryIceSublimation = startDryIceSublimation;