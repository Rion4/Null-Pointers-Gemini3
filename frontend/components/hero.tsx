"use client";

import { useRouter } from "next/navigation";

function ShieldLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="hero-shield-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#4285F4" />
          <stop offset="33%"  stopColor="#EA4335" />
          <stop offset="66%"  stopColor="#FBBC04" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        fill="url(#hero-shield-g)"
      />
    </svg>
  );
}

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-[calc(100vh-60px)] overflow-hidden bg-background flex flex-col items-center justify-center px-6 pb-12 pt-16">

      {/* ── Dot matrix base layer — always-visible dim grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.5 0.01 264 / 0.2) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Dot matrix highlight layer — revealed by cursor via CSS var ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.48 0.19 265 / 0.9) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          WebkitMaskImage:
            "radial-gradient(circle 260px at var(--cursor-x, -9999px) var(--cursor-y, -9999px), black 0%, transparent 100%)",
          maskImage:
            "radial-gradient(circle 260px at var(--cursor-x, -9999px) var(--cursor-y, -9999px), black 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">

        {/* Brand lockup */}
        <div className="flex items-center gap-2 mb-8">
          <ShieldLogo />
          <span className="text-sm font-medium text-muted-foreground tracking-tight">
            ClauseGuard
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold text-foreground leading-[1.05] tracking-tight">
          Analyze contracts<br />before you sign.
        </h1>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 px-7 py-4 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 active:scale-[0.97] transition-all duration-150"
          >
            <ShieldLogo size={15} />
            Analyze a contract
          </button>
          <button
            onClick={() => router.push("/compare")}
            className="px-7 py-4 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted/60 active:scale-[0.97] transition-all duration-150"
          >
            Explore use cases
          </button>
        </div>

      </div>
    </section>
  );
}
