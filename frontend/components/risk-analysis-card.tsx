"use client";

import { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gavel,
  CircleDollarSign,
  ShieldCheck,
  ShieldAlert,
  Infinity,
  Quote,
  Users,
  TrendingUp,
  ThumbsUp,
  Scale,
  Swords,
  HelpCircle,
  Lightbulb,
  Clock,
  FileSearch,
  Sword,
  Shield,
  AlertOctagon,
  ListOrdered,
  Tag,
  PhoneCall,
  Building2,
  DollarSign,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskItem {
  clause_text: string;
  risk_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  irreversible: boolean;
  explanation: string;
  recommendation: string;
  persona?: string;
  weight?: number;
}

interface BenefitItem {
  clause_text: string;
  benefit_type: string;
  strength: "WEAK" | "MODERATE" | "STRONG";
  explanation: string;
  persona?: string;
}

interface RankedFinding {
  rank: number;
  finding_type: "RISK" | "BENEFIT";
  title: string;
  severity_or_strength: string;
  weight: number;
  outweighs: string[];
  reason: string;
}

interface ClarifyingQuestion {
  question: string;
  why_needed: string;
  options?: string[] | null;
}

interface ActionableGuidance {
  document_context: string;
  immediate_actions: string[];
  options: string[];
  how_to_respond: string[];
  deadlines: string[];
  evidence_to_gather: string[];
  strengths_of_your_position: string[];
  weaknesses_of_your_position: string[];
  disclaimer: string;
  // StrategyAgent fields
  attorney_type?: string | null;
  relevant_agencies?: string[];
  typical_cost_range?: string | null;
  urgency_window?: string | null;
  fight_cost_benefit?: string | null;
}

export interface RiskAnalysis {
  verdict: "SAFE TO PROCEED" | "PROCEED WITH CAUTION" | "DO NOT SIGN";
  total_risk_score: number;
  irreversibility_index: number;
  critical_risks: number;
  irreversible_risks: number;
  impact_summary: string;
  comparative_summary?: string;
  document_type?: string;
  adversarial?: boolean;
  risks: RiskItem[];
  benefits?: BenefitItem[];
  ranked_findings?: RankedFinding[];
  guidance?: ActionableGuidance | null;
  clarifying_questions?: ClarifyingQuestion[];
  personas_used: string[];
  scored_risks?: RiskItem[];
}

export interface RiskAnalysisCardProps {
  riskAnalysis: RiskAnalysis;
  personasUsed?: string[];
  timestamp: Date;
  onAnswerQuestion?: (question: string, answer: string) => void;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-500/15 border-red-500/30",
    text: "text-red-500",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-500",
    order: 0,
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-500/15 border-orange-500/30",
    text: "text-orange-500",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
    order: 1,
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-yellow-500/15 border-yellow-500/30",
    text: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-500",
    order: 2,
  },
  LOW: {
    label: "Low",
    bg: "bg-blue-500/15 border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    order: 3,
  },
};

