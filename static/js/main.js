document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    let currentAnimation = null;
    let animationFrameId = null;
    let timeoutId = null;

    function clearCurrentAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    document.getElementById('showLensImaging').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startLensImaging === 'function') {
            startLensImaging(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showMagneticField').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startMagneticField === 'function') {
            startMagneticField(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showStaticElectricity').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startStaticElectricity === 'function') {
            startStaticElectricity(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showHeatConduction').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startHeatConduction === 'function') {
            startHeatConduction(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showConvection').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startConvection === 'function') {
            startConvection(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showColorChangeReaction').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startColorChangeReaction === 'function') {
            startColorChangeReaction(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showVolcanicEruption').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startVolcanicEruption === 'function') {
            startVolcanicEruption(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showDryIceSublimation').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startDryIceSublimation === 'function') {
            startDryIceSublimation(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showLightPolarization').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startLightPolarization === 'function') {
            startLightPolarization(canvas, ctx, clearCurrentAnimation);
        }
    });

    document.getElementById('showBlackbodyRadiation').addEventListener('click', function () {
        clearCurrentAnimation();
        if (typeof startBlackbodyRadiation === 'function') {
            startBlackbodyRadiation(canvas, ctx, clearCurrentAnimation);
        }
    });
});