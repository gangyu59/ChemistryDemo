function startStaticElectricity(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();
    const glassTubeImage = new Image();
    glassTubeImage.src = 'image/glasstube.heic';
    let particles = [];
    let isRubbing = false;
    let attractInterval, releaseInterval;

    document.body.style.overflow = 'hidden';

    function initParticles() {
        particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
								x: canvas.width / 4 + Math.random() * (canvas.width / 2),
                y: canvas.height - 20,
                vy: 0,
                vx: 0,
                alpha: 1,
                size: 10,
                state: 'ground'
            });
        }
    }

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(glassTubeImage, (canvas.width - glassTubeImage.width * 2) / 2, (canvas.height - glassTubeImage.height * 2) / 2, glassTubeImage.width * 2, glassTubeImage.height * 2);
        drawParticles();
        updateParticles();
        requestAnimationFrame(draw);
    }

    function drawParticles() {
        particles.forEach(particle => {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
    }

    function attractParticlesToGlassTube() {
        particles.forEach(particle => {
            if (particle.state === 'ground') {
                const dx = (canvas.width / 2) - particle.x;
                const dy = (canvas.height / 2) - particle.y;
                particle.vx = dx * 0.05 * (Math.random() + 0.5);
                particle.vy = dy * 0.05 * (Math.random() + 0.5);
                particle.state = 'rising';
            }
        });
    }

    function updateParticles() {
        particles.forEach(particle => {
            if (particle.state === 'rising') {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha = Math.min(1, particle.alpha + 0.05);

                // 检查是否在玻璃棒的对角线区域内
                const yDiagonal = canvas.height - particle.x * (canvas.height / canvas.width);
                if (particle.x >= 0 && particle.x <= canvas.width &&
                    particle.y >= yDiagonal - glassTubeImage.height - 120 && particle.y <= yDiagonal + glassTubeImage.height - 120) {
                    particle.state = 'attracted';
                    particle.vx = 0;
                    particle.vy = 0;
                }
            } else if (particle.state === 'falling') {
                particle.vy += 0.05;
                particle.y += particle.vy;
                particle.alpha = Math.max(0, particle.alpha - 0.01);
                if (particle.y >= canvas.height - 20) {
                    particle.y = canvas.height - 20;
                    particle.state = 'ground';
                    particle.alpha = 1;
                    particle.vy = 0;
                }
            }
        });
    }

    function releaseParticles() {
        particles.forEach(particle => {
            if (particle.state === 'attracted') {
                particle.state = 'falling';
                particle.vy = 0;
            }
        });
    }

    canvas.addEventListener('touchstart', (e) => {
        if (isTouchingGlassTube(e.touches[0].clientX, e.touches[0].clientY)) {
            isRubbing = true;
            clearInterval(releaseInterval);
            attractInterval = setInterval(() => {
                attractParticlesToGlassTube();
                updateParticles();
            }, 50);
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isRubbing) {
            attractParticlesToGlassTube();
        }
    });

    canvas.addEventListener('touchend', () => {
        isRubbing = false;
        clearInterval(attractInterval);
        releaseInterval = setInterval(() => {
            releaseParticles();
            updateParticles();
        }, 50);
    });

    function isTouchingGlassTube(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        const imgX = (canvas.width - glassTubeImage.width * 2) / 2;
        const imgY = (canvas.height - glassTubeImage.height * 2) / 2;
        return canvasX >= imgX && canvasX <= imgX + glassTubeImage.width * 2 && canvasY >= imgY && canvasY <= imgY + glassTubeImage.height * 2;
    }

    glassTubeImage.onload = () => {
        initParticles();
        draw();
    };
}

window.startStaticElectricity = startStaticElectricity;