const STRENGTH_CONFIG = {
  STRONG: {
    label: "Strong",
    bg: "bg-green-500/15 border-green-500/30",
    text: "text-green-500",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  MODERATE: {
    label: "Moderate",
    bg: "bg-teal-500/15 border-teal-500/30",
    text: "text-teal-400",
    badge: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  },
  WEAK: {
    label: "Weak",
    bg: "bg-slate-500/15 border-slate-500/30",
    text: "text-slate-400",
    badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
};

const VERDICT_CONFIG = {
  "DO NOT SIGN": {
    icon: XCircle,
    bg: "bg-red-500/10 border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  "PROCEED WITH CAUTION": {
    icon: AlertTriangle,
    bg: "bg-orange-500/10 border-orange-500/40",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  "SAFE TO PROCEED": {
    icon: CheckCircle2,
    bg: "bg-green-500/10 border-green-500/40",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
};

const PERSONA_ICONS: Record<string, React.ElementType> = {
  legal: Gavel,
  "legal expert": Gavel,
  financial: CircleDollarSign,
  "financial advisor": CircleDollarSign,
  compliance: ShieldCheck,
  "compliance & data governance expert": ShieldCheck,
  insurance: ShieldAlert,
  "insurance risk analyst": ShieldAlert,
};

function getPersonaIcon(persona: string): React.ElementType {
  const key = persona.toLowerCase();
  for (const [k, Icon] of Object.entries(PERSONA_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return ShieldCheck;
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 70 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color =
    pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-orange-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Risk Score</span>
        <span className="font-mono font-semibold">{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Risk item card ───────────────────────────────────────────────────────────

function RiskItemCard({ risk, index }: { risk: RiskItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[risk.severity] ?? SEVERITY_CONFIG.LOW;
  const PersonaIcon = risk.persona ? getPersonaIcon(risk.persona) : ShieldCheck;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-200 animate-slide-in-up",
        cfg.bg,
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", cfg.dot)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {risk.risk_type}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  cfg.badge,
                )}
              >
                {cfg.label}
              </span>
              {risk.irreversible && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-red-500/10 text-red-400 border-red-500/30">
                  <Infinity className="h-2.5 w-2.5" />
                  Irreversible
                </span>
              )}
              {risk.weight != null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/30 text-muted-foreground border-border/40">
                  <Scale className="h-2.5 w-2.5" />
                  weight {(risk.weight * 100).toFixed(0)}%
                </span>
              )}
              {risk.persona && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-primary/10 text-primary/80 border-primary/20">
                  <PersonaIcon className="h-2.5 w-2.5" />
                  {risk.persona.split(" ")[0]}
                </span>
              )}
            </div>
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-background/40 border border-border/40">
              <Quote className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                {risk.clause_text}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-background/40 transition-colors text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/30 space-y-3 animate-fade-in-up">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Full Clause
            </p>
            <div className="p-2.5 rounded-lg bg-background/40 border border-border/40">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{risk.clause_text}"
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Why This Matters
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {risk.explanation}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              What To Do
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {risk.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Benefit item card ────────────────────────────────────────────────────────

function BenefitItemCard({
  benefit,
  index,
}: {
  benefit: BenefitItem;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STRENGTH_CONFIG[benefit.strength] ?? STRENGTH_CONFIG.WEAK;
  const PersonaIcon = benefit.persona
    ? getPersonaIcon(benefit.persona)
    : ShieldCheck;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-200 animate-slide-in-up",
        cfg.bg,
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <ThumbsUp
            className={cn("h-3.5 w-3.5 flex-shrink-0 mt-1", cfg.text)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {benefit.benefit_type}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  cfg.badge,
                )}
              >
                {cfg.label}
              </span>
              {benefit.persona && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-primary/10 text-primary/80 border-primary/20">
                  <PersonaIcon className="h-2.5 w-2.5" />
                  {benefit.persona.split(" ")[0]}
                </span>
              )}
            </div>
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-background/40 border border-border/40">
              <Quote className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                {benefit.clause_text}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-background/40 transition-colors text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/30 space-y-3 animate-fade-in-up">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Full Clause
            </p>
            <div className="p-2.5 rounded-lg bg-background/40 border border-border/40">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{benefit.clause_text}"
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Why This Is Favorable
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {benefit.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ranked findings bar ──────────────────────────────────────────────────────

function RankedFindingsSection({ findings }: { findings: RankedFinding[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? findings : findings.slice(0, 5);

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          What Matters Most — Ranked by Impact
        </p>
      </div>
      <div className="space-y-2">
        {visible.map((f, i) => {
          const isRisk = f.finding_type === "RISK";
          const barColor = isRisk
            ? f.severity_or_strength === "CRITICAL"
              ? "bg-red-500"
              : f.severity_or_strength === "HIGH"
                ? "bg-orange-500"
                : f.severity_or_strength === "MEDIUM"
                  ? "bg-yellow-500"
                  : "bg-blue-400"
            : f.severity_or_strength === "STRONG"
              ? "bg-green-500"
              : f.severity_or_strength === "MODERATE"
                ? "bg-teal-500"
                : "bg-slate-400";

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-4 flex-shrink-0">
                    #{f.rank}
                  </span>
                  {isRisk ? (
                    <AlertOctagon className="h-3 w-3 text-red-400 flex-shrink-0" />
                  ) : (
                    <ThumbsUp className="h-3 w-3 text-green-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground truncate">
                    {f.title}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                      isRisk
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400",
                    )}
                  >
                    {f.severity_or_strength}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                  {(f.weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{ width: `${Math.min(f.weight * 100 * 2, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pl-6">
                {f.reason}
              </p>
              {f.outweighs.length > 0 && (
                <p className="text-[10px] text-muted-foreground/60 pl-6">
                  Outweighs: {f.outweighs.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {findings.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {findings.length - 5} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Guidance panel (adversarial docs) ───────────────────────────────────────

function GuidancePanel({ guidance }: { guidance: ActionableGuidance }) {
  const [activeTab, setActiveTab] = useState<
    "actions" | "options" | "fight" | "evidence" | "help"
  >("actions");

  const hasHelpTab = !!(
    guidance.attorney_type ||
    (guidance.relevant_agencies && guidance.relevant_agencies.length > 0) ||
    guidance.typical_cost_range ||
    guidance.fight_cost_benefit
  );

  const tabs = [
    {
      id: "actions" as const,
      label: "Do Now",
      icon: Clock,
      count: guidance.immediate_actions.length,
    },
    {
      id: "options" as const,
      label: "Options",
      icon: Lightbulb,
      count: guidance.options.length,
    },
    {
      id: "fight" as const,
      label: "How to Respond",
      icon: Sword,
      count: guidance.how_to_respond.length,
    },
    {
      id: "evidence" as const,
      label: "Gather",
      icon: FileSearch,
      count: guidance.evidence_to_gather.length,
    },
    ...(hasHelpTab
      ? [{ id: "help" as const, label: "Get Help", icon: PhoneCall, count: 0 }]
      : []),
  ];

  const content: Record<string, string[]> = {
    actions: guidance.immediate_actions,
    options: guidance.options,
    fight: guidance.how_to_respond,
    evidence: guidance.evidence_to_gather,
  };

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-500/20 bg-orange-500/10">
        <Swords className="h-4 w-4 text-orange-400" />
        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
          Adversarial Document — Action Guide
        </p>
      </div>

      {/* Context */}
      <div className="px-4 py-3 border-b border-orange-500/20">
        <p className="text-xs text-foreground/80 leading-relaxed">
          {guidance.document_context}
        </p>
      </div>

      {/* Urgency window banner (StrategyAgent) */}
      {guidance.urgency_window && (
        <div className="px-4 py-2.5 border-b border-red-500/30 bg-red-500/10 flex items-center gap-2">
          <Timer className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-300">
            {guidance.urgency_window}
          </p>
        </div>
      )}

      {/* Position assessment */}
      {(guidance.strengths_of_your_position.length > 0 ||
        guidance.weaknesses_of_your_position.length > 0) && (
        <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b border-orange-500/20">
          {guidance.strengths_of_your_position.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Shield className="h-3 w-3 text-green-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                  Your Strengths
                </p>
              </div>
              <ul className="space-y-1">
                {guidance.strengths_of_your_position.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/70 leading-relaxed flex gap-1.5"
                  >
                    <span className="text-green-400 flex-shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guidance.weaknesses_of_your_position.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <AlertTriangle className="h-3 w-3 text-red-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  Your Weaknesses
                </p>
              </div>
              <ul className="space-y-1">
                {guidance.weaknesses_of_your_position.map((w, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/70 leading-relaxed flex gap-1.5"
                  >
                    <span className="text-red-400 flex-shrink-0">−</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Deadlines */}
      {guidance.deadlines.length > 0 && (
        <div className="px-4 py-3 border-b border-orange-500/20 bg-red-500/5">
          <div className="flex items-center gap-1 mb-2">
            <Clock className="h-3 w-3 text-red-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Deadlines
            </p>
          </div>
          <ul className="space-y-1">
            {guidance.deadlines.map((d, i) => (
              <li key={i} className="text-xs text-red-300 font-medium">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fight cost/benefit callout (StrategyAgent) */}
      {guidance.fight_cost_benefit && (
        <div className="px-4 py-3 border-b border-orange-500/20 bg-background/20">
          <div className="flex items-center gap-1 mb-2">
            <Scale className="h-3 w-3 text-orange-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              Fight vs. Settle Assessment
            </p>
          </div>
          <p className="text-xs text-foreground/75 leading-relaxed">
            {guidance.fight_cost_benefit}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-orange-500/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              activeTab === tab.id
                ? "text-orange-400 border-b-2 border-orange-400 bg-orange-500/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-orange-500/20 text-orange-400 rounded-full px-1.5 py-0.5 text-[9px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-3">
        {activeTab === "help" ? (
          <div className="space-y-4">
            {guidance.attorney_type && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <PhoneCall className="h-3 w-3 text-orange-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Attorney to Seek
                  </p>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {guidance.attorney_type}
                </p>
              </div>
            )}
            {guidance.typical_cost_range && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-3 w-3 text-orange-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Typical Cost
                  </p>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {guidance.typical_cost_range}
                </p>
              </div>
            )}
            {guidance.relevant_agencies && guidance.relevant_agencies.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Building2 className="h-3 w-3 text-orange-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Relevant Agencies
                  </p>
                </div>
                <ul className="space-y-1">
                  {guidance.relevant_agencies.map((agency, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-orange-400 flex-shrink-0">·</span>
                      {agency}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {(content[activeTab] ?? []).map((item, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-xs text-foreground/80 leading-relaxed"
              >
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[9px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-3 border-t border-orange-500/20 bg-muted/20">
        <p className="text-[10px] text-muted-foreground italic">
          {guidance.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ─── Clarifying questions ─────────────────────────────────────────────────────

function ClarifyingQuestionsSection({
  questions,
  onAnswer,
}: {
  questions: ClarifyingQuestion[];
  onAnswer?: (question: string, answer: string) => void;
}) {
  const [answered, setAnswered] = useState<Record<number, string>>({});

  const handleAnswer = (index: number, question: string, answer: string) => {
    setAnswered((prev) => ({ ...prev, [index]: answer }));
    onAnswer?.(question, answer);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
          Guardian needs more context
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Answering these will sharpen the analysis:
      </p>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2"
          >
            <p className="text-xs font-medium text-foreground">{q.question}</p>
            <p className="text-[10px] text-muted-foreground italic">
              {q.why_needed}
            </p>
            {answered[i] ? (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Answered: {answered[i]}</span>
              </div>
            ) : q.options && q.options.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {q.options.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => handleAnswer(i, q.question, opt)}
                    className="px-3 py-1 rounded-lg text-xs border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  className="flex-1 text-xs bg-background/60 border border-border/50 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleAnswer(i, q.question, e.currentTarget.value.trim());
                    }
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main RiskAnalysisCard component ─────────────────────────────────────────

export function RiskAnalysisCard({
  riskAnalysis,
  personasUsed,
  timestamp,
  onAnswerQuestion,
}: RiskAnalysisCardProps) {
  const [showAllRisks, setShowAllRisks] = useState(false);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "risks" | "benefits" | "ranking"
  >("risks");

  // Normalise risks — handle legacy scored_risks field
  const allRisks: RiskItem[] = (
    riskAnalysis.risks?.length
      ? riskAnalysis.risks
      : (riskAnalysis.scored_risks ?? [])
  ).sort(
    (a, b) =>
      (SEVERITY_CONFIG[a.severity]?.order ?? 3) -
      (SEVERITY_CONFIG[b.severity]?.order ?? 3),
  );

  const allBenefits: BenefitItem[] = riskAnalysis.benefits ?? [];
  const rankedFindings: RankedFinding[] = riskAnalysis.ranked_findings ?? [];
  const personas = personasUsed ?? riskAnalysis.personas_used ?? [];

  const verdictCfg =
    VERDICT_CONFIG[riskAnalysis.verdict] ??
    VERDICT_CONFIG["PROCEED WITH CAUTION"];
  const VerdictIcon = verdictCfg.icon;

  const visibleRisks = showAllRisks ? allRisks : allRisks.slice(0, 4);
  const visibleBenefits = showAllBenefits
    ? allBenefits
    : allBenefits.slice(0, 3);

  return (
    <div className="w-full max-w-[88%] space-y-3 animate-slide-in-up">
      {/* ── Verdict banner ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-2xl border p-5 shadow-lg",
          verdictCfg.bg,
          verdictCfg.glow,
        )}
      >
        {/* Document type + adversarial badge */}
        <div className="flex items-center gap-2 mb-3">
          {riskAnalysis.document_type &&
            riskAnalysis.document_type !== "Unknown" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-background/30 text-muted-foreground border-border/40">
                <Tag className="h-2.5 w-2.5" />
                {riskAnalysis.document_type}
              </span>
            )}
          {riskAnalysis.adversarial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Swords className="h-2.5 w-2.5" />
              Filed Against You
            </span>
          )}
        </div>

        {/* Verdict */}
        <div className="flex items-center gap-3 mb-3">
          <VerdictIcon
            className={cn("h-7 w-7 flex-shrink-0", verdictCfg.text)}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Guardian Verdict
            </p>
            <p
              className={cn(
                "text-xl font-black tracking-tight",
                verdictCfg.text,
              )}
            >
              {riskAnalysis.verdict}
            </p>
          </div>
        </div>

        {/* Impact summary */}
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">
          {riskAnalysis.impact_summary}
        </p>

        {/* Comparative summary */}
        {riskAnalysis.comparative_summary && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-background/30 border border-border/30 mb-4">
            <Scale className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {riskAnalysis.comparative_summary}
            </p>
          </div>
        )}

        {/* Score bar */}
        <ScoreBar score={riskAnalysis.total_risk_score} />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-lg font-black text-red-400">
              {riskAnalysis.critical_risks}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Critical
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-lg font-black text-orange-400">
              {riskAnalysis.irreversible_risks}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Irreversible
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-lg font-black text-foreground">
              {allRisks.length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Risks
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-lg font-black text-green-400">
              {allBenefits.length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Benefits
            </p>
          </div>
        </div>

        {/* Personas */}
        {personas.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
              Analyzed by:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {personas.map((p) => {
                const Icon = getPersonaIcon(p);
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary/80 border border-primary/20"
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Guidance panel (adversarial only) ──────────────────────────── */}
      {riskAnalysis.adversarial && riskAnalysis.guidance && (
        <GuidancePanel guidance={riskAnalysis.guidance} />
      )}

      {/* ── Clarifying questions ────────────────────────────────────────── */}
      {riskAnalysis.clarifying_questions &&
        riskAnalysis.clarifying_questions.length > 0 && (
          <ClarifyingQuestionsSection
            questions={riskAnalysis.clarifying_questions}
            onAnswer={onAnswerQuestion}
          />
        )}

      {/* ── Section tabs ────────────────────────────────────────────────── */}
      {(allRisks.length > 0 ||
        allBenefits.length > 0 ||
        rankedFindings.length > 0) && (
        <div className="flex rounded-xl border border-border/50 overflow-hidden">
          {allRisks.length > 0 && (
            <button
              onClick={() => setActiveSection("risks")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
                activeSection === "risks"
                  ? "bg-red-500/10 text-red-400 border-b-2 border-red-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
              )}
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              Risks ({allRisks.length})
            </button>
          )}
          {allBenefits.length > 0 && (
            <button
              onClick={() => setActiveSection("benefits")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
                activeSection === "benefits"
                  ? "bg-green-500/10 text-green-400 border-b-2 border-green-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Benefits ({allBenefits.length})
            </button>
          )}
          {rankedFindings.length > 0 && (
            <button
              onClick={() => setActiveSection("ranking")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
                activeSection === "ranking"
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Ranking
            </button>
          )}
        </div>
      )}

      {/* ── Risks section ───────────────────────────────────────────────── */}
      {activeSection === "risks" && allRisks.length > 0 && (
        <div className="space-y-2">
          {visibleRisks.map((risk, i) => (
            <RiskItemCard key={i} risk={risk} index={i} />
          ))}
          {allRisks.length > 4 && (
            <button
              onClick={() => setShowAllRisks(!showAllRisks)}
              className="w-full py-2.5 rounded-xl border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all flex items-center justify-center gap-2"
            >
              {showAllRisks ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show {allRisks.length - 4} more risks
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Benefits section ─────────────────────────────────────────────── */}
      {activeSection === "benefits" && allBenefits.length > 0 && (
        <div className="space-y-2">
          {visibleBenefits.map((benefit, i) => (
            <BenefitItemCard key={i} benefit={benefit} index={i} />
          ))}
          {allBenefits.length > 3 && (
            <button
              onClick={() => setShowAllBenefits(!showAllBenefits)}
              className="w-full py-2.5 rounded-xl border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all flex items-center justify-center gap-2"
            >
              {showAllBenefits ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show {allBenefits.length - 3} more benefits
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Ranking section ──────────────────────────────────────────────── */}
      {activeSection === "ranking" && rankedFindings.length > 0 && (
        <RankedFindingsSection findings={rankedFindings} />
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground/60 px-1">
        {timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
