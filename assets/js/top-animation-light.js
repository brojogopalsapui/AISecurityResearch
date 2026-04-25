(() => {
  const canvas = document.getElementById("topSecurityCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = ["#0ea5e9", "#14b8a6", "#2563eb", "#f59e0b", "#10b981"];

  let width = 0;
  let height = 0;

  const nodes = Array.from({ length: 54 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1.1 + Math.random() * 2.4,
    vx: -0.0002 + Math.random() * 0.0004,
    vy: -0.00016 + Math.random() * 0.00032,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const packets = Array.from({ length: 20 }, (_, i) => ({
    t: Math.random(),
    lane: i % 5,
    speed: 0.001 + Math.random() * 0.0014,
    color: colors[i % colors.length]
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
    const gap = Math.max(32, Math.min(52, width / 26));
    const drift = reducedMotion ? 0 : (time * 0.004) % gap;

    ctx.save();
    ctx.strokeStyle = "rgba(14, 165, 233, 0.055)";
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

  function drawNetwork(time) {
    nodes.forEach((node) => {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -0.04) node.x = 1.04;
        if (node.x > 1.04) node.x = -0.04;
        if (node.y < -0.04) node.y = 1.04;
        if (node.y > 1.04) node.y = -0.04;
      }
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = (a.x - b.x) * width;
        const dy = (a.y - b.y) * height;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 140) {
          ctx.save();
          ctx.globalAlpha = (1 - distance / 140) * 0.18;
          ctx.strokeStyle = a.color;
          ctx.beginPath();
          ctx.moveTo(a.x * width, a.y * height);
          ctx.lineTo(b.x * width, b.y * height);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    nodes.forEach((node) => {
      const pulse = reducedMotion ? 1 : 0.78 + Math.sin(time * 0.002 + node.x * 9) * 0.22;

      ctx.save();
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(node.x * width, node.y * height, node.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPackets() {
    const startX = width * 0.06;
    const endX = width * 0.94;
    const baseY = height * 0.68;

    packets.forEach((packet) => {
      if (!reducedMotion) {
        packet.t += packet.speed;
        if (packet.t > 1) packet.t = 0;
      }

      const laneOffset = (packet.lane - 2) * 18;
      const x = startX + (endX - startX) * packet.t;
      const y = baseY + laneOffset - Math.sin(packet.t * Math.PI) * height * 0.24;

      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = packet.color;
      ctx.shadowColor = packet.color;
      ctx.shadowBlur = 12;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x - 7, y - 3, 14, 6, 3);
        ctx.fill();
      } else {
        ctx.fillRect(x - 7, y - 3, 14, 6);
      }

      ctx.restore();
    });
  }

  function drawRing(x, y, radius, color, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.42;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    const sweep = reducedMotion ? 0 : time * 0.0012;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, sweep, sweep + Math.PI * 1.25);
    ctx.stroke();

    ctx.restore();
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);

    drawGrid(time);
    drawNetwork(time);
    drawPackets();
    drawRing(width * 0.16, height * 0.28, Math.min(42, width * 0.035), "#0ea5e9", time);
    drawRing(width * 0.82, height * 0.34, Math.min(48, width * 0.04), "#14b8a6", time + 900);

    if (!reducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
