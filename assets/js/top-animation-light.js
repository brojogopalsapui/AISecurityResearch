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
        grid: "rgba(37, 99, 235, 0.065)",
        mesh: "rgba(37, 99, 235, 0.15)",
        meshGlow: "rgba(14, 165, 233, 0.26)",
        coreA: "#2563eb",
        coreB: "#0ea5e9",
        coreHalo: "rgba(14, 165, 233, 0.2)",
        node: "#0f766e",
        nodeGlow: "rgba(20, 184, 166, 0.28)",
        prompt: "#e11d48",
        poison: "#f97316",
        side: "#7c3aed",
        defense: "#059669",
        defenseGlow: "rgba(16, 185, 129, 0.34)",
        chipBg: "rgba(255, 255, 255, 0.88)",
        chipBorder: "rgba(32, 58, 87, 0.12)",
        chipText: "#17304f",
        textSubtle: "rgba(23, 48, 79, 0.78)",
        veil: "rgba(255, 255, 255, 0.06)"
      }
    : {
        grid: "rgba(125, 211, 252, 0.075)",
        mesh: "rgba(125, 211, 252, 0.18)",
        meshGlow: "rgba(103, 232, 249, 0.28)",
        coreA: "#7dd3fc",
        coreB: "#60a5fa",
        coreHalo: "rgba(96, 165, 250, 0.22)",
        node: "#5eead4",
        nodeGlow: "rgba(94, 234, 212, 0.3)",
        prompt: "#fb7185",
        poison: "#fb923c",
        side: "#a78bfa",
        defense: "#4ade80",
        defenseGlow: "rgba(74, 222, 128, 0.36)",
        chipBg: "rgba(12, 22, 38, 0.82)",
        chipBorder: "rgba(225, 235, 248, 0.14)",
        chipText: "#f8fbff",
        textSubtle: "rgba(232, 242, 255, 0.78)",
        veil: "rgba(10, 20, 36, 0.08)"
      };

  let width = 0;
  let height = 0;
  let lastFrame = 0;

  let core = { x: 0, y: 0, r: 0 };
  let networkNodes = [];
  let networkEdges = [];
  let lanes = [];
  let particles = [];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function polarPoint(cx, cy, radius, angle) {
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  }

  function roundedRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function buildPathMetrics(points) {
    const segments = [];
    let total = 0;

    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, length, start: total, end: total + length });
      total += length;
    }

    return { points, segments, total: Math.max(total, 1) };
  }

  function pointOnPath(metrics, t) {
    const target = clamp(t, 0, 0.9999) * metrics.total;

    for (const segment of metrics.segments) {
      if (target <= segment.end) {
        const local = (target - segment.start) / Math.max(segment.length, 1);
        return {
          x: segment.a.x + (segment.b.x - segment.a.x) * local,
          y: segment.a.y + (segment.b.y - segment.a.y) * local
        };
      }
    }

    return metrics.points[metrics.points.length - 1];
  }

  function drawChip(x, y, text, accent) {
    const fontSize = width < 640 ? 12 : 14;
    const paddingX = 14;
    const heightPx = width < 640 ? 28 : 34;

    ctx.save();
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const chipWidth = textWidth + paddingX * 2 + 14;
    const safeX = clamp(x, 10, Math.max(10, width - chipWidth - 10));
    const safeY = clamp(y, 10, Math.max(10, height - heightPx - 10));

    roundedRectPath(safeX, safeY, chipWidth, heightPx, heightPx / 2);
    ctx.fillStyle = theme.chipBg;
    ctx.fill();
    ctx.strokeStyle = theme.chipBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(safeX + 12, safeY + heightPx / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = theme.chipText;
    ctx.textBaseline = "middle";
    ctx.fillText(text, safeX + 23, safeY + heightPx / 2 + 0.5);
    ctx.restore();
  }

  function buildScene() {
    const compact = width < 900;
    const mobile = width < 640;
    const coreX = width * (mobile ? 0.5 : compact ? 0.46 : 0.42);
    const coreY = height * (mobile ? 0.44 : compact ? 0.42 : 0.4);
    const coreR = Math.max(48, Math.min(width, height) * (mobile ? 0.12 : 0.118));

    core = { x: coreX, y: coreY, r: coreR };

    networkNodes = [];
    networkEdges = [];

    const ringSets = [
      { count: 8, radius: coreR * 0.58, offset: -0.35 },
      { count: 12, radius: coreR * 1.02, offset: 0.12 },
      { count: 10, radius: coreR * 1.52, offset: 0.55 }
    ];

    ringSets.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i += 1) {
        const angle = (Math.PI * 2 * i) / ring.count + ring.offset;
        networkNodes.push({
          x: coreX + Math.cos(angle) * ring.radius,
          y: coreY + Math.sin(angle) * ring.radius,
          ring: ringIndex,
          angle
        });
      }
    });

    const satellites = [
      { x: coreX + coreR * 2.35, y: coreY - coreR * 1.05, ring: 3 },
      { x: coreX + coreR * 2.7, y: coreY + coreR * 0.08, ring: 3 },
      { x: coreX + coreR * 2.05, y: coreY + coreR * 1.2, ring: 3 },
      { x: coreX - coreR * 2.15, y: coreY - coreR * 0.82, ring: 3 },
      { x: coreX - coreR * 2.35, y: coreY + coreR * 0.95, ring: 3 }
    ];

    satellites.forEach((node) => networkNodes.push(node));

    const ringIndexRanges = [];
    let cursor = 0;
    ringSets.forEach((ring) => {
      ringIndexRanges.push([cursor, cursor + ring.count]);
      cursor += ring.count;
    });

    ringIndexRanges.forEach(([start, end]) => {
      for (let i = start; i < end; i += 1) {
        const next = i + 1 === end ? start : i + 1;
        networkEdges.push([networkNodes[i], networkNodes[next]]);
      }
    });

    ringIndexRanges.slice(0, -1).forEach(([start, end], ringIndex) => {
      const [nextStart, nextEnd] = ringIndexRanges[ringIndex + 1];

      for (let i = start; i < end; i += 1) {
        let nearest = nextStart;
        let bestDistance = Infinity;

        for (let j = nextStart; j < nextEnd; j += 1) {
          const distance = Math.abs(networkNodes[i].angle - networkNodes[j].angle);
          if (distance < bestDistance) {
            bestDistance = distance;
            nearest = j;
          }
        }

        networkEdges.push([networkNodes[i], networkNodes[nearest]]);
      }
    });

    satellites.forEach((satellite) => {
      let nearest = 0;
      let bestDistance = Infinity;

      networkNodes.slice(0, cursor).forEach((node, index) => {
        const distance = Math.hypot(node.x - satellite.x, node.y - satellite.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = index;
        }
      });

      networkEdges.push([satellite, networkNodes[nearest]]);
    });

    const shieldRadius = coreR * 1.74;
    const promptHit = polarPoint(coreX, coreY, shieldRadius, -2.32);
    const poisonHit = polarPoint(coreX, coreY, shieldRadius, 2.28);
    const sideHit = polarPoint(coreX, coreY, shieldRadius, -0.06);

    lanes = [
      {
        key: "prompt",
        label: "Prompt attack",
        color: theme.prompt,
        chip: { x: coreX - coreR * (mobile ? 2.05 : 2.45), y: coreY - coreR * 2.12 },
        path: buildPathMetrics([
          { x: coreX - coreR * 2.95, y: coreY - coreR * 1.55 },
          { x: coreX - coreR * 2.28, y: coreY - coreR * 1.42 },
          { x: coreX - coreR * 1.86, y: coreY - coreR * 1.06 },
          { x: coreX - coreR * 1.18, y: coreY - coreR * 0.72 },
          promptHit
        ]),
        hit: promptHit,
        dash: [8, 6]
      },
      {
        key: "poison",
        label: "Poison attack",
        color: theme.poison,
        chip: { x: coreX - coreR * (mobile ? 2.02 : 2.35), y: coreY + coreR * 1.7 },
        path: buildPathMetrics([
          { x: coreX - coreR * 2.82, y: coreY + coreR * 1.4 },
          { x: coreX - coreR * 2.22, y: coreY + coreR * 1.22 },
          { x: coreX - coreR * 1.7, y: coreY + coreR * 1.04 },
          { x: coreX - coreR * 1.14, y: coreY + coreR * 0.7 },
          poisonHit
        ]),
        hit: poisonHit,
        dash: [3, 7]
      },
      {
        key: "side",
        label: "Side-channel",
        color: theme.side,
        chip: { x: coreX + coreR * 1.52, y: coreY - coreR * 1.24 },
        path: buildPathMetrics([
          { x: coreX + coreR * 2.98, y: coreY - coreR * 0.42 },
          { x: coreX + coreR * 2.52, y: coreY - coreR * 0.3 },
          { x: coreX + coreR * 2.14, y: coreY - coreR * 0.12 },
          { x: coreX + coreR * 1.58, y: coreY - coreR * 0.06 },
          sideHit
        ]),
        hit: sideHit,
        dash: [2, 5]
      }
    ];

    particles = lanes.flatMap((lane, laneIndex) => {
      const count = lane.key === "side" ? 6 : 5;
      return Array.from({ length: count }, (_, index) => ({
        laneKey: lane.key,
        laneIndex,
        progress: (index / count + Math.random() * 0.15) % 1,
        speed: 0.00012 + laneIndex * 0.000025 + Math.random() * 0.00004,
        radius: lane.key === "side" ? 2.4 : 3.2
      }));
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    buildScene();
  }

  function drawGrid(time) {
    const gap = clamp(width / 18, 34, 68);
    const drift = reducedMotion ? 0 : (time * 0.012) % gap;

    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;

    for (let x = -gap + drift; x < width + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = -gap + drift * 0.55; y < height + gap; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.48;
    for (let d = -height; d < width + height; d += gap * 1.35) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d - height * 0.55, height);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAmbient() {
    ctx.save();

    const rightGlow = ctx.createRadialGradient(
      core.x,
      core.y,
      core.r * 0.2,
      core.x,
      core.y,
      core.r * 3.8
    );
    rightGlow.addColorStop(0, theme.coreHalo);
    rightGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rightGlow;
    ctx.fillRect(0, 0, width, height);

    const veil = ctx.createLinearGradient(0, 0, width, 0);
    veil.addColorStop(0, theme.veil);
    veil.addColorStop(0.32, "rgba(255,255,255,0)");
    veil.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  function drawNetwork(time) {
    ctx.save();

    networkEdges.forEach(([a, b], index) => {
      const shimmer = reducedMotion ? 0 : Math.sin(time * 0.0012 + index * 0.48) * 0.08;
      ctx.strokeStyle = theme.mesh;
      ctx.globalAlpha = 0.32 + shimmer;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    networkNodes.forEach((node, index) => {
      const pulse = reducedMotion ? 0 : Math.sin(time * 0.002 + index * 0.6) * 1.4;
      const radius = node.ring === 3 ? 3.2 : 2.4;

      ctx.globalAlpha = 0.88;
      ctx.fillStyle = theme.node;
      ctx.shadowColor = theme.nodeGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + pulse * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = theme.node;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 3.2, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawCore(time) {
    const spin = reducedMotion ? 0 : time * 0.00045;

    ctx.save();
    ctx.translate(core.x, core.y);

    const halo = ctx.createRadialGradient(0, 0, core.r * 0.16, 0, 0, core.r * 1.5);
    halo.addColorStop(0, isLight ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.2)");
    halo.addColorStop(0.35, theme.coreB);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(0, 0, core.r * 1.58, 0, Math.PI * 2);
    ctx.fill();

    const coreGradient = ctx.createRadialGradient(-core.r * 0.22, -core.r * 0.28, core.r * 0.18, 0, 0, core.r);
    coreGradient.addColorStop(0, "#ffffff");
    coreGradient.addColorStop(0.2, theme.coreB);
    coreGradient.addColorStop(1, theme.coreA);
    ctx.fillStyle = coreGradient;
    ctx.shadowColor = theme.coreHalo;
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.arc(0, 0, core.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isLight ? "rgba(255,255,255,0.94)" : "rgba(232,242,255,0.92)";
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, core.r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([8, 9]);
    ctx.lineDashOffset = -spin * 120;
    ctx.strokeStyle = isLight ? "rgba(255,255,255,0.86)" : "rgba(125,211,252,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, core.r * 1.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([3, 8]);
    ctx.lineDashOffset = spin * 150;
    ctx.strokeStyle = theme.node;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, core.r * 1.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(18, core.r * 0.44)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI", 0, -core.r * 0.08);

    ctx.fillStyle = isLight ? "rgba(255,255,255,0.9)" : "rgba(232,242,255,0.86)";
    ctx.font = `800 ${Math.max(10, core.r * 0.16)}px "Inter", sans-serif`;
    ctx.fillText("core", 0, core.r * 0.33);

    ctx.restore();

    drawChip(core.x + core.r * 0.76, core.y - core.r * 2.06, "Neural network", theme.coreB);
  }

  function drawLane(lane, time) {
    ctx.save();
    ctx.strokeStyle = lane.color;
    ctx.lineWidth = lane.key === "side" ? 1.8 : 2.2;
    ctx.setLineDash(lane.dash);
    ctx.lineDashOffset = reducedMotion ? 0 : -time * 0.018;
    ctx.shadowColor = lane.color;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    lane.path.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 0.22;
    ctx.lineWidth = lane.key === "side" ? 6 : 8;
    ctx.beginPath();
    lane.path.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    if (lane.key === "side") {
      const baseX = lane.path.points[0].x + 8;
      const baseY = lane.path.points[0].y - core.r * 0.28;
      for (let i = 0; i < 5; i += 1) {
        const barHeight = core.r * (0.16 + i * 0.05);
        const wave = reducedMotion ? 0 : Math.sin(time * 0.006 + i * 0.8) * 8;
        ctx.fillStyle = `rgba(167, 139, 250, ${0.12 + i * 0.06})`;
        ctx.fillRect(baseX + i * 8, baseY - barHeight / 2 - wave * 0.12, 4, barHeight + wave * 0.16);
      }
    }

    ctx.restore();

    drawChip(lane.chip.x, lane.chip.y, lane.label, lane.color);
  }

  function drawParticles(dt) {
    particles.forEach((particle) => {
      const lane = lanes[particle.laneIndex];
      if (!lane) return;

      if (!reducedMotion) {
        particle.progress = (particle.progress + particle.speed * dt) % 1;
      }

      const point = pointOnPath(lane.path, particle.progress);

      ctx.save();
      ctx.globalAlpha = lane.key === "side" ? 0.72 : 0.84;
      ctx.fillStyle = lane.color;
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = lane.key === "side" ? 12 : 16;
      ctx.beginPath();
      ctx.arc(point.x, point.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawCountermeasure(time) {
    const shieldRadius = core.r * 1.74;
    const sweepStart = -Math.PI / 3 + (reducedMotion ? 0 : time * 0.0011);
    const sweepEnd = sweepStart + Math.PI * 0.55;

    ctx.save();
    ctx.strokeStyle = theme.defenseGlow;
    ctx.lineWidth = 12;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(core.x, core.y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = theme.defense;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.arc(core.x, core.y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = theme.defense;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.shadowColor = theme.defenseGlow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(core.x, core.y, shieldRadius, sweepStart, sweepEnd);
    ctx.stroke();
    ctx.shadowBlur = 0;

    lanes.forEach((lane, index) => {
      const pulse = reducedMotion ? 1 : 0.78 + Math.sin(time * 0.005 + index) * 0.18;
      ctx.fillStyle = theme.defense;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(lane.hit.x, lane.hit.y, 4.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.defense;
      ctx.beginPath();
      ctx.arc(lane.hit.x, lane.hit.y, 13 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();

    drawChip(core.x + core.r * 1.14, core.y + core.r * 1.56, "Countermeasure", theme.defense);
  }

  function drawBridgeText() {
    ctx.save();
    ctx.fillStyle = theme.textSubtle;
    ctx.font = `800 ${width < 640 ? 12 : 14}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = "center";
    const bridgeText = width < 640
      ? "defense filters attack paths"
      : "defense filters attack paths before they reach the model";
    ctx.fillText(bridgeText, core.x + core.r * 0.72, core.y + core.r * 2.1);
    ctx.restore();
  }

  function renderFrame(time = 0) {
    const dt = Math.min(32, time - lastFrame || 16);
    lastFrame = time;

    ctx.clearRect(0, 0, width, height);
    drawGrid(time);
    drawAmbient();
    drawNetwork(time);
    lanes.forEach((lane) => drawLane(lane, time));
    drawParticles(dt);
    drawCountermeasure(time);
    drawCore(time);
    drawBridgeText();

    if (!reducedMotion) {
      window.requestAnimationFrame(renderFrame);
    }
  }

  resize();
  window.addEventListener("resize", resize);

  if (reducedMotion) {
    renderFrame(0);
  } else {
    window.requestAnimationFrame(renderFrame);
  }
})();
