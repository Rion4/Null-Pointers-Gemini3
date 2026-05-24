"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  GitCompare,
  Upload,
  FileText,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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
}

interface ClauseChange {
  change_type: "ADDED" | "REMOVED" | "MODIFIED";
  old_text?: string;
  new_text?: string;
  section?: string;
}

interface ComparisonResult {
  net_risk_change:
    | "IMPROVED"
    | "UNCHANGED"
    | "WORSENED"
    | "SIGNIFICANTLY_WORSENED";
  new_risks_introduced: RiskItem[];
  risks_resolved: RiskItem[];
  risks_unchanged: RiskItem[];
  clause_changes: ClauseChange[];
  recommendation: string;
  summary: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/30",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  LOW: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const NET_CHANGE_CONFIG = {
  IMPROVED: {
    label: "Improved",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
  },
  UNCHANGED: {
    label: "Unchanged",
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted/20 border-border",
  },
  WORSENED: {
    label: "Worsened",
    icon: TrendingDown,
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/30",
  },
  SIGNIFICANTLY_WORSENED: {
    label: "Significantly Worsened",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
  },
};

function RiskCard({
  risk,
  variant,
}: {
  risk: RiskItem;
  variant: "new" | "resolved" | "unchanged";
}) {
  const borderColor =
    variant === "new"
      ? "border-red-400/30"
      : variant === "resolved"
        ? "border-green-400/30"
        : "border-border/50";

  return (
    <div
      className={cn("rounded-xl border p-4 space-y-2 glass-card", borderColor)}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            SEVERITY_COLORS[risk.severity] ?? "text-muted-foreground",
          )}
        >
          {risk.severity}
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
          {risk.risk_type}
        </span>
      </div>
      <blockquote className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 line-clamp-2">
        {risk.clause_text}
      </blockquote>
      <p className="text-xs text-foreground/80">{risk.explanation}</p>
      {variant !== "resolved" && (
        <p className="text-xs text-primary/80 font-medium">
          {risk.recommendation}
        </p>
      )}
    </div>
  );
}

