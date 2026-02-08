"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { InteractiveDemo } from "@/components/interactive-demo";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { DotMatrix } from "@/components/backgrounds/dot-matrix";

export default function Home() {
  const [currentSection, setCurrentSection] = useState("home");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated background - Dot Matrix */}
      <DotMatrix />

      {/* Gradient mask to fade dots under content */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Subtle gradient orbs */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/2 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-40 right-1/4 w-[500px] h-[500px] bg-accent/2 rounded-full blur-3xl animate-float-slower" />
      </div>

      <div className="relative" style={{ zIndex: 10 }}>
        <Navigation
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
        />
        <Hero setCurrentSection={setCurrentSection} />
        <InteractiveDemo />
        <Features />
        <Footer />
      </div>
    </div>
  );
}
