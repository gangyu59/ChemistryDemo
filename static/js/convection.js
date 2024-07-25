function startConvection(canvas, ctx, clearCanvasAndStop) {
    // 局部变量
    let animationFrameId;

    // 修改 clearCanvasAndStop 函数以停止动画
    clearCanvasAndStop = function() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    clearCanvasAndStop(); // 停止其他动画并清理画布

    const particles = [];
    const numParticles = 400;

    function createParticle(x, y) {
        return {
            x: x,
            y: y,
            vy: Math.random() * 3 - 1.5, // 粒子初始随机向上或向下运动
            alpha: 2
        };
    }

    for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    function drawParticles() {
        ctx.fillStyle = 'rgba(0, 0, 128, 1)';  // 深蓝色背景
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;  // 白色粒子
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function updateParticles() {
        particles.forEach(particle => {
            particle.y += particle.vy;

            // 当粒子到达顶部或底部时反转方向，模拟对流循环
            if (particle.y < 0) {
                particle.y = 0;
                particle.vy *= -1;
            } else if (particle.y > canvas.height) {
                particle.y = canvas.height;
                particle.vy *= -1;
            }
        });
    }

    function animate() {
        clearCanvasAndStop();
        drawParticles();
        updateParticles();
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

window.startConvection = startConvection;