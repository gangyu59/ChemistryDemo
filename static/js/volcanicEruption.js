function startVolcanicEruption(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();
    // Volcanic Eruption logic here
    // Example: Simulate volcanic eruption using particles
    const particles = [];
    const numParticles = 1000;

    const volcanoImage = new Image();
    volcanoImage.src = 'image/volcano.jpeg'; // 更新为你的本地图像路径

    volcanoImage.onload = () => {
        function createParticle() {
            return {
                x: canvas.width / 2 + 20,
                y: canvas.height - volcanoImage.height / 2 + 250,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * -50 - 0,
                alpha: 1
            };
        }

        for (let i = 0; i < numParticles; i++) {
            particles.push(createParticle());
        }

        function drawParticles() {
            // Draw background
            ctx.fillStyle = '#000080'; // 深蓝色背景
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw volcano image
            ctx.drawImage(volcanoImage, canvas.width / 2 - volcanoImage.width / 2, canvas.height - volcanoImage.height + 500);

            particles.forEach(particle => {
                ctx.fillStyle = `rgba(255, 69, 0, ${particle.alpha})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function updateParticles() {
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 0.01;
                if (particle.alpha <= 0) {
                    Object.assign(particle, createParticle());
                }
            });
        }

        function animate() {
						clearCanvasAndStop();
            drawParticles();
            updateParticles();
            animationFrameId = requestAnimationFrame(animate);
        }
				clearCanvasAndStop();
        animate();
    };
}

window.startVolcanicEruption = startVolcanicEruption;