"use client";

import { useEffect, useRef } from "react";

export function AntiGravity() {
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

    // Particle class with physics
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      mass: number;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 3 + 2;
        this.mass = this.radius;
        this.opacity = Math.random() * 0.5 + 0.3;

        const colors = [
          "rgba(82, 149, 255,",
          "rgba(101, 211, 196,",
          "rgba(147, 51, 234,",
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Apply slight gravity
        this.vy += 0.05;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges with damping
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
          this.vx *= -0.8;
          this.x =
            this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }

        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
          this.vy *= -0.8;
          this.y =
            this.y - this.radius < 0
              ? this.radius
              : canvas.height - this.radius;
        }

        // Air resistance
        this.vx *= 0.99;
        this.vy *= 0.99;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ")";
        ctx.fill();

        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color + "0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      applyForce(fx: number, fy: number) {
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push(
        new Particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
        ),
      );
    }

    const mouse = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 100,
      isDown: false,
    };

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseDown = () => {
      mouse.isDown = true;
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Create explosion effect on click
      particles.forEach((particle) => {
        const dx = particle.x - e.clientX;
        const dy = particle.y - e.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          const force = (200 - distance) / 200;
          particle.applyForce(dx * force * 0.5, dy * force * 0.5);
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("click", handleClick);

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        // Mouse interaction - repulsion when mouse is near
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);

          // Repel particles away from mouse
          const repelForce = mouse.isDown ? 2 : 0.5;
          particle.applyForce(
            -Math.cos(angle) * force * repelForce,
            -Math.sin(angle) * force * repelForce,
          );
        }

        // Particle collision
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = particle.radius + other.radius;

          if (distance < minDist) {
            // Simple collision response
            const angle = Math.atan2(dy, dx);
            const targetX = particle.x + Math.cos(angle) * minDist;
            const targetY = particle.y + Math.sin(angle) * minDist;
            const ax = (targetX - other.x) * 0.05;
            const ay = (targetY - other.y) * 0.05;

            particle.vx -= ax;
            particle.vy -= ay;
            other.vx += ax;
            other.vy += ay;

            // Draw connection line
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = "rgba(82, 149, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        particle.update();
        particle.draw();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.7, pointerEvents: "auto" }}
    />
  );
}
