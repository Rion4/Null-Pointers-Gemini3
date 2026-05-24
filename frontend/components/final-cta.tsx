"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ── Seeded starfield ───────────────────────────────────────────────────── */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function buildDots(n: number) {
  const rand = seededRng(13);
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    s: 1.5 + rand() * 3,
    o: 0.2 + rand() * 0.5,
    r: (rand() - 0.5) * 50,
  }));
}
const DOTS = buildDots(100);

const CONTRACT_TYPES = ["NDAs", "Employment agreements", "SaaS contracts", "Vendor terms", "Service agreements"];

export function FinalCTA() {
  const router = useRouter();
  const [wordIdx, setWordIdx] = useState(0);
  const [display, setDisplay] = useState("");
  const [phase,   setPhase]   = useState<"typing" | "hold" | "deleting">("typing");

  useEffect(() => {
    const word = CONTRACT_TYPES[wordIdx];
    if (phase === "typing") {
      if (display.length < word.length) {
        const t = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 70);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("hold"), 2000);
      return () => clearTimeout(t);
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("deleting"), 100);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay((d) => d.slice(0, -1)), 40);
        return () => clearTimeout(t);
      }
      setWordIdx((i) => (i + 1) % CONTRACT_TYPES.length);
      setPhase("typing");
    }
  }, [display, phase, wordIdx]);

  return (
    <section
      className="relative overflow-hidden px-6 lg:px-16 py-32"
      style={{ backgroundColor: "#050505", minHeight: "55vh" }}
    >
      {/* Dot starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {DOTS.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-sm"
            style={{
              left:       `${d.x}%`,
              top:        `${d.y}%`,
              width:      d.s,
              height:     d.s * 1.4,
              background: d.id % 2 === 0 ? "#3b82f6" : "#818cf8",
              opacity:    d.o,
              transform:  `rotate(${d.r}deg)`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl">
        <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight">
          Start analyzing contracts with ClauseGuard for{" "}
          <span>
            {display}
            <span
              className="inline-block w-[3px] h-[0.85em] bg-white ml-1 align-middle"
              style={{ animation: "blink-w 1s step-end infinite" }}
            />
          </span>
        </h2>

        <button
          onClick={() => router.push("/chat")}
          className="mt-10 px-8 py-4 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-100 active:scale-[0.97] transition-all duration-150"
        >
          Analyze now
        </button>
      </div>

      <style>{`
        @keyframes blink-w {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
