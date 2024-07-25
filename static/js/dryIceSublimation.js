function startDryIceSublimation(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const dryIceImage = new Image();
    dryIceImage.src = 'image/dryice.heic'; // 请确保图像文件名和路径正确
    let isTouching = false;
    let droplets = [];
    let particles = [];
    let explosionStarted = false;

    const margin = 10;
    let imgWidth, imgHeight;

    document.body.style.overflow = 'hidden';

    function createParticle() {
        return {
            x: canvas.width / 2 + (Math.random() - 0.5) * 50,
            y: canvas.height - 80 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * -1 - 0.5,
            alpha: Math.random() * 0.5 + 0.5,
            lifetime: Math.random() * 3 + 2,
            angle: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 0.1
        };
    }

    function addVortexEffect(particle) {
        const vortexStrength = Math.random() * 0.05 + 0.01;
        const dx = particle.x - canvas.width / 2;
        const dy = particle.y - (canvas.height - 80);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = vortexStrength / (distance + 1);
        const forceX = -dy * force;
        const forceY = dx * force;
        particle.vx += forceX;
        particle.vy += forceY;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black'; // 设置背景为黑色
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawDryIce();

        // 绘制水滴
        ctx.font = "60px Arial"; // 确保水滴大小合适
        droplets.forEach(droplet => {
            ctx.fillText("💦", droplet.x, droplet.y);
            droplet.y += droplet.speed;
        });

        // 检查水滴是否落到干冰位置，触发爆发
        droplets = droplets.filter(droplet => {
            if (droplet.y >= canvas.height - 160 && !explosionStarted) {
                startExplosion();
                return false;
            }
            return droplet.y < canvas.height - 50;
        });

        // 绘制干冰爆发效果
        if (explosionStarted) {
            particles.forEach(particle => {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.angle);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        updateParticles();
        requestAnimationFrame(draw);
    }

    function startDroplets() {
        const dropletX = canvas.width / 2 - 40; // 调整水滴的X位置
        const dropletY = margin + imgHeight * 0.15 + 150;
        droplets.push({ x: dropletX, y: dropletY, speed: 2 });
    }

    function startExplosion() {
        explosionStarted = true;
        for (let i = 0; i < 5000; i++) {
            particles.push(createParticle());
        }
    }

    function updateParticles() {
        if (explosionStarted) {
            particles.forEach(particle => {
                addVortexEffect(particle);
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.angle += particle.angularVelocity;
                particle.alpha -= 0.005;
                particle.lifetime -= 0.02;
                if (particle.alpha <= 0 || particle.lifetime <= 0) {
                    Object.assign(particle, createParticle());
                }
            });
        }
    }

    function drawDryIce() {
        ctx.drawImage(dryIceImage, canvas.width / 2 - 250, canvas.height - 160, 500, 120);
    }

    canvas.addEventListener('touchstart', (e) => {
        if (isTouchingHandArea(e.touches[0].clientX, e.touches[0].clientY)) {
            isTouching = true;
            startDroplets();
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isTouching && isTouchingHandArea(e.touches[0].clientX, e.touches[0].clientY)) {
            startDroplets();
        }
    });

    canvas.addEventListener('touchend', () => {
        isTouching = false;
    });

    function isTouchingHandArea(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        const handXStart = canvas.width * 0.5;
        const handXEnd = canvas.width;
        const handYStart = 0;
        const handYEnd = canvas.height * 0.5;
        return canvasX >= handXStart && canvasX <= handXEnd && canvasY >= handYStart && canvasY <= handYEnd;
    }

    dryIceImage.onload = () => {
        imgWidth = canvas.width - 2 * margin;
        imgHeight = canvas.height - 2 * margin;
        draw();
    };
}

window.startDryIceSublimation = startDryIceSublimation;