/**
 * Flexify's animated background: an evenly scattered field of tiny dashes. A
 * ring of them lights up around the cursor and follows it with a soft lag;
 * dashes point away from the ring's centre and wobble slightly. Inspired by
 * the Google Antigravity site; written from scratch on a 2D canvas so it runs
 * without WebGL, in the popup and behind Flex pages alike.
 */
export interface ParticleFieldOptions {
  /** Average gap between dashes, in CSS pixels. */
  spacing?: number;
  /** Ring colours; dashes cycle through them around the ring. */
  colors?: string[];
  /** Ring radius and half-width, in CSS pixels. */
  ringRadius?: number;
  ringWidth?: number;
  /** Dash size at full brightness. */
  dashLength?: number;
  dashWidth?: number;
  /** Brightness of dashes far from the ring (0 hides them). */
  idleAlpha?: number;
  /** How far lit dashes are pushed outward. */
  displacement?: number;
}

const DEFAULTS: Required<ParticleFieldOptions> = {
  spacing: 15,
  colors: ['#7189ff', '#3074f9', '#00c2f7'],
  ringRadius: 110,
  ringWidth: 34,
  dashLength: 9,
  dashWidth: 3,
  idleAlpha: 0.07,
  displacement: 10,
};

interface Dot {
  x: number;
  y: number;
  seed: number;
}

const ALPHA_STEPS = 5;

export function createParticleField(canvas: HTMLCanvasElement, options: ParticleFieldOptions = {}) {
  const o = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy() {} };

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let width = 0;
  let height = 0;
  let dots: Dot[] = [];
  const ring = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let lastPointer = -Infinity;
  let frame = 0;
  let running = true;

  // Deterministic pseudo-random so the field looks the same on every open.
  let s = 1337;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Jittered grid: even coverage without a visible lattice.
    s = 1337;
    dots = [];
    for (let y = -o.spacing; y < height + o.spacing; y += o.spacing) {
      for (let x = -o.spacing; x < width + o.spacing; x += o.spacing) {
        dots.push({ x: x + (rand() - 0.5) * o.spacing * 0.8, y: y + (rand() - 0.5) * o.spacing * 0.8, seed: rand() });
      }
    }
    if (!ring.x && !ring.y) {
      ring.x = target.x = width * 0.62;
      ring.y = target.y = height * 0.38;
    }
  }

  function onPointer(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    target.x = e.clientX - rect.left;
    target.y = e.clientY - rect.top;
    lastPointer = performance.now();
  }

  function draw(now: number) {
    const t = now / 1000;
    // With no pointer for a while, the ring drifts on its own so the page stays alive.
    if (now - lastPointer > 2500) {
      target.x = width * (0.5 + 0.28 * Math.sin(t * 0.23));
      target.y = height * (0.45 + 0.22 * Math.sin(t * 0.31 + 1.2));
    }
    ring.x += (target.x - ring.x) * 0.06;
    ring.y += (target.y - ring.y) * 0.06;

    ctx!.clearRect(0, 0, width, height);
    ctx!.lineCap = 'round';

    // Batch strokes by colour and brightness step: a handful of draw calls per frame.
    const paths = o.colors.map(() => Array.from({ length: ALPHA_STEPS }, () => new Path2D()));
    const widths = o.colors.map(() => new Array<number>(ALPHA_STEPS).fill(o.dashWidth));
    const r2 = 2 * o.ringWidth * o.ringWidth;

    for (const d of dots) {
      const dx = d.x - ring.x;
      const dy = d.y - ring.y;
      const dist = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(d.x * 0.045 + t * 1.1) * Math.cos(d.y * 0.05 - t * 0.9);
      const off = dist - o.ringRadius - wobble * 10;
      const band = Math.exp(-(off * off) / r2);
      const alpha = o.idleAlpha + band * (1 - o.idleAlpha);
      if (alpha < 0.03) continue;

      const ux = dx / dist;
      const uy = dy / dist;
      const push = band * o.displacement * (0.7 + 0.3 * wobble);
      const cx = d.x + ux * push;
      const cy = d.y + uy * push;
      const half = (o.dashLength * (0.25 + 0.75 * band)) / 2;

      const angle = Math.atan2(dy, dx) / (2 * Math.PI) + 0.5;
      const ci = Math.floor((angle + d.seed * 0.2 + t * 0.03) * o.colors.length) % o.colors.length;
      const ai = Math.min(ALPHA_STEPS - 1, Math.floor(alpha * ALPHA_STEPS));
      const path = paths[ci]![ai]!;
      path.moveTo(cx - ux * half, cy - uy * half);
      path.lineTo(cx + ux * half, cy + uy * half);
      widths[ci]![ai] = o.dashWidth * (0.6 + 0.4 * band);
    }

    paths.forEach((steps, ci) => {
      ctx!.strokeStyle = o.colors[ci]!;
      steps.forEach((path, ai) => {
        ctx!.globalAlpha = (ai + 1) / ALPHA_STEPS;
        ctx!.lineWidth = widths[ci]![ai]!;
        ctx!.stroke(path);
      });
    });
    ctx!.globalAlpha = 1;
  }

  function loop(now: number) {
    if (!running) return;
    if (!document.hidden) draw(now);
    frame = requestAnimationFrame(loop);
  }

  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (reduceMotion) draw(0);
  });
  resizeObserver.observe(canvas);
  layout();
  window.addEventListener('pointermove', onPointer, { passive: true });

  if (reduceMotion) draw(0);
  else frame = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
    },
  };
}
