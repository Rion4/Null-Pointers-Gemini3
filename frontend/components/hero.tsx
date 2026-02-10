"use client";

import { Sparkles, Shield, Zap } from "lucide-react";

interface HeroProps {
  setCurrentSection: (section: string) => void;
}

export function Hero({ setCurrentSection }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 py-32 sm:py-40 lg:px-8 min-h-[90vh] flex items-center">
      <div className="mx-auto max-w-5xl w-full relative z-10">
        <div className="text-center">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in-up border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">
              AI-Powered Rule Guidance
            </span>
          </div>

          {/* Main heading with gradient */}
          <div className="relative inline-block w-full mb-8">
            <h1 className="relative text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance animate-fade-in-up leading-tight">
              Real-time rule guidance for{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
                complex tasks
              </span>
            </h1>
          </div>

          <p className="mt-8 text-lg sm:text-xl text-muted-foreground text-balance animate-fade-in-up max-w-3xl mx-auto leading-relaxed">
            Navigate laws, regulations, and policies with confidence. Our AI
            system observes your context and provides precise guidance at the
            exact moment you need it—preventing mistakes before they happen.
          </p>

          {/* Feature pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-in-up">
            <div className="flex items-center gap-2 px-5 py-3 rounded-full glass-card text-sm border border-primary/10 hover:border-primary/30 transition-all hover:scale-105">
              <Shield className="h-4 w-4 text-primary" />
              <span>Legal Compliance</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-full glass-card text-sm border border-accent/10 hover:border-accent/30 transition-all hover:scale-105">
              <Zap className="h-4 w-4 text-accent" />
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-full glass-card text-sm border border-primary/10 hover:border-primary/30 transition-all hover:scale-105">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Multi-Agent System</span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-20 animate-fade-in-up">
            <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider">
              Trusted for high-stakes workflows
            </p>
            <div className="flex flex-wrap justify-center gap-10 text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-default">
                Government Portals
              </span>
              <span className="hover:text-foreground transition-colors cursor-default">
                Tax Filing
              </span>
              <span className="hover:text-foreground transition-colors cursor-default">
                Legal Compliance
              </span>
              <span className="hover:text-foreground transition-colors cursor-default">
                Financial Regulations
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
