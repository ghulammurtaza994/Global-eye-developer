/**
 * Global Eye Developer — Canvas FX engine
 * Renders a subtle ambient starfield and exposes window.GED_FX.addBurst(x, y)
 * so other scripts (starlight.js) can trigger the "shooting star" explosion
 * on the same canvas/render loop without fighting over clearRect calls.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("fx-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, dpr;
  let ambient = [];
  let bursts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedAmbient() {
    const count = Math.min(70, Math.floor((width * height) / 22000));
    ambient = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.06,
      driftY: (Math.random() - 0.5) * 0.06,
      hue: Math.random() > 0.5 ? "180, 234, 255" : "150, 130, 255",
    }));
  }

  function drawAmbient(t) {
    ambient.forEach((p) => {
      p.x += p.driftX;
      p.y += p.driftY;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const alpha = p.baseAlpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${Math.max(alpha, 0)})`;
      ctx.fill();
    });
  }

  /**
   * Public API: spawn a "starlight / shooting stars" burst at (x, y).
   * White + electric-blue sparks radiate outward and fade, with a couple
   * of longer "streak" particles to sell the shooting-star feel.
   */
  function addBurst(x, y) {
    if (prefersReducedMotion) return;

    const sparkCount = 22;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.3;
      const speed = Math.random() * 3.2 + 1.4;
      const isStreak = i % 5 === 0;
      bursts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.02 + 0.018,
        size: isStreak ? Math.random() * 1.2 + 1.6 : Math.random() * 1.6 + 0.6,
        streak: isStreak,
        color: Math.random() > 0.45 ? "0, 234, 255" : "255, 255, 255",
      });
    }
    // Small central flash
    bursts.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.06, size: 18, flash: true,
      color: "255, 255, 255",
    });
  }

  function drawBursts() {
    bursts = bursts.filter((p) => p.life > 0);
    bursts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;

      const alpha = Math.max(p.life, 0);

      if (p.flash) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * alpha);
        grad.addColorStop(0, `rgba(${p.color}, ${alpha * 0.5})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${p.color}, ${alpha})`;

      if (p.streak) {
        ctx.strokeStyle = `rgba(${p.color}, ${alpha})`;
        ctx.lineWidth = p.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function loop(t) {
    ctx.clearRect(0, 0, width, height);
    drawAmbient(t || 0);
    drawBursts();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resize();
    seedAmbient();
  });

  resize();
  seedAmbient();
  requestAnimationFrame(loop);

  window.GED_FX = { addBurst };
})();
