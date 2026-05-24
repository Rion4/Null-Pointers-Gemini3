"use client";

import { useRouter } from "next/navigation";

/* ── Visual mock-ups ──────────────────────────────────────────────────────── */

function AppPreview() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-xl bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Verdict
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-warning/10 text-warning">
            PROCEED WITH CAUTION
          </span>
        </div>
        <div className="space-y-2">
          {[
            { label: "Unlimited indemnification clause", sev: "CRITICAL", cls: "bg-destructive/8 text-destructive" },
            { label: "Auto-renewal with 90-day notice",  sev: "HIGH",     cls: "bg-warning/8 text-warning" },
            { label: "IP assignment scope too broad",    sev: "HIGH",     cls: "bg-warning/8 text-warning" },
            { label: "Governing law: unfavorable state", sev: "MEDIUM",   cls: "bg-primary/8 text-primary" },
          ].map((r) => (
            <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.cls.split(" ")[0]}`}>
              <span className="text-xs text-foreground truncate max-w-[70%]">{r.label}</span>
              <span className={`text-[10px] font-bold ${r.cls.split(" ")[1]}`}>{r.sev}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex gap-2">
          {["Legal", "Financial", "Compliance", "Insurance"].map((a) => (
            <span key={a} className="px-2 py-1 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegalPreview() {
  return (
    <div className="rounded-2xl border border-border shadow-xl p-6 bg-gradient-to-br from-primary/8 to-accent/5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">
        Flagged clause
      </p>
      <blockquote className="text-xs text-muted-foreground leading-relaxed italic mb-4 border-l-2 border-primary/40 pl-3">
        &ldquo;Party shall indemnify, defend, and hold harmless from any and all
        claims arising out of or related to…&rdquo;
      </blockquote>
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
          CRITICAL
        </span>
        <span className="text-xs text-muted-foreground">Unlimited indemnification</span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Recommendation:</strong> Cap indemnification to direct damages and add a mutual clause.
      </p>
    </div>
  );
}

function FinancialPreview() {
  return (
    <div className="rounded-2xl border border-border shadow-xl p-6 bg-gradient-to-br from-warning/8 to-warning/4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-warning">
          Liability exposure
        </p>
        <span className="text-sm font-bold text-warning">$2.4M est.</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div className="h-full rounded-full bg-warning" style={{ width: "72%" }} />
      </div>
      <div className="space-y-2">
        {[
          { label: "Auto-renew + 90-day lock-in", val: "HIGH" },
          { label: "Penalty clause uncapped",     val: "HIGH" },
          { label: "Payment terms: net-30",       val: "MED"  },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-warning font-semibold">{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompliancePreview() {
  return (
    <div className="rounded-2xl border border-border shadow-xl p-6 bg-gradient-to-br from-accent/8 to-accent/4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-3">
        Compliance check
      </p>
      <div className="space-y-2">
        {[
          { ok: true,  label: "GDPR Article 28 — DPA present" },
          { ok: false, label: "SOC 2 requirements absent"     },
          { ok: true,  label: "CCPA consent language found"   },
          { ok: false, label: "D&O liability not capped"      },
        ].map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className={`text-xs font-bold ${it.ok ? "text-accent" : "text-destructive"}`}>
              {it.ok ? "✓" : "✗"}
            </span>
            <span className="text-xs text-muted-foreground">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature row ─────────────────────────────────────────────────────────── */

function FeatureRow({
  title,
  description,
  visual,
  flip,
}: {
  title: string;
  description: string;
  visual: React.ReactNode;
  flip: boolean;
}) {
  return (
    <div className={`flex flex-col ${flip ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-20 items-center`}>
      <div className="flex-1 lg:max-w-md">
        <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-5 leading-tight">
          {title}
        </h3>
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
        <button className="mt-6 text-sm text-foreground font-medium flex items-center gap-1 hover:gap-2 transition-all duration-150">
          Explore Product
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex-1 w-full">{visual}</div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    id: "app",
    title: "ClauseGuard Analysis",
    description: "Your command center to analyze contracts with four AI expert agents running in parallel. Upload any PDF, paste text, and receive a fully structured risk verdict with ranked findings, severity scores, and actionable recommendations.",
    visual: <AppPreview />,
    flip: false,
  },
  {
    id: "legal",
    title: "Legal Expert",
    description: "Flags risky clauses — unlimited indemnification, broad IP assignment, governing-law disadvantages, and unilateral amendment rights — before you commit to anything.",
    visual: <LegalPreview />,
    flip: true,
  },
  {
    id: "financial",
    title: "Financial Expert",
    description: "Quantifies your liability exposure, auto-renewal lock-ins, penalty structures, and financial obligations buried in legalese — expressed in plain numbers.",
    visual: <FinancialPreview />,
    flip: false,
  },
  {
    id: "compliance",
    title: "Compliance & Insurance",
    description: "Cross-references GDPR, CCPA, SOC 2, and HIPAA gaps while simultaneously identifying insurance coverage holes, D&O exposure, and clauses your insurer would likely deny.",
    visual: <CompliancePreview />,
    flip: true,
  },
];

export function Features() {
  const router = useRouter();

  return (
    <section className="px-6 lg:px-8 py-24 bg-background">
      <div className="mx-auto max-w-6xl space-y-28">

        {FEATURES.map((f) => (
          <FeatureRow key={f.id} {...f} />
        ))}

        <div className="pt-10 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-semibold text-foreground">Ready to analyze your contract?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a PDF or paste text — results in under 60 seconds.
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-7 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 active:scale-[0.97] transition-all duration-150"
          >
            Start analyzing →
          </button>
        </div>

      </div>
    </section>
  );
}
