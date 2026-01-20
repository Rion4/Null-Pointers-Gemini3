"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface HeroProps {
  setCurrentSection: (section: string) => void
}

export function Hero({ setCurrentSection }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:px-8 min-h-screen flex items-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl orb-1" />
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl orb-2" />
        <div className="absolute inset-0 bg-cool-overlay" />

        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full grid-shimmer" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary/10"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-4xl w-full relative z-10">
        <div className="text-center">
          <div className="relative inline-block w-full">
            <div className="absolute -inset-4 gradient-animated rounded-3xl blur-2xl opacity-30" aria-hidden="true" />
            <h1 className="relative text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance animate-fade-in-up">
              Real-time rule guidance for complex tasks
            </h1>
            </div>

          <p className="mt-6 text-lg text-muted-foreground text-balance animate-fade-in-up">
            Get AI-powered insights while you work. Our Rule-to-Action Engine analyzes documents and provides real-time
            guidance to prevent costly mistakes in legal, financial, and regulatory contexts.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center animate-fade-in-up">
            <Button
              size="lg"
              onClick={() => setCurrentSection("demo")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              Try Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setCurrentSection("pricing")}>
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
