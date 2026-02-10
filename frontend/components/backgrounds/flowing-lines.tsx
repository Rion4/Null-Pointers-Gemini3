"use client";

import { useEffect, useRef } from "react";

export function FlowingLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create flowing curves
    const curves: Array<{
      points: Array<{ x: number; y: number; vx: number; vy: number }>;
      color: string;
      width: number;
    }> = [];

    const curveCount = 5;
    const pointsPerCurve = 8;

    for (let i = 0; i < curveCount; i++) {
      const points = [];
      for (let j = 0; j < pointsPerCurve; j++) {
        points.push({
          x: (canvas.width / (pointsPerCurve - 1)) * j,
          y: canvas.height * (0.3 + Math.random() * 0.4),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }

      const hue = 210 + i * 15; // Blue to cyan range
      curves.push({
        points,
        color: `hsla(${hue}, 70%, 60%, 0.15)`,
        width: 2 + Math.random() * 2,
      });
    }

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      curves.forEach((curve, curveIndex) => {
        // Update points
        curve.points.forEach((point, i) => {
          // Add wave motion
          point.y += Math.sin(time + i * 0.5 + curveIndex) * 0.5;

          // Keep points in bounds
          if (point.y < canvas.height * 0.2) point.y = canvas.height * 0.2;
          if (point.y > canvas.height * 0.8) point.y = canvas.height * 0.8;
        });

        // Draw smooth curve
        ctx.beginPath();
        ctx.moveTo(curve.points[0].x, curve.points[0].y);

        for (let i = 0; i < curve.points.length - 1; i++) {
          const current = curve.points[i];
          const next = curve.points[i + 1];
          const xMid = (current.x + next.x) / 2;
          const yMid = (current.y + next.y) / 2;
          ctx.quadraticCurveTo(current.x, current.y, xMid, yMid);
        }

        const last = curve.points[curve.points.length - 1];
        ctx.lineTo(last.x, last.y);

        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.width;
        ctx.lineCap = "round";
        ctx.stroke();

        // Add glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = curve.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.6 }}
    />
  );
}
