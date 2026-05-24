"use client";

import { useRouter } from "next/navigation";

export function PricingSection() {
  const router = useRouter();

  return (
    <section
      className="px-6 lg:px-8 py-28 bg-background"
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(0.5 0.01 264 / 0.18) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-start">

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Available at no charge
          </p>
          <h3 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            For individuals
          </h3>
          <p className="text-4xl sm:text-5xl font-bold text-muted-foreground/40 leading-tight mt-1">
            Analyze with confidence
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="mt-10 px-8 py-4 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 active:scale-[0.97] transition-all duration-150"
          >
            Analyze now
          </button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Now Available!
          </p>
          <h3 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            For organizations
          </h3>
          <p className="text-4xl sm:text-5xl font-bold text-muted-foreground/40 leading-tight mt-1">
            Power your entire team
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="mt-10 px-8 py-4 rounded-full border-2 border-border bg-background text-foreground text-sm font-semibold hover:bg-muted/60 active:scale-[0.97] transition-all duration-150"
          >
            Read More
          </button>
        </div>

      </div>
    </section>
  );
}
