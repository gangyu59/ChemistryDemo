function startMagneticField(canvas, ctx, clearCanvasAndStop) {
    clearCanvasAndStop();

    let northPole = { x: canvas.width / 4, y: canvas.height / 2 };
    let southPole = { x: 3 * canvas.width / 4, y: canvas.height / 2 };
    let draggingPole = null;

    const ironFilings = [];
    const numFilings = 10000; // 增加铁屑的数量

    // 初始化铁屑点
    for (let i = 0; i < numFilings; i++) {
        ironFilings.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            angle: 0 // 添加角度属性
        });
    }

    function calculateForce(x, y, pole, isAttract) {
        const dx = x - pole.x;
        const dy = y - pole.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceMagnitude = isAttract ? 1000 / (distance * distance) : -1000 / (distance * distance);
        return {
            fx: forceMagnitude * (dx / distance),
            fy: forceMagnitude * (dy / distance)
        };
    }

    function updateIronFilings() {
        for (let i = 0; i < ironFilings.length; i++) {
            let { x, y } = ironFilings[i];

            let forceN = calculateForce(x, y, northPole, false); // N极排斥
            let forceS = calculateForce(x, y, southPole, true);  // S极吸引

            let fx = forceN.fx + forceS.fx;
            let fy = forceN.fy + forceS.fy;

            ironFilings[i].x += fx;
            ironFilings[i].y += fy;

            // 计算铁屑的角度
            ironFilings[i].angle = Math.atan2(fy, fx);

            if (ironFilings[i].x < 0) ironFilings[i].x = 0;
            if (ironFilings[i].x > canvas.width) ironFilings[i].x = canvas.width;
            if (ironFilings[i].y < 0) ironFilings[i].y = 0;
            if (ironFilings[i].y > canvas.height) ironFilings[i].y = canvas.height;
        }
    }

    function drawFieldLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw iron filings
        for (let i = 0; i < ironFilings.length; i++) {
            ctx.fillStyle = 'black';
            ctx.save();
            ctx.translate(ironFilings[i].x, ironFilings[i].y);
            ctx.rotate(ironFilings[i].angle);
            ctx.beginPath();
            ctx.moveTo(-2, -5);
            ctx.lineTo(2, -5);
            ctx.lineTo(2, 5);
            ctx.lineTo(-2, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Draw poles as rounded rectangles
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(northPole.x - 50, northPole.y - 30);
        ctx.lineTo(northPole.x + 50, northPole.y - 30);
        ctx.quadraticCurveTo(northPole.x + 70, northPole.y, northPole.x + 50, northPole.y + 30);
        ctx.lineTo(northPole.x - 50, northPole.y + 30);
        ctx.quadraticCurveTo(northPole.x - 70, northPole.y, northPole.x - 50, northPole.y - 30);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('N', northPole.x - 10, northPole.y + 10);

        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(southPole.x - 50, southPole.y - 30);
        ctx.lineTo(southPole.x + 50, southPole.y - 30);
        ctx.quadraticCurveTo(southPole.x + 70, southPole.y, southPole.x + 50, southPole.y + 30);
        ctx.lineTo(southPole.x - 50, southPole.y + 30);
        ctx.quadraticCurveTo(southPole.x - 70, southPole.y, southPole.x - 50, southPole.y - 30);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('S', southPole.x - 10, southPole.y + 10);

        updateIronFilings();
        requestAnimationFrame(drawFieldLines);
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (Math.hypot(pos.x - northPole.x, pos.y - northPole.y) < 50) {
            draggingPole = northPole;
        } else if (Math.hypot(pos.x - southPole.x, pos.y - southPole.y) < 50) {
            draggingPole = southPole;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (draggingPole) {
            const pos = getMousePos(e);
            draggingPole.x = pos.x;
            draggingPole.y = pos.y;
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggingPole = null;
    });

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        if (Math.hypot(pos.x - northPole.x, pos.y - northPole.y) < 50) {
            draggingPole = northPole;
        } else if (Math.hypot(pos.x - southPole.x, pos.y - southPole.y) < 50) {
            draggingPole = southPole;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (draggingPole) {
            const touch = e.touches[0];
            const pos = getMousePos(touch);
            draggingPole.x = pos.x;
            draggingPole.y = pos.y;
        }
    });

    canvas.addEventListener('touchend', () => {
        draggingPole = null;
    });

    document.body.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, { passive: false });

    drawFieldLines();
}

window.startMagneticField = startMagneticField;