function ClauseChangeCard({ change }: { change: ClauseChange }) {
  const config = {
    ADDED: {
      label: "Added",
      color: "text-green-400",
      bg: "bg-green-400/10 border-green-400/30",
    },
    REMOVED: {
      label: "Removed",
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/30",
    },
    MODIFIED: {
      label: "Modified",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10 border-yellow-400/30",
    },
  }[change.change_type];

  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-2 glass-card">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            config.bg,
            config.color,
          )}
        >
          {config.label}
        </span>
        {change.section && (
          <span className="text-[10px] text-muted-foreground">
            {change.section}
          </span>
        )}
      </div>
      {change.old_text && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Before
          </p>
          <p className="text-xs text-red-300/80 bg-red-400/5 rounded p-2 line-clamp-2">
            {change.old_text}
          </p>
        </div>
      )}
      {change.new_text && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            After
          </p>
          <p className="text-xs text-green-300/80 bg-green-400/5 rounded p-2 line-clamp-2">
            {change.new_text}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  label,
  file,
  content,
  onFile,
  onClear,
}: {
  label: string;
  file: File | null;
  content: string;
  onFile: (f: File, text: string) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (f: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onFile(f, data.content);
    } catch {
      alert("Failed to upload file. Make sure the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:border-primary/50 hover:bg-primary/3",
        file && "border-primary/40 bg-primary/5",
      )}
      onClick={() => {
        if (file) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.txt,.doc,.docx";
        input.onchange = (e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) handleFile(f);
        };
        input.click();
      }}
    >
      <div className="space-y-3">
        <div className="flex justify-center">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : file ? (
            <FileText className="h-8 w-8 text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {file ? (
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-xs text-primary">{file.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              {uploading
                ? "Uploading..."
                : "Drop a PDF or TXT file, or click to browse"}
            </p>
          )}
        </div>
        {content && (
          <p className="text-[10px] text-muted-foreground">
            {content.length.toLocaleString()} characters extracted
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [fileV1, setFileV1] = useState<File | null>(null);
  const [fileV2, setFileV2] = useState<File | null>(null);
  const [contentV1, setContentV1] = useState("");
  const [contentV2, setContentV2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "new" | "resolved" | "unchanged" | "changes"
  >("new");

  const canCompare = contentV1.length > 50 && contentV2.length > 50;

  const handleCompare = async () => {
    if (!canCompare || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const userId =
        typeof window !== "undefined"
          ? (localStorage.getItem("guardian_user_id") ?? "anonymous")
          : "anonymous";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_v1: contentV1,
            content_v2: contentV2,
            filename_v1: fileV1?.name ?? "Version 1",
            filename_v2: fileV2?.name ?? "Version 2",
            user_id: userId,
          }),
        },
      );

      if (!res.ok) throw new Error("Comparison failed");
      const data = await res.json();
      setResult(data.comparison);
    } catch (err) {
      console.error(err);
      alert("Comparison failed. Please check the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const netConfig = result ? NET_CHANGE_CONFIG[result.net_risk_change] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentSection="compare" setCurrentSection={() => {}} />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
            <GitCompare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
              Phase 7 · Comparative Analysis
            </span>
          </div>
          <h1 className="text-3xl font-bold">Contract Version Comparison</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Upload two versions of a contract to see exactly what changed,
            whether it got riskier or safer, and which new risks were
            introduced.
          </p>
        </div>

        {/* Upload zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <span className="text-sm font-medium">
                Original Contract (v1)
              </span>
            </div>
            <UploadZone
              label="Upload Version 1"
              file={fileV1}
              content={contentV1}
              onFile={(f, text) => {
                setFileV1(f);
                setContentV1(text);
              }}
              onClear={() => {
                setFileV1(null);
                setContentV1("");
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                2
              </div>
              <span className="text-sm font-medium">Revised Contract (v2)</span>
            </div>
            <UploadZone
              label="Upload Version 2"
              file={fileV2}
              content={contentV2}
              onFile={(f, text) => {
                setFileV2(f);
                setContentV2(text);
              }}
              onClear={() => {
                setFileV2(null);
                setContentV2("");
              }}
            />
          </div>
        </div>

        {/* Compare button */}
        <div className="flex justify-center">
          <Button
            onClick={handleCompare}
            disabled={!canCompare || isLoading}
            size="lg"
            className="px-8 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing changes...
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" />
                Compare Contracts
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4 animate-fade-in-up">
            <Sparkles className="h-8 w-8 text-primary animate-pulse mx-auto" />
            <div>
              <p className="font-semibold">
                Guardian is comparing your contracts
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Running full risk analysis on v2 + structural diff between
                versions...
              </p>
            </div>
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <span>✓ Extracting clauses</span>
              <span>✓ Identifying changes</span>
              <span>⟳ Assessing risk delta</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Net change banner */}
            {netConfig && (
              <div
                className={cn(
                  "rounded-2xl border p-6 glass-card",
                  netConfig.bg,
                )}
              >
                <div className="flex items-start gap-4">
                  <netConfig.icon
                    className={cn(
                      "h-8 w-8 flex-shrink-0 mt-0.5",
                      netConfig.color,
                    )}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn("text-lg font-bold", netConfig.color)}
                      >
                        {netConfig.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.new_risks_introduced.length} new risks ·{" "}
                        {result.risks_resolved.length} resolved ·{" "}
                        {result.risks_unchanged.length} unchanged
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">
                      {result.summary}
                    </p>
                    <div className="mt-3 p-3 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Recommendation
                      </p>
                      <p className="text-sm">{result.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/50 w-fit">
              {(
                [
                  {
                    id: "new",
                    label: `New Risks (${result.new_risks_introduced.length})`,
                    color: "text-red-400",
                  },
                  {
                    id: "resolved",
                    label: `Resolved (${result.risks_resolved.length})`,
                    color: "text-green-400",
                  },
                  {
                    id: "unchanged",
                    label: `Unchanged (${result.risks_unchanged.length})`,
                    color: "text-muted-foreground",
                  },
                  {
                    id: "changes",
                    label: `Clause Changes (${result.clause_changes.length})`,
                    color: "text-primary",
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={activeTab === tab.id ? tab.color : ""}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === "new" &&
                (result.new_risks_introduced.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p>No new risks were introduced in v2.</p>
                  </div>
                ) : (
                  result.new_risks_introduced.map((r, i) => (
                    <RiskCard key={i} risk={r} variant="new" />
                  ))
                ))}

              {activeTab === "resolved" &&
                (result.risks_resolved.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <p>No risks were resolved between v1 and v2.</p>
                  </div>
                ) : (
                  result.risks_resolved.map((r, i) => (
                    <RiskCard key={i} risk={r} variant="resolved" />
                  ))
                ))}

              {activeTab === "unchanged" &&
                (result.risks_unchanged.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <p>No unchanged risks found.</p>
                  </div>
                ) : (
                  result.risks_unchanged.map((r, i) => (
                    <RiskCard key={i} risk={r} variant="unchanged" />
                  ))
                ))}

              {activeTab === "changes" &&
                (result.clause_changes.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <p>No material clause changes detected.</p>
                  </div>
                ) : (
                  result.clause_changes.map((c, i) => (
                    <ClauseChangeCard key={i} change={c} />
                  ))
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
