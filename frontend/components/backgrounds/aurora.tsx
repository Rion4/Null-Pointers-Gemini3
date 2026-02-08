"use client";

import { useEffect, useRef } from "react";

export function Aurora() {
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

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      const isDark = document.documentElement.classList.contains("dark");

      // Create multiple aurora layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();

        const yOffset = canvas.height * (0.3 + layer * 0.15);
        const amplitude = 80 + layer * 30;
        const frequency = 0.003 - layer * 0.0005;
        const speed = time + layer * 0.5;

        // Draw wavy aurora shape
        for (let x = 0; x <= canvas.width; x += 5) {
          const y =
            yOffset +
            Math.sin(x * frequency + speed) * amplitude +
            Math.sin(x * frequency * 2 + speed * 1.5) * (amplitude / 2);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Complete the shape
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        // Create gradient
        const gradient = ctx.createLinearGradient(
          0,
          yOffset - amplitude,
          0,
          yOffset + amplitude,
        );

        if (isDark) {
          if (layer === 0) {
            gradient.addColorStop(0, "rgba(82, 149, 255, 0.15)");
            gradient.addColorStop(0.5, "rgba(82, 149, 255, 0.08)");
            gradient.addColorStop(1, "rgba(82, 149, 255, 0)");
          } else if (layer === 1) {
            gradient.addColorStop(0, "rgba(101, 211, 196, 0.12)");
            gradient.addColorStop(0.5, "rgba(101, 211, 196, 0.06)");
            gradient.addColorStop(1, "rgba(101, 211, 196, 0)");
          } else {
            gradient.addColorStop(0, "rgba(147, 51, 234, 0.1)");
            gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.05)");
            gradient.addColorStop(1, "rgba(147, 51, 234, 0)");
          }
        } else {
          if (layer === 0) {
            gradient.addColorStop(0, "rgba(82, 149, 255, 0.1)");
            gradient.addColorStop(0.5, "rgba(82, 149, 255, 0.05)");
            gradient.addColorStop(1, "rgba(82, 149, 255, 0)");
          } else if (layer === 1) {
            gradient.addColorStop(0, "rgba(101, 211, 196, 0.08)");
            gradient.addColorStop(0.5, "rgba(101, 211, 196, 0.04)");
            gradient.addColorStop(1, "rgba(101, 211, 196, 0)");
          } else {
            gradient.addColorStop(0, "rgba(147, 51, 234, 0.06)");
            gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.03)");
            gradient.addColorStop(1, "rgba(147, 51, 234, 0)");
          }
        }

        ctx.fillStyle = gradient;
        ctx.fill();
      }

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
      style={{ zIndex: 1, opacity: 0.7 }}
    />
  );
}
