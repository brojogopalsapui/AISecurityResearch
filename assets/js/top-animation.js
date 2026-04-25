(() => {
  const canvas = document.getElementById("topSecurityCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = ["#0ea5e9", "#14b8a6", "#2563eb", "#f59e0b", "#10b981"];

  let width = 0;
  let height = 0;

  const nodes = Array.from({ length: 58 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1.2 + Math.random() * 2.8,
    vx: -0.00022 + Math.random() * 0.00044,
    vy: -0.00018 + Math.random() * 0.00036,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const packets = Array.from({ length: 22 }, (_, i) => ({
    t: Math.random(),
    lane: i % 6,
    speed: 0.0012 + Math.random() * 0.0016,
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
    const gap = Math.max(30, Math.min(48, width / 28));
    const drift = reducedMotion ? 0 : (time * 0.006) % gap;

    ctx.save();
    ctx.strokeStyle = "rgba(37, 99, 235, 0.075)";
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

        if (distance < 145) {
          ctx.save();
          ctx.globalAlpha = (1 - distance / 145) * 0.22;
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
      const pulse = reducedMotion ? 1 : 0.75 + Math.sin(time * 0.002 + node.x * 9) * 0.25;

      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(node.x * width, node.y * height, node.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPackets() {
    const startX = width * 0.05;
    const endX = width * 0.95;
    const baseY = height * 0.68;

    packets.forEach((packet) => {
      if (!reducedMotion) {
        packet.t += packet.speed;
        if (packet.t > 1) packet.t = 0;
      }

      const laneOffset = (packet.lane - 2.5) * 18;
      const x = startX + (endX - startX) * packet.t;
      const y = baseY + laneOffset - Math.sin(packet.t * Math.PI) * height * 0.28;

      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.fillStyle = packet.color;
      ctx.shadowColor = packet.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(x - 7, y - 3, 14, 6, 3);
      ctx.fill();
      ctx.restore();
    });
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);

    drawGrid(time);
    drawNetwork(time);
    drawPackets();

    if (!reducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
