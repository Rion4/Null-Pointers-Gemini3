"use client";

import { useState, useEffect } from "react";

const WORDS = [
  "lawyer",
  "startup founder",
  "enterprise team",
  "solo entrepreneur",
  "legal professional",
  "small business",
];

export function TypewriterSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [display,   setDisplay]   = useState("");
  const [phase,     setPhase]     = useState<"typing" | "hold" | "deleting">("typing");

  useEffect(() => {
    const word = WORDS[wordIndex];

    if (phase === "typing") {
      if (display.length < word.length) {
        const t = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 75);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("hold"), 1800);
      return () => clearTimeout(t);
    }

    if (phase === "hold") {
      const t = setTimeout(() => setPhase("deleting"), 100);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay((d) => d.slice(0, -1)), 45);
        return () => clearTimeout(t);
      }
      setWordIndex((i) => (i + 1) % WORDS.length);
      setPhase("typing");
    }
  }, [display, phase, wordIndex]);

  return (
    <section className="px-6 lg:px-16 py-28 bg-background">
      <div className="mx-auto max-w-5xl">
        <p className="text-4xl sm:text-5xl lg:text-[3.25rem] font-light text-foreground leading-[1.25] tracking-tight">
          ClauseGuard is our AI-powered contract analysis platform, allowing
          any{" "}
          <span className="font-normal">
            {display}
            <span
              className="inline-block w-[2px] h-[0.85em] bg-foreground ml-0.5 align-middle"
              style={{ animation: "blink 1s step-end infinite" }}
            />
          </span>
          {" "}to understand what they&apos;re signing.
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
