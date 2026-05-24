"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { number: "1", label: "Upload",            description: "Drop a PDF or paste contract text. Any format, any length." },
  { number: "2", label: "Parallel analysis", description: "Four specialized agents analyze simultaneously — Legal, Financial, Compliance, Insurance." },
  { number: "3", label: "Critic validation", description: "A critic agent reviews all findings, removes hallucinations, and corrects severity ratings." },
  { number: "4", label: "Verdict",           description: "A consensus orchestrator synthesizes everything into one ranked, structured verdict." },
];

const verdicts = [
  { label: "SAFE TO PROCEED",      color: "text-accent",      bg: "bg-accent/10",      dot: "bg-accent" },
  { label: "PROCEED WITH CAUTION", color: "text-warning",     bg: "bg-warning/10",     dot: "bg-warning" },
  { label: "DO NOT SIGN",          color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
];

export function InteractiveDemo() {
  const router  = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".pipe-label",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" } },
      );

      // Steps reveal left-to-right
      gsap.fromTo(".pipe-step",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: ".pipe-grid", start: "top 82%" } },
      );

      // Progress line draws across the grid
      gsap.fromTo(".pipe-line",
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: "left center", duration: 0.8, ease: "expo.out", delay: 0.3,
          scrollTrigger: { trigger: ".pipe-grid", start: "top 82%" } },
      );

      // Verdict badges stagger in
      gsap.fromTo(".pipe-verdict",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: ".pipe-verdicts", start: "top 90%" } },
      );

      gsap.fromTo(".pipe-cta-link",
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.35,
          scrollTrigger: { trigger: ".pipe-verdicts", start: "top 90%" } },
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 lg:px-8 py-16 border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="pipe-label section-label mb-6 opacity-0">The pipeline</p>

          {/* Progress line behind the grid */}
          <div className="relative">
            <div className="pipe-grid grid sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="pipe-step text-left p-6 bg-background hover:bg-muted/40 transition-colors duration-200 cursor-default opacity-0"
                >
                  <span className="font-mono text-xs text-muted-foreground mb-3 block">{step.number}</span>
                  <p className="text-sm font-semibold text-foreground mb-1.5">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verdicts + CTA */}
        <div className="pipe-verdicts flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <p className="text-xs text-muted-foreground shrink-0">Three possible verdicts:</p>
          <div className="flex flex-wrap gap-3">
            {verdicts.map((v) => (
              <span
                key={v.label}
                className={`pipe-verdict inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0 ${v.color} ${v.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${v.dot} shrink-0`} />
                {v.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="pipe-cta-link ml-auto shrink-0 text-xs font-medium text-primary hover:underline underline-offset-2 transition-all duration-150 opacity-0"
          >
            Try it with your contract →
          </button>
        </div>
      </div>
    </section>
  );
}
