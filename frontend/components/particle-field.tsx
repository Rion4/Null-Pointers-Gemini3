"use client";

/**
 * ConfettiVacuum — matches the antigravity.google hero effect:
 *
 * • Colored dash/dot particles scattered across the full canvas at all times
 * • Particles drift slowly and randomly when cursor is away
 * • Cursor acts as a vacuum — particles within range get pulled toward it
 *   and cluster around the cursor as it moves
 * • Particles outside range continue their natural drift
 */

import { useEffect, useRef } from "react";

// Brand color palette — adapt to your theme
const COLORS = [
  "#8B5CF6", // violet  (primary)
  "#6366F1", // indigo
  "#3B82F6", // blue
  "#A855F7", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#10B981", // emerald
];

const COUNT = 120; // total particles
const CURSOR_RADIUS = 180; // px — vacuum influence zone
const PULL_STRENGTH = 0.12; // how fast pulled particles move toward cursor
const RETURN_STRENGTH = 0.025; // how fast they drift back after cursor leaves
const BASE_SPEED = 0.4; // max natural drift speed

interface Particle {
  // Home / natural position (drifts over time)
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Displayed position (displaced by cursor)
  dx: number;
  dy: number;
  // Visual
  w: number; // width (dashes are wider than tall)
  h: number; // height
  angle: number; // rotation
  dAngle: number; // rotation speed
  color: string;
  alpha: number;
  isDash: boolean; // dash vs dot
}

export function ParticleField({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];

    const W = () => canvas.width;
    const H = () => canvas.height;

    const make = (): Particle => {
      const isDash = Math.random() > 0.35;
      const x = Math.random() * W();
      const y = Math.random() * H();
      const speed = Math.random() * BASE_SPEED + 0.1;
      const angle = Math.random() * Math.PI * 2;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        dx: x,
        dy: y,
        w: isDash ? Math.random() * 10 + 6 : Math.random() * 4 + 2,
        h: isDash ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
        angle: Math.random() * Math.PI * 2,
        dAngle: (Math.random() - 0.5) * 0.03,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.55 + 0.2,
        isDash,
      };
    };

    const spawn = () => {
      particles = Array.from({ length: COUNT }, make);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      spawn();
    };

    const tick = () => {
      ctx.clearRect(0, 0, W(), H());

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const active = mouse.current.active;

      for (const p of particles) {
        // Natural drift
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.dAngle;

        // Wrap around edges
        if (p.x < -20) p.x = W() + 20;
        if (p.x > W() + 20) p.x = -20;
        if (p.y < -20) p.y = H() + 20;
        if (p.y > H() + 20) p.y = -20;

        // Cursor vacuum
        const ddx = mx - p.x;
        const ddy = my - p.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);

        if (active && dist < CURSOR_RADIUS && dist > 0.1) {
          const t = 1 - dist / CURSOR_RADIUS;
          // Pull displayed position toward cursor
          p.dx += (mx - p.dx) * PULL_STRENGTH * (t * t + 0.3);
          p.dy += (my - p.dy) * PULL_STRENGTH * (t * t + 0.3);
        } else {
          // Spring displayed position back to natural position
          p.dx += (p.x - p.dx) * RETURN_STRENGTH;
          p.dy += (p.y - p.dy) * RETURN_STRENGTH;
        }

        // Draw
        ctx.save();
        ctx.translate(p.dx, p.dy);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.isDash) {
          // Rounded rectangle dash
          const rx = 1;
          const x = -p.w / 2,
            y = -p.h / 2;
          ctx.beginPath();
          ctx.moveTo(x + rx, y);
          ctx.lineTo(x + p.w - rx, y);
          ctx.quadraticCurveTo(x + p.w, y, x + p.w, y + rx);
          ctx.lineTo(x + p.w, y + p.h - rx);
          ctx.quadraticCurveTo(x + p.w, y + p.h, x + p.w - rx, y + p.h);
          ctx.lineTo(x + rx, y + p.h);
          ctx.quadraticCurveTo(x, y + p.h, x, y + p.h - rx);
          ctx.lineTo(x, y + rx);
          ctx.quadraticCurveTo(x, y, x + rx, y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle dot
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [dark]);

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const onMouseLeave = () => {
    mouse.current = { x: -9999, y: -9999, active: false };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="absolute inset-0 w-full h-full pointer-events-auto select-none"
    />
  );
}
