"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const scenarios = [
  {
    title: "Tax Filing Assistant",
    description: "Navigate complex tax forms with real-time guidance",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    example: "Should I claim this deduction?",
  },
  {
    title: "Legal Document Review",
    description: "Understand contracts and identify potential risks",
    icon: Shield,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    example: "What does this clause mean?",
  },
  {
    title: "Compliance Navigator",
    description: "Stay compliant with regulations and policies",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    example: "Am I meeting all requirements?",
  },
];

export function InteractiveDemo() {
  const router = useRouter();
  const [activeScenario, setActiveScenario] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setActiveScenario((prev) => (prev + 1) % scenarios.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovering]);

  const handleLaunch = () => {
    router.push("/chat");
  };

  const currentScenario = scenarios[activeScenario];

  return (
    <section className="px-4 py-16 lg:px-8 relative">
      <div className="mx-auto max-w-6xl">
        {/* Main interactive card */}
        <div
          className="relative group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-gradient-x" />

          {/* Main card */}
          <div className="relative glass-card rounded-3xl p-8 md:p-12 border-2 border-border/50 group-hover:border-primary/50 transition-all duration-500">
            {/* Grid overlay on card */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03] rounded-3xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4 border border-primary/20">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    AI-Powered Guidance Engine
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Experience{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
                    Intelligent Assistance
                  </span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  See how our multi-agent system provides real-time guidance for
                  complex tasks
                </p>
              </div>

              {/* Scenario selector */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {scenarios.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveScenario(index)}
                    className={`relative p-6 rounded-2xl transition-all duration-300 text-left ${
                      activeScenario === index
                        ? `${scenario.bgColor} border-2 ${scenario.borderColor} scale-105`
                        : "glass-card border border-border/50 hover:border-primary/30 hover:scale-102"
                    }`}
                  >
                    {/* Active indicator */}
                    {activeScenario === index && (
                      <div className="absolute top-3 right-3">
                        <div className="relative">
                          <div
                            className={`w-2 h-2 rounded-full ${scenario.color.replace("text-", "bg-")} animate-pulse`}
                          />
                          <div
                            className={`absolute inset-0 w-2 h-2 rounded-full ${scenario.color.replace("text-", "bg-")} animate-ping`}
                          />
                        </div>
                      </div>
                    )}

                    <scenario.icon
                      className={`h-8 w-8 mb-3 ${activeScenario === index ? scenario.color : "text-muted-foreground"} transition-colors`}
                    />
                    <h3
                      className={`font-semibold mb-2 ${activeScenario === index ? "text-foreground" : "text-muted-foreground"} transition-colors`}
                    >
                      {scenario.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Demo preview */}
              <div className="relative mb-12">
                <div className="glass-deep rounded-2xl p-6 border border-border/50">
                  {/* Simulated chat interface */}
                  <div className="space-y-4">
                    {/* User message */}
                    <div className="flex justify-end animate-slide-in-up">
                      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-4 py-3">
                        <p className="text-sm">{currentScenario.example}</p>
                      </div>
                    </div>

                    {/* AI response with typing indicator */}
                    <div
                      className="flex gap-3 animate-slide-in-up"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 glass-card rounded-2xl px-4 py-3 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Analyzing with multi-agent system...
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Our Legal, Financial, and Compliance agents are
                          reviewing your situation to provide accurate guidance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating agent indicators - centered properly */}
                <div className="flex justify-center gap-3 mt-6">
                  {["Legal", "Financial", "Compliance"].map((agent, i) => (
                    <div
                      key={agent}
                      className="glass-card px-4 py-2 rounded-full text-sm font-medium border border-primary/20 animate-slide-in-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {agent}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleLaunch}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 gap-2 group/btn relative overflow-hidden px-8 py-6 text-lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Launch Assistant
                    <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  No signup required • Instant access • Free to try
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
