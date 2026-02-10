"use client";

import { useEffect, useRef } from "react";

export function MeshGradient() {
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

    // Gradient blobs
    const blobs: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
    }> = [
      {
        x: canvas.width * 0.2,
        y: canvas.height * 0.3,
        radius: 300,
        vx: 0.3,
        vy: 0.2,
        color: "rgba(82, 149, 255, 0.3)",
      },
      {
        x: canvas.width * 0.8,
        y: canvas.height * 0.6,
        radius: 350,
        vx: -0.2,
        vy: 0.3,
        color: "rgba(101, 211, 196, 0.25)",
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height * 0.5,
        radius: 280,
        vx: 0.25,
        vy: -0.25,
        color: "rgba(147, 51, 234, 0.2)",
      },
    ];

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw blobs
      blobs.forEach((blob) => {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges
        if (blob.x - blob.radius < 0 || blob.x + blob.radius > canvas.width) {
          blob.vx *= -1;
        }
        if (blob.y - blob.radius < 0 || blob.y + blob.radius > canvas.height) {
          blob.vy *= -1;
        }

        // Create radial gradient
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius,
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Apply blur effect
      ctx.filter = "blur(60px)";
      ctx.globalCompositeOperation = "lighter";

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
