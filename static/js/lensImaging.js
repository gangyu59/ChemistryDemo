function startLensImaging(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    const image = new Image();
    image.src = 'image/horse.heic'; // 更新为你的本地图像路径

    let dragging = false;
    let objectPosition = 100; // 初始物体位置
    const focalLength = 150; // 焦距F
    const P = 2 * focalLength; // P=2F

    function calculateImagePosition(objectDistance) {
        return (focalLength * objectDistance) / (objectDistance - focalLength);
    }

    function calculateImageSize(objectDistance, objectSize) {
        return (calculateImagePosition(objectDistance) / objectDistance) * objectSize;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw horizontal axis
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Draw convex lens
        ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 100);
        ctx.quadraticCurveTo(canvas.width / 2 + 20, canvas.height / 2, canvas.width / 2, canvas.height / 2 + 100);
        ctx.quadraticCurveTo(canvas.width / 2 - 20, canvas.height / 2, canvas.width / 2, canvas.height / 2 - 100);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw object
        ctx.drawImage(image, objectPosition - 50, canvas.height / 2 - 100, 100, 100);

        const objectDistance = canvas.width / 2 - objectPosition;
        const imageDistance = calculateImagePosition(objectDistance);
        const imageSize = calculateImageSize(objectDistance, 100);
        
        // Determine image properties
        let imageX = canvas.width / 2 + imageDistance;
        let isReal = imageDistance > 0;
        let isInverted = objectDistance > focalLength;
        let drawImageSize = Math.abs(imageSize);

        // Draw rays
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(objectPosition, canvas.height / 2 - 50);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 - 50);
        if (isReal) {
            ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        } else {
            ctx.lineTo(canvas.width, canvas.height / 2 - 50);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(objectPosition, canvas.height / 2 - 100);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        if (isReal) {
            ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        } else {
            ctx.lineTo(canvas.width, canvas.height / 2 - 50);
        }
        ctx.stroke();

        // Draw image
        ctx.save();
        ctx.translate(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        if (isInverted) {
            ctx.scale(1, -1);
        }
        if (!isReal) {
            ctx.globalAlpha = 0.5;
        }
        ctx.drawImage(image, -drawImageSize / 2, -drawImageSize / 2, drawImageSize, drawImageSize);
        ctx.restore();

        // Draw guide lines
        ctx.strokeStyle = 'rgba(0, 128, 0)';
				ctx.lineWidth = 4; // 增加线宽
        ctx.beginPath();
        ctx.moveTo(objectPosition, canvas.height / 2);
        ctx.lineTo(objectPosition, canvas.height / 2 - 100);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(imageX, canvas.height / 2);
        ctx.lineTo(imageX, canvas.height / 2 + (isInverted ? drawImageSize / 2 : -drawImageSize / 2));
        ctx.stroke();

        animationFrameId = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.offsetX >= objectPosition - 50 && e.offsetX <= objectPosition + 50 &&
            e.offsetY >= canvas.height / 2 - 100 && e.offsetY <= canvas.height / 2) {
            dragging = true;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (dragging) {
            objectPosition = e.offsetX;
        }
    });

    canvas.addEventListener('mouseup', () => {
        dragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        dragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (touch.clientX >= objectPosition - 50 && touch.clientX <= objectPosition + 50 &&
            touch.clientY >= canvas.height / 2 - 100 && touch.clientY <= canvas.height / 2) {
            dragging = true;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (dragging) {
            const touch = e.touches[0];
            objectPosition = touch.clientX;
        }
    });

    canvas.addEventListener('touchend', () => {
        dragging = false;
    });

    document.body.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, { passive: false });

    draw();
}

window.startLensImaging = startLensImaging;