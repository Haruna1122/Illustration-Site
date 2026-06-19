(() => {
  const root = document.querySelector('[data-atmosphere]');
  if (!root) return;

  const smokeCanvas = root.querySelector('[data-atmosphere-smoke]');
  const particleCanvas = root.querySelector('[data-atmosphere-particles]');
  if (!smokeCanvas || !particleCanvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smokeCtx = smokeCanvas.getContext('2d', { alpha: true });
  const particleCtx = particleCanvas.getContext('2d', { alpha: true });
  if (!smokeCtx || !particleCtx) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const rand = (min, max) => min + Math.random() * (max - min);
  const choose = (items) => items[Math.floor(Math.random() * items.length)];

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    smokeScale: 0.36,
    clouds: [],
    wisps: [],
    particles: [],
    lensBubbles: [],
    mouse: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false },
    lastTime: performance.now(),
    lastSmokeDraw: 0,
    lastParticleDraw: 0,
    smokeFps: reduceMotion ? 9 : 20,
    particleFps: reduceMotion ? 10 : 24,
    frame: 0,
  };

  const palettes = [
    { r: 255, g: 222, b: 246 },
    { r: 255, g: 126, b: 175 },
    { r: 171, g: 140, b: 255 },
    { r: 103, g: 233, b: 227 },
    { r: 255, g: 241, b: 210 },
  ];

  function resize() {
    state.width = Math.max(1, window.innerWidth);
    state.height = Math.max(1, window.innerHeight);
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.12);

    const smokeDpr = state.dpr * state.smokeScale;
    smokeCanvas.width = Math.floor(state.width * smokeDpr);
    smokeCanvas.height = Math.floor(state.height * smokeDpr);
    smokeCanvas.style.width = `${state.width}px`;
    smokeCanvas.style.height = `${state.height}px`;
    smokeCtx.setTransform(smokeDpr, 0, 0, smokeDpr, 0, 0);

    particleCanvas.width = Math.floor(state.width * state.dpr);
    particleCanvas.height = Math.floor(state.height * state.dpr);
    particleCanvas.style.width = `${state.width}px`;
    particleCanvas.style.height = `${state.height}px`;
    particleCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    particleCtx.imageSmoothingEnabled = false;
    smokeCtx.imageSmoothingEnabled = false;

    createClouds();
    createWisps();
    createParticles();
    createLensBubbles();
  }

  function createClouds() {
    const anchors = [
      { x: -0.12, y: 0.12, rx: 0.52, ry: 0.4, alpha: 0.13, hue: 1 },
      { x: 0.16, y: 0.56, rx: 0.48, ry: 0.28, alpha: 0.12, hue: 0 },
      { x: 0.4, y: 0.22, rx: 0.44, ry: 0.25, alpha: 0.1, hue: 2 },
      { x: 0.68, y: 0.48, rx: 0.42, ry: 0.3, alpha: 0.11, hue: 3 },
      { x: 0.82, y: 0.2, rx: 0.36, ry: 0.26, alpha: 0.1, hue: 0 },
      { x: 0.48, y: 0.88, rx: 0.58, ry: 0.22, alpha: 0.14, hue: 1 },
      { x: 0.92, y: 0.78, rx: 0.38, ry: 0.26, alpha: 0.095, hue: 2 },
    ];

    state.clouds = anchors.map((anchor, index) => ({
      x: anchor.x * state.width,
      y: anchor.y * state.height,
      radiusX: Math.max(220, anchor.rx * state.width),
      radiusY: Math.max(150, anchor.ry * state.height),
      vx: rand(-0.018, 0.026) * state.width,
      vy: rand(-0.016, 0.018) * state.height,
      phase: rand(0, Math.PI * 2),
      pulse: rand(0.6, 1.4),
      alpha: anchor.alpha,
      color: palettes[anchor.hue],
      lobes: Array.from({ length: 8 + (index % 4) }, () => ({
        angle: rand(0, Math.PI * 2),
        distance: rand(0.06, 0.42),
        rx: rand(0.2, 0.62),
        ry: rand(0.12, 0.42),
        spin: rand(-0.26, 0.26),
        alpha: rand(0.32, 0.96),
      })),
    }));
  }

  function createWisps() {
    const count = reduceMotion ? 7 : clamp(Math.round(state.width / 72), 14, 28);
    state.wisps = Array.from({ length: count }, (_, index) => {
      const fromLeft = Math.random() > 0.36;
      return {
        x: fromLeft ? rand(-0.18, 0.78) * state.width : rand(0.35, 1.14) * state.width,
        y: rand(0.05, 0.98) * state.height,
        length: rand(state.width * 0.24, state.width * 0.66),
        amp: rand(24, 82),
        spread: rand(24, 72),
        grainLength: rand(4, 15),
        grains: Math.floor(rand(58, 116)),
        speed: rand(0.000045, 0.000135) * (fromLeft ? 1 : -1),
        drift: rand(7, 22) * (fromLeft ? 1 : -1),
        phase: rand(0, Math.PI * 2),
        seed: rand(0, 1000),
        alpha: rand(0.026, 0.072),
        color: palettes[index % palettes.length],
      };
    });
  }

  function createParticles() {
    const area = state.width * state.height;
    const count = reduceMotion ? 120 : clamp(Math.round(area / 4300), 340, 760);
    state.particles = Array.from({ length: count }, (_, index) => {
      const roll = Math.random();
      const type = roll > 0.975 ? 'spark' : roll > 0.86 ? 'mote' : 'sand';
      const color = type === 'sand' ? choose([palettes[0], palettes[1], palettes[4]]) : palettes[index % palettes.length];
      const band = Math.random();
      const y = band > 0.58 ? rand(state.height * 0.48, state.height * 1.04) : Math.random() * state.height;
      return {
        type,
        color,
        x: Math.random() * state.width,
        y,
        baseY: y,
        radius: type === 'mote' ? rand(0.8, 2.0) : type === 'spark' ? rand(0.65, 1.25) : rand(0.24, 0.72),
        length: type === 'sand' ? rand(1.2, 7.5) : rand(1.5, 5),
        alpha: type === 'spark' ? rand(0.18, 0.42) : type === 'mote' ? rand(0.06, 0.18) : rand(0.06, 0.24),
        vx: type === 'sand' ? rand(12, 42) : rand(-2, 10),
        vy: type === 'sand' ? rand(-8, 8) : rand(-5, 6),
        wave: rand(12, 68),
        phase: rand(0, Math.PI * 2),
        twinkle: rand(0.45, 1.9),
        bandSpeed: rand(0.0003, 0.0011),
      };
    });
  }

  function createLensBubbles() {
    const count = reduceMotion ? 3 : clamp(Math.round(state.width / 260), 4, 7);
    const anchors = [
      { x: 0.08, y: 0.78, rx: 58, ry: 35 },
      { x: 0.86, y: 0.14, rx: 46, ry: 28 },
      { x: 0.66, y: 0.86, rx: 40, ry: 22 },
      { x: 0.96, y: 0.9, rx: 70, ry: 30 },
      { x: 0.32, y: 0.16, rx: 18, ry: 14 },
      { x: 0.72, y: 0.68, rx: 23, ry: 18 },
      { x: 0.16, y: 0.36, rx: 15, ry: 12 },
    ];

    state.lensBubbles = anchors.slice(0, count).map((anchor) => ({
      x: anchor.x * state.width + rand(-20, 20),
      y: anchor.y * state.height + rand(-16, 16),
      rx: anchor.rx * rand(0.8, 1.2),
      ry: anchor.ry * rand(0.74, 1.26),
      vx: rand(-0.8, 1.4),
      vy: rand(-1.2, 1.1),
      phase: rand(0, Math.PI * 2),
      wobble: rand(0.06, 0.16),
      wobbleA: Math.floor(rand(3, 6)),
      wobbleB: Math.floor(rand(6, 10)),
      rotate: rand(-0.8, 0.8),
      alpha: rand(0.08, 0.22),
      color: choose(palettes),
    }));
  }

  function wrap(point, margin = 96) {
    if (point.x < -margin) point.x = state.width + margin;
    if (point.x > state.width + margin) point.x = -margin;
    if (point.y < -margin) point.y = state.height + margin;
    if (point.y > state.height + margin) point.y = -margin;
  }

  function drawSmoke(time, delta) {
    smokeCtx.clearRect(0, 0, state.width, state.height);
    smokeCtx.globalCompositeOperation = 'lighter';

    const mouseX = (state.mouse.x - 0.5) * 54;
    const mouseY = (state.mouse.y - 0.5) * 42;

    state.clouds.forEach((cloud, index) => {
      cloud.phase += delta * 0.00009 * cloud.pulse;
      cloud.x += cloud.vx * delta * 0.000042;
      cloud.y += cloud.vy * delta * 0.00004;

      if (cloud.x < -cloud.radiusX * 1.4) cloud.x = state.width + cloud.radiusX;
      if (cloud.x > state.width + cloud.radiusX * 1.4) cloud.x = -cloud.radiusX;
      if (cloud.y < -cloud.radiusY * 1.4) cloud.y = state.height + cloud.radiusY;
      if (cloud.y > state.height + cloud.radiusY * 1.4) cloud.y = -cloud.radiusY;

      const centerX = cloud.x + Math.cos(time * 0.000062 + cloud.phase) * 34 + mouseX * (0.12 + index * 0.018);
      const centerY = cloud.y + Math.sin(time * 0.000075 + cloud.phase) * 30 + mouseY * (0.1 + index * 0.014);
      const c = cloud.color;

      cloud.lobes.forEach((lobe, lobeIndex) => {
        const angle = lobe.angle + Math.sin(time * 0.00012 + cloud.phase + lobeIndex) * 0.58;
        const x = centerX + Math.cos(angle) * cloud.radiusX * lobe.distance;
        const y = centerY + Math.sin(angle) * cloud.radiusY * lobe.distance;
        const rx = cloud.radiusX * lobe.rx * (0.94 + Math.sin(time * 0.00017 + cloud.phase + lobeIndex) * 0.12);
        const ry = cloud.radiusY * lobe.ry * (0.9 + Math.cos(time * 0.00014 + cloud.phase + lobeIndex) * 0.16);
        const alpha = cloud.alpha * lobe.alpha;

        const gradient = smokeCtx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
        gradient.addColorStop(0, `rgba(255,255,255,${alpha * 0.34})`);
        gradient.addColorStop(0.16, `rgba(${c.r},${c.g},${c.b},${alpha})`);
        gradient.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${alpha * 0.38})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        smokeCtx.fillStyle = gradient;
        smokeCtx.beginPath();
        smokeCtx.ellipse(x, y, rx, ry, cloud.phase + lobe.spin, 0, Math.PI * 2);
        smokeCtx.fill();
      });
    });

    drawWisps(time, delta);
    smokeCtx.globalCompositeOperation = 'source-over';
  }

  function cubicPoint(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  function cubicTangent(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
  }

  function drawWisps(time, delta) {
    // v16: keep the same ribbon motion, but roughen the material.
    // It is rendered as sparse strokes, pin dots, and blocky dither instead of glow.
    smokeCtx.save();
    smokeCtx.globalCompositeOperation = 'source-over';
    smokeCtx.lineCap = 'round';
    smokeCtx.lineJoin = 'round';

    state.wisps.forEach((wisp, index) => {
      wisp.phase += delta * wisp.speed;
      wisp.x += wisp.drift * delta * 0.0018;
      wisp.y += Math.sin(time * 0.00012 + wisp.phase) * delta * 0.003;

      if (wisp.x > state.width + wisp.length * 0.4) wisp.x = -wisp.length * 0.8;
      if (wisp.x < -wisp.length) wisp.x = state.width + wisp.length * 0.3;
      if (wisp.y < -120) wisp.y = state.height + 120;
      if (wisp.y > state.height + 120) wisp.y = -120;

      const c = wisp.color;
      const startX = wisp.x;
      const startY = wisp.y + Math.sin(wisp.phase) * wisp.amp * 0.2;
      const cp1x = wisp.x + wisp.length * 0.28;
      const cp2x = wisp.x + wisp.length * 0.66;
      const endX = wisp.x + wisp.length;
      const cp1y = wisp.y + Math.sin(wisp.phase + index) * wisp.amp;
      const cp2y = wisp.y - Math.cos(wisp.phase * 1.2 + index) * wisp.amp * 0.9;
      const endY = wisp.y + Math.sin(wisp.phase * 0.7 + index * 0.3) * wisp.amp * 0.35;
      const grainCount = reduceMotion ? Math.floor(wisp.grains * 0.38) : wisp.grains;

      for (let layer = 0; layer < 3; layer += 1) {
        const density = layer === 0 ? grainCount : layer === 1 ? Math.floor(grainCount * 0.5) : Math.floor(grainCount * 0.28);
        const spreadMul = layer === 0 ? 1 : layer === 1 ? 0.48 : 1.32;
        const alphaMul = layer === 0 ? 1 : layer === 1 ? 0.5 : 0.32;

        for (let i = 0; i < density; i += 1) {
          const tBase = (i + (time * 0.000018 * (layer ? 1.8 : 1)) + wisp.seed * 0.013) / density;
          const t = tBase - Math.floor(tBase);
          const x = cubicPoint(startX, cp1x, cp2x, endX, t);
          const y = cubicPoint(startY, cp1y, cp2y, endY, t);
          const tx = cubicTangent(startX, cp1x, cp2x, endX, t);
          const ty = cubicTangent(startY, cp1y, cp2y, endY, t);
          const length = Math.hypot(tx, ty) || 1;
          const nx = -ty / length;
          const ny = tx / length;
          const noiseA = Math.sin(wisp.seed + i * 12.9898 + time * 0.00035);
          const noiseB = Math.cos(wisp.seed * 0.7 + i * 4.1414 - time * 0.00023);
          const centerBias = 1 - Math.abs(t - 0.5) * 1.55;
          const taper = clamp(centerBias, 0.14, 1);
          const offset = (noiseA * 0.68 + noiseB * 0.32) * wisp.spread * spreadMul * taper;
          const px = x + nx * offset + Math.sin(time * 0.00011 + i) * 5;
          const py = y + ny * offset + Math.cos(time * 0.00013 + i * 0.31) * 4;
          const seg = wisp.grainLength * (0.5 + Math.abs(noiseB) * 0.72) * (layer ? 0.72 : 1);
          const angle = Math.atan2(ty, tx) + noiseA * 0.36;
          const alpha = wisp.alpha * alphaMul * taper * (0.32 + Math.abs(noiseA) * 0.68);

          smokeCtx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
          smokeCtx.lineWidth = layer === 0 ? 0.42 : layer === 1 ? 0.68 : 0.32;
          smokeCtx.beginPath();
          smokeCtx.moveTo(px - Math.cos(angle) * seg, py - Math.sin(angle) * seg);
          smokeCtx.lineTo(px + Math.cos(angle) * seg, py + Math.sin(angle) * seg);
          smokeCtx.stroke();

          if (i % 5 === 0 && layer !== 1) {
            smokeCtx.fillStyle = `rgba(255,245,255,${alpha * 0.36})`;
            const dotSize = 0.7 + Math.abs(noiseA) * 1.15;
            smokeCtx.fillRect(px + nx * noiseB * 7, py + ny * noiseB * 7, dotSize, dotSize);
          }
        }
      }
    });

    smokeCtx.restore();
  }

  function drawParticles(time, delta) {
    particleCtx.clearRect(0, 0, state.width, state.height);
    particleCtx.globalCompositeOperation = 'lighter';

    state.mouse.x += (state.mouse.tx - state.mouse.x) * 0.032;
    state.mouse.y += (state.mouse.ty - state.mouse.y) * 0.032;

    const mx = state.mouse.x * state.width;
    const my = state.mouse.y * state.height;

    state.particles.forEach((particle) => {
      particle.phase += delta * 0.0005 * particle.twinkle;

      const flow = Math.sin(time * particle.bandSpeed + particle.baseY * 0.012 + particle.phase) * particle.wave;
      particle.x += (particle.vx + flow * 0.05) * delta * 0.001;
      particle.y += (particle.vy + Math.cos(time * 0.00038 + particle.phase) * 3.2) * delta * 0.001;

      if (particle.type === 'sand') {
        particle.y += Math.sin(particle.x * 0.006 + time * 0.00022) * delta * 0.00085;
      }

      if (state.mouse.active && !reduceMotion) {
        const dx = particle.x - mx;
        const dy = particle.y - my;
        const distSq = dx * dx + dy * dy;
        const radius = 240 * 240;
        if (distSq < radius && distSq > 0.01) {
          const force = (1 - distSq / radius) * 0.12;
          particle.x += dx * force * delta * 0.001;
          particle.y += dy * force * delta * 0.001;
        }
      }

      wrap(particle, 92);

      const c = particle.color;
      const twinkle = particle.type === 'spark' ? 0.62 + Math.sin(time * 0.002 + particle.phase) * 0.38 : 1;
      const alpha = particle.alpha * twinkle;

      if (particle.type === 'mote') {
        const radius = particle.radius * (1 + Math.sin(particle.phase) * 0.18);
        const gradient = particleCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 7);
        gradient.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        particleCtx.fillStyle = gradient;
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, radius * 7, 0, Math.PI * 2);
        particleCtx.fill();
      } else if (particle.type === 'sand') {
        const angle = Math.atan2(particle.vy + Math.sin(particle.phase) * 2, particle.vx + 8);
        const length = particle.length * (0.82 + Math.sin(particle.phase) * 0.18);
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        particleCtx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        particleCtx.lineWidth = particle.radius;
        particleCtx.beginPath();
        particleCtx.moveTo(particle.x - dx, particle.y - dy);
        particleCtx.lineTo(particle.x + dx, particle.y + dy + Math.sin(particle.phase) * 0.45);
        particleCtx.stroke();
        if (particle.phase % 1.7 < 0.42) {
          particleCtx.fillStyle = `rgba(255,245,255,${alpha * 0.46})`;
          const size = 0.65 + particle.radius * 0.9;
          particleCtx.fillRect(particle.x + dx * 0.2, particle.y - dy * 0.2, size, size);
        }
      } else {
        particleCtx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        particleCtx.fill();
      }
    });

    drawLensBubbles(time, delta, mx, my);
    particleCtx.globalCompositeOperation = 'source-over';
  }

  function drawOrganicPath(ctx, bubble, time, scale = 1) {
    const steps = 64;
    const phase = bubble.phase + time * 0.00034;
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      const wobble = 1
        + Math.sin(t * bubble.wobbleA + phase) * bubble.wobble
        + Math.cos(t * bubble.wobbleB - phase * 0.8) * bubble.wobble * 0.58
        + Math.sin(t * 2 - phase * 1.4) * bubble.wobble * 0.33;
      const x = Math.cos(t) * bubble.rx * wobble * scale;
      const y = Math.sin(t) * bubble.ry * wobble * scale;
      const rotate = bubble.rotate + Math.sin(phase) * 0.08;
      const xr = x * Math.cos(rotate) - y * Math.sin(rotate);
      const yr = x * Math.sin(rotate) + y * Math.cos(rotate);
      if (i === 0) ctx.moveTo(bubble.x + xr, bubble.y + yr);
      else ctx.lineTo(bubble.x + xr, bubble.y + yr);
    }
    ctx.closePath();
  }

  function drawLensBubbles(time, delta, mx, my) {
    state.lensBubbles.forEach((bubble, index) => {
      bubble.phase += delta * 0.00015;
      bubble.x += bubble.vx * delta * 0.006;
      bubble.y += bubble.vy * delta * 0.005;

      if (state.mouse.active && !reduceMotion) {
        const dx = bubble.x - mx;
        const dy = bubble.y - my;
        const distSq = dx * dx + dy * dy;
        const radius = 260 * 260;
        if (distSq < radius && distSq > 0.01) {
          const force = (1 - distSq / radius) * 0.026;
          bubble.x += dx * force;
          bubble.y += dy * force;
          bubble.wobble = clamp(bubble.wobble + force * 0.0014, 0.06, 0.18);
        }
      }

      wrap(bubble, Math.max(bubble.rx, bubble.ry) + 80);

      const c = bubble.color;
      const pulse = 0.78 + Math.sin(time * 0.0008 + bubble.phase) * 0.22;
      const alpha = bubble.alpha * pulse;

      particleCtx.save();
      drawOrganicPath(particleCtx, bubble, time, 1);
      const fill = particleCtx.createRadialGradient(
        bubble.x - bubble.rx * 0.28,
        bubble.y - bubble.ry * 0.32,
        0,
        bubble.x,
        bubble.y,
        Math.max(bubble.rx, bubble.ry) * 1.35
      );
      fill.addColorStop(0, `rgba(255,255,255,${alpha * 0.4})`);
      fill.addColorStop(0.18, `rgba(255,255,255,${alpha * 0.14})`);
      fill.addColorStop(0.46, `rgba(${c.r},${c.g},${c.b},${alpha * 0.11})`);
      fill.addColorStop(0.78, `rgba(${c.r},${c.g},${c.b},${alpha * 0.03})`);
      fill.addColorStop(1, 'rgba(0,0,0,0)');
      particleCtx.fillStyle = fill;
      particleCtx.fill();

      drawOrganicPath(particleCtx, bubble, time, 0.98);
      const stroke = particleCtx.createLinearGradient(
        bubble.x - bubble.rx,
        bubble.y - bubble.ry,
        bubble.x + bubble.rx,
        bubble.y + bubble.ry
      );
      stroke.addColorStop(0, `rgba(255,255,255,${alpha * 0.28})`);
      stroke.addColorStop(0.45, `rgba(255,126,175,${alpha * 0.2})`);
      stroke.addColorStop(0.78, `rgba(103,233,227,${alpha * 0.22})`);
      stroke.addColorStop(1, `rgba(171,140,255,${alpha * 0.18})`);
      particleCtx.strokeStyle = stroke;
      particleCtx.lineWidth = bubble.rx > 55 ? 1 : 0.7;
      particleCtx.stroke();

      particleCtx.globalAlpha = alpha * 0.46;
      particleCtx.strokeStyle = 'rgba(255,255,255,0.52)';
      particleCtx.lineWidth = bubble.rx > 55 ? 1 : 0.65;
      particleCtx.beginPath();
      particleCtx.ellipse(
        bubble.x - bubble.rx * 0.22,
        bubble.y - bubble.ry * 0.22,
        bubble.rx * 0.36,
        bubble.ry * 0.16,
        bubble.rotate - 0.55 + Math.sin(bubble.phase) * 0.08,
        Math.PI * 0.96,
        Math.PI * 1.92
      );
      particleCtx.stroke();

      if (index % 2 === 0) {
        particleCtx.globalAlpha = alpha * 0.2;
        particleCtx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.45)`;
        particleCtx.beginPath();
        particleCtx.ellipse(
          bubble.x + bubble.rx * 0.14,
          bubble.y + bubble.ry * 0.16,
          bubble.rx * 0.46,
          bubble.ry * 0.23,
          bubble.rotate + 0.6,
          0,
          Math.PI * 1.5
        );
        particleCtx.stroke();
      }

      particleCtx.restore();
    });
  }

  function animate(time) {
    const delta = Math.min(time - state.lastTime, 80);
    state.lastTime = time;

    if (!document.body.classList.contains('is-motion-paused')) {
      const smokeInterval = 1000 / state.smokeFps;
      const particleInterval = 1000 / state.particleFps;
      if (time - state.lastSmokeDraw >= smokeInterval) {
        drawSmoke(time, time - state.lastSmokeDraw || delta);
        state.lastSmokeDraw = time;
      }
      if (time - state.lastParticleDraw >= particleInterval) {
        drawParticles(time, time - state.lastParticleDraw || delta);
        state.lastParticleDraw = time;
      }
    }

    state.frame += 1;
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    state.mouse.tx = clamp(event.clientX / Math.max(window.innerWidth, 1), 0, 1);
    state.mouse.ty = clamp(event.clientY / Math.max(window.innerHeight, 1), 0, 1);
    state.mouse.active = true;
    root.style.setProperty('--atmosphere-mouse-x', state.mouse.tx.toFixed(4));
    root.style.setProperty('--atmosphere-mouse-y', state.mouse.ty.toFixed(4));
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    state.mouse.active = false;
  }, { passive: true });

  resize();
  if (reduceMotion) root.classList.add('is-dimmed');
  requestAnimationFrame((time) => {
    state.lastTime = time;
    animate(time);
  });
})();
