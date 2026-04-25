(() => {
  const canvas = document.getElementById("topSecurityCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isLight =
    location.pathname.includes("/light/") ||
    !!document.querySelector('link[href*="learning-portal"]');

  const theme = isLight
    ? {
        grid: "rgba(14, 165, 233, 0.045)",
        edge: "rgba(37, 99, 235, 0.13)",
        node: ["#0ea5e9", "#14b8a6", "#2563eb"],
        pulse: ["#0ea5e9", "#10b981", "#f59e0b"],
        shield: "rgba(20, 184, 166, 0.42)",
        lock: "rgba(245, 158, 11, 0.42)"
      }
    : {
        grid: "rgba(125, 211, 252, 0.06)",
        edge: "rgba(125, 211, 252, 0.17)",
        node: ["#67e8f9", "#5eead4", "#93c5fd"],
        pulse: ["#67e8f9", "#34d399", "#fbbf24"],
        shield: "rgba(94, 234, 212, 0.52)",
        lock: "rgba(251, 191, 36, 0.52)"
      };

  let width = 0;
  let height = 0;

  const layers = [5, 7, 6, 4];
  const nodes = [];
  const edges = [];

  layers.forEach((count, layerIndex) => {
    const x = 0.1 + layerIndex * 0.16;
    for (let i = 0; i < count; i++) {
      nodes.push({
        layer: layerIndex,
        index: i,
        x,
        y: 0.2 + (i / Math.max(1, count - 1)) * 0.52,
        color: theme.node[(layerIndex + i) % theme.node.length]
      });
    }
  });

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (b.layer === a.layer + 1 && Math.abs(a.index - b.index) <= 2) {
        edges.push([a, b]);
      }
    }
  }

  const pulses = Array.from({ length: 16 }, (_, i) => ({
    edge: i % edges.length,
    t: Math.random(),
    speed: 0.001 + Math.random() * 0.0012,
    color: theme.pulse[i % theme.pulse.length]
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawGrid(time) {
    const gap = Math.max(36, Math.min(58, width / 24));
    const drift = reducedMotion ? 0 : (time * 0.003) % gap;

    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;

    for (let x = -gap + drift; x < width + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = -gap + drift; y < height + gap; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawNeuralNetwork(time) {
    ctx.save();
    ctx.lineWidth = 1;

    edges.forEach(([a, b], i) => {
      const shimmer = reducedMotion ? 0 : Math.sin(time * 0.001 + i) * 0.04;
      ctx.globalAlpha = 0.42 + shimmer;
      ctx.strokeStyle = theme.edge;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    });

    nodes.forEach((node, i) => {
      const pulse = reducedMotion ? 1 : 0.85 + Math.sin(time * 0.002 + i) * 0.15;
      const x = node.x * width;
      const y = node.y * height;

      ctx.globalAlpha = 0.62;
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.16;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, 8 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawPulses() {
    pulses.forEach((pulse) => {
      if (!reducedMotion) {
        pulse.t += pulse.speed;
        if (pulse.t > 1) pulse.t = 0;
      }

      const [a, b] = edges[pulse.edge];
      const x = (a.x + (b.x - a.x) * pulse.t) * width;
      const y = (a.y + (b.y - a.y) * pulse.t) * height;

      ctx.save();
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = pulse.color;
      ctx.shadowColor = pulse.color;
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSecurityGlyphs(time) {
    const sx = width * 0.79;
    const sy = height * 0.34;
    const size = Math.min(width, height) * 0.12;

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.shield;
    ctx.fillStyle = isLight ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.18)";
    ctx.shadowColor = theme.shield;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(sx, sy - size * 0.55);
    ctx.lineTo(sx + size * 0.38, sy - size * 0.32);
    ctx.lineTo(sx + size * 0.3, sy + size * 0.26);
    ctx.quadraticCurveTo(sx, sy + size * 0.58, sx - size * 0.3, sy + size * 0.26);
    ctx.lineTo(sx - size * 0.38, sy - size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(sx - size * 0.14, sy);
    ctx.lineTo(sx - size * 0.03, sy + size * 0.12);
    ctx.lineTo(sx + size * 0.19, sy - size * 0.16);
    ctx.stroke();

    const lx = width * 0.9;
    const ly = height * 0.58;
    const lockSize = size * 0.45;

    ctx.strokeStyle = theme.lock;
    ctx.shadowColor = theme.lock;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.48;

    ctx.strokeRect(lx - lockSize * 0.42, ly - lockSize * 0.1, lockSize * 0.84, lockSize * 0.58);
    ctx.beginPath();
    ctx.arc(lx, ly - lockSize * 0.1, lockSize * 0.28, Math.PI, Math.PI * 2);
    ctx.stroke();

    const sweep = reducedMotion ? 0 : Math.sin(time * 0.002) * size * 0.16;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(sx - size * 0.58, sy + sweep);
    ctx.lineTo(sx + size * 0.58, sy + sweep);
    ctx.stroke();

    ctx.restore();
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    drawGrid(time);
    drawNeuralNetwork(time);
    drawPulses();
    drawSecurityGlyphs(time);

    if (!reducedMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
