"use client";

import { useEffect, useRef } from "react";

export function DotMatrix() {
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

    const dotSpacing = 30;
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const maxDistance = 200;

    // Store current state for smooth transitions
    const dots: Array<{
      x: number;
      y: number;
      currentSize: number;
      targetSize: number;
      currentOpacity: number;
      targetOpacity: number;
    }> = [];

    // Initialize dots
    for (let x = 0; x < canvas.width; x += dotSpacing) {
      for (let y = 0; y < canvas.height; y += dotSpacing) {
        dots.push({
          x,
          y,
          currentSize: 1.5,
          targetSize: 1.5,
          currentOpacity: 0.3,
          targetOpacity: 0.3,
        });
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains("dark");
      const baseColor = isDark ? "rgba(82, 149, 255, " : "rgba(82, 149, 255, ";

      dots.forEach((dot) => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate target values
        if (distance < maxDistance) {
          const factor = 1 - distance / maxDistance;
          dot.targetSize = 1.5 + factor * 3;
          dot.targetOpacity = 0.3 + factor * 0.7;
        } else {
          dot.targetSize = 1.5;
          dot.targetOpacity = 0.3;
        }

        // Smooth interpolation (lerp) - lower = smoother/slower
        const lerpFactor = 0.08;
        dot.currentSize += (dot.targetSize - dot.currentSize) * lerpFactor;
        dot.currentOpacity +=
          (dot.targetOpacity - dot.currentOpacity) * lerpFactor;

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.currentSize, 0, Math.PI * 2);
        ctx.fillStyle = baseColor + dot.currentOpacity + ")";
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.5 }}
    />
  );
}
