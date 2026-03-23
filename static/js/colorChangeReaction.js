function startColorChangeReaction(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const beakerImage = new Image();
    beakerImage.src = 'image/beaker.heic'; // 请确保路径正确

    let isTouchingHand = false;
    let colorPhase = 0;
    let currentColor = `hsl(${colorPhase}, 100%, 50%)`; // 初始颜色
    let droplets = [];

    const margin = 10;
    let imgWidth, imgHeight;


    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        imgWidth = canvas.width - 2 * margin;
        imgHeight = canvas.height - 2 * margin;
        ctx.drawImage(beakerImage, margin, margin, imgWidth, imgHeight);

        // 绘制水滴
        ctx.font = "60px Arial"; // 放大水滴三倍
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        droplets.forEach(droplet => {
            ctx.fillText("💧", droplet.x, droplet.y);
            droplet.y += droplet.speed;
        });

        // 移除超出边界的水滴
        droplets = droplets.filter(droplet => droplet.y < canvas.height - 50);

        // 绘制烧杯中的颜色变化
        ctx.fillStyle = currentColor;
        ctx.fillRect(margin + imgWidth * 0.047, margin + imgHeight * 0.66, imgWidth * 0.4, imgHeight * 0.335); // 根据实际图像调整位置和大小

        requestAnimationFrame(draw);
    }

    function startDroplets() {
        const dropletX = margin + imgWidth * 0.55 - 280; // 调整落点位置向左移动100
        const dropletY = margin + imgHeight * 0.15 + 150; // 根据实际图像调整位置
        droplets.push({ x: dropletX, y: dropletY, speed: 2 });
    }

    function changeColor() {
        colorPhase = (colorPhase + 3) % 360;
        currentColor = `hsl(${colorPhase}, 100%, 50%)`;
    }

    canvas.addEventListener('touchstart', (e) => {
        if (isTouchingHandArea(e.touches[0].clientX, e.touches[0].clientY)) {
            isTouchingHand = true;
            startDroplets();
            changeColor();
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isTouchingHand && isTouchingHandArea(e.touches[0].clientX, e.touches[0].clientY)) {
            startDroplets();
            changeColor();
        }
    });

    canvas.addEventListener('touchend', () => {
        isTouchingHand = false;
    });

    function isTouchingHandArea(x, y) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (x - rect.left) * scaleX;
        const canvasY = (y - rect.top) * scaleY;
        return canvasX >= canvas.width * 0.5 && canvasX <= canvas.width &&
               canvasY >= 0 && canvasY <= canvas.height * 0.5;
    }

    beakerImage.onload = () => {
        draw();
    };
}

window.startColorChangeReaction = startColorChangeReaction;