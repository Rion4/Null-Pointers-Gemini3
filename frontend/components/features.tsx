"use client";

import {
  FileUp,
  Zap,
  Lock,
  BarChart3,
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Brain,
    title: "Multi-Agent Intelligence",
    description:
      "Legal, financial, compliance, and workflow agents work together to analyze your situation from every angle.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Real-time Guidance",
    description:
      "Get instant recommendations as you work. No more switching between documents and forms.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: AlertTriangle,
    title: "Mistake Prevention",
    description:
      "Catch errors before they become costly. Our system intervenes before irreversible actions.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Shield,
    title: "Compliance Assurance",
    description:
      "Stay compliant with complex regulations. Automated checks against laws, policies, and SOPs.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const useCases = [
  { icon: FileUp, label: "Tax Filing", active: true },
  { icon: CheckCircle, label: "Government Forms", active: false },
  { icon: Lock, label: "Legal Documents", active: false },
  { icon: BarChart3, label: "Financial Compliance", active: false },
];

export function Features() {
  const [activeUseCase, setActiveUseCase] = useState(0);

  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8 relative">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-4">
            Powered by{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Multi-Agent AI
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Four specialized agents collaborate behind the scenes to ensure you
            take the right action, every time.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-20">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl glass-card hover:scale-[1.02] transition-all duration-300 animate-slide-in-up border border-border/50 hover:border-primary/30"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div
                  className={`inline-flex rounded-xl ${feature.bgColor} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Use cases section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8">
            Perfect for High-Stakes Workflows
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {useCases.map((useCase, i) => (
              <button
                key={i}
                onClick={() => setActiveUseCase(i)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeUseCase === i
                    ? "glass-card border-2 border-primary text-primary scale-105"
                    : "glass-card border border-border/50 hover:border-primary/30 hover:scale-105"
                }`}
              >
                <useCase.icon className="h-5 w-5" />
                <span className="font-medium">{useCase.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
