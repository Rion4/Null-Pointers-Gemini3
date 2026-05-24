"use client";

import { useRouter } from "next/navigation";

/* ── Seeded dots for the dark starfield ─────────────────────────────────── */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function buildDots(n: number) {
  const rand = seededRng(77);
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x:  rand() * 100,
    y:  rand() * 100,
    s:  1 + rand() * 3.5,
    o:  0.25 + rand() * 0.55,
    r:  (rand() - 0.5) * 40,
  }));
}
const DOTS = buildDots(120);

function ShieldLogoWhite() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="dark-shield-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#4285F4" />
          <stop offset="33%"  stopColor="#EA4335" />
          <stop offset="66%"  stopColor="#FBBC04" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        fill="url(#dark-shield-g)"
      />
    </svg>
  );
}

export function DarkSection() {
  const router = useRouter();

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#050505", minHeight: "60vh" }}
    >
      {/* Floating blue/teal dot starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {DOTS.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-full"
            style={{
              left:      `${d.x}%`,
              top:       `${d.y}%`,
              width:     d.s,
              height:    d.s * (0.4 + Math.abs(d.r) / 40),
              background: d.id % 3 === 0 ? "#60a5fa" : d.id % 3 === 1 ? "#34d399" : "#a78bfa",
              opacity:   d.o,
              transform: `rotate(${d.r}deg)`,
              borderRadius: d.s < 2 ? "50%" : 1,
            }}
          />
        ))}
      </div>

      {/* Center logo lockup */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="flex items-center gap-3">
          <ShieldLogoWhite />
          <span className="text-white text-3xl font-semibold tracking-tight">
            ClauseGuard
          </span>
        </div>

        <p className="text-white/40 text-sm max-w-xs text-center leading-relaxed">
          Four expert AI agents analyze your contract simultaneously
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-4 px-8 py-3.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.97] transition-all duration-150"
        >
          Analyze a contract →
        </button>
      </div>

      {/* Play button bottom-right (decorative, matches Antigravity) */}
      <div className="absolute bottom-6 right-6 z-10">
        <button className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
