(() => {
  const canvas = document.getElementById("topSecurityCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const theme = {
    grid: "rgba(125, 211, 252, 0.07)",
    edge: "rgba(125, 211, 252, 0.18)",
    node: ["#67e8f9", "#5eead4", "#93c5fd", "#fbbf24"],
    pulse: ["#67e8f9", "#34d399", "#fbbf24", "#c084fc"],
    sweep: "rgba(83, 229, 246, 0.16)",
    shield: "rgba(94, 234, 212, 0.56)",
    lock: "rgba(251, 191, 36, 0.54)",
    ring: "rgba(91, 140, 255, 0.24)",
    particle: "rgba(226, 242, 255, 0.5)"
  };

  let width = 0;
  let height = 0;

  const pointer = { x: 0.8, y: 0.34 };
  const layers = [6, 8, 7, 5];
  const nodes = [];
  const edges = [];
  const particles = Array.from({ length: 32 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speedX: 0.00008 + Math.random() * 0.0002,
    speedY: (Math.random() - 0.5) * 0.00015,
    size: 0.8 + Math.random() * 1.8
  }));

  layers.forEach((count, layerIndex) => {
    const x = 0.08 + layerIndex * 0.18;

    for (let i = 0; i < count; i += 1) {
      const baseY = 0.2 + (i / Math.max(1, count - 1)) * 0.52;
      nodes.push({
        layer: layerIndex,
        index: i,
        x,
        y: baseY,
        baseY,
        color: theme.node[(layerIndex + i) % theme.node.length],
        phase: Math.random() * Math.PI * 2
      });
    }
  });

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = 0; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];

      if (b.layer === a.layer + 1 && Math.abs(a.index - b.index) <= 2) {
        edges.push([a, b]);
      }
    }
  }

  const pulses = Array.from({ length: 22 }, (_, i) => ({
    edge: i % edges.length,
    t: Math.random(),
    speed: 0.0011 + Math.random() * 0.0014,
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

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    pointer.y = Math.min(1, Math.max(0, (clientY - rect.top) / Math.max(1, rect.height)));
  }

  function drawGrid(time) {
    const gap = Math.max(34, Math.min(62, width / 22));
    const drift = reducedMotion ? 0 : (time * 0.006) % gap;

    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;

    for (let x = -gap + drift; x < width + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.08, height);
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

  function drawParticles() {
    ctx.save();

    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > 1.08) particle.x = -0.08;
        if (particle.y > 1.05) particle.y = -0.05;
        if (particle.y < -0.05) particle.y = 1.05;
      }

      ctx.fillStyle = theme.particle;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(particle.x * width, particle.y * height, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawNeuralNetwork(time) {
    ctx.save();
    ctx.lineWidth = 1;

    edges.forEach(([a, b], i) => {
      const shimmer = reducedMotion ? 0 : Math.sin(time * 0.0012 + i) * 0.07;
      ctx.globalAlpha = 0.32 + shimmer;
      ctx.strokeStyle = theme.edge;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.bezierCurveTo(
        a.x * width + width * 0.03,
        a.y * height,
        b.x * width - width * 0.04,
        b.y * height,
        b.x * width,
        b.y * height
      );
      ctx.stroke();
    });

    nodes.forEach((node, i) => {
      const pulse = reducedMotion ? 1 : 0.86 + Math.sin(time * 0.0022 + i) * 0.18;
      const x = (node.x + Math.sin(time * 0.00065 + node.phase) * 0.004) * width;
      const y = (node.baseY + Math.cos(time * 0.001 + node.phase) * 0.01) * height;
      node.y = y / height;

      ctx.globalAlpha = 0.62;
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, 2.4 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.18;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, 9 * pulse, 0, Math.PI * 2);
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
      ctx.globalAlpha = 0.66;
      ctx.fillStyle = pulse.color;
      ctx.shadowColor = pulse.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawThreatRings(time) {
    const cx = width * (0.78 + (pointer.x - 0.78) * 0.08);
    const cy = height * (0.35 + (pointer.y - 0.35) * 0.08);
    const baseRadius = Math.min(width, height) * 0.11;

    ctx.save();
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 3; i += 1) {
      const growth = reducedMotion ? i * 11 : ((time * 0.04 + i * 26) % 58);
      const radius = baseRadius + growth;
      ctx.globalAlpha = Math.max(0.06, 0.26 - i * 0.06);
      ctx.strokeStyle = theme.ring;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI * 0.2, Math.PI * 1.2);
      ctx.stroke();
    }

    ctx.strokeStyle = theme.sweep;
    ctx.globalAlpha = 0.36;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      baseRadius * 1.55,
      -Math.PI * 0.45 + Math.sin(time * 0.0012) * 0.35,
      -Math.PI * 0.08 + Math.sin(time * 0.0012) * 0.35
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawTelemetryBands(time) {
    const lanes = [0.22, 0.46, 0.7];

    ctx.save();
    ctx.lineWidth = 1;

    lanes.forEach((lane, index) => {
      const offset = reducedMotion ? 0 : Math.sin(time * 0.0011 + index) * 10;
      const gradient = ctx.createLinearGradient(width * 0.5, 0, width, 0);
      gradient.addColorStop(0, "rgba(83, 229, 246, 0)");
      gradient.addColorStop(0.45, "rgba(83, 229, 246, 0.16)");
      gradient.addColorStop(1, "rgba(255, 200, 109, 0.2)");
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = 0.48;
      ctx.beginPath();
      ctx.moveTo(width * 0.48, height * lane);
      ctx.bezierCurveTo(
        width * 0.62,
        height * lane - 18 + offset,
        width * 0.76,
        height * lane + 12 - offset,
        width * 0.94,
        height * lane + 6
      );
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawSecurityGlyphs(time) {
    const sx = width * 0.79;
    const sy = height * 0.34;
    const size = Math.min(width, height) * 0.12;

    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = theme.shield;
    ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
    ctx.shadowColor = theme.shield;
    ctx.shadowBlur = 16;

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

    const sweep = reducedMotion ? 0 : Math.sin(time * 0.0024) * size * 0.16;
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
    drawParticles();
    drawNeuralNetwork(time);
    drawPulses();
    drawTelemetryBands(time);
    drawThreatRings(time);
    drawSecurityGlyphs(time);

    if (!reducedMotion) requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
