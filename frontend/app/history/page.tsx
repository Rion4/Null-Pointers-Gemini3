"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  History,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  session_id: string;
  timestamp: string;
  document_name: string;
  verdict?: string;
  risk_count: number;
  benefit_count: number;
  char_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  "DO NOT SIGN": {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
  },
  "PROCEED WITH CAUTION": {
    icon: AlertCircle,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
  },
  "SAFE TO PROCEED": {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSize(chars: number): string {
  if (chars > 1_000_000) return `${(chars / 1_000_000).toFixed(1)}M chars`;
  if (chars > 1_000) return `${(chars / 1_000).toFixed(0)}K chars`;
  return `${chars} chars`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? (localStorage.getItem("guardian_user_id") ?? "")
        : "";
    setUserId(id);
    if (id) {
      fetchHistory(id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/history?user_id=${encodeURIComponent(uid)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data.history ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentSection="history" setCurrentSection={() => {}} />

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in-up">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-2">
              <History className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                Phase 5 · Persistent Sessions
              </span>
            </div>
            <h1 className="text-3xl font-bold">Analysis History</h1>
            <p className="text-muted-foreground text-sm">
              Your past document analyses — Guardian remembers every contract
              you've reviewed.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => userId && fetchHistory(userId)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {/* User ID badge */}
        {userId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground glass-card rounded-xl px-4 py-2 w-fit">
            <span className="font-mono">{userId.slice(0, 24)}...</span>
            <span className="text-border">·</span>
            <span>Your persistent identity</span>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your history...</p>
          </div>
        ) : !userId ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-4">
            <History className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold">No history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a conversation in Chat to begin building your analysis
                history.
              </p>
            </div>
            <Button onClick={() => router.push("/chat")} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Go to Chat
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold">No analyses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a document in Chat to run your first analysis. It will
                appear here.
              </p>
            </div>
            <Button onClick={() => router.push("/chat")} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Analyze a Document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {history.length} analysis{history.length !== 1 ? "es" : ""} found
            </p>
            {history.map((entry) => {
              const verdictCfg = entry.verdict
                ? VERDICT_CONFIG[entry.verdict]
                : null;

              return (
                <div
                  key={entry.session_id}
                  className="glass-card rounded-2xl border border-border/50 p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-sm truncate">
                          {entry.document_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{entry.risk_count} risks</span>
                          <span>·</span>
                          <span>{entry.benefit_count} benefits</span>
                          <span>·</span>
                          <span>{formatSize(entry.char_count)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {verdictCfg && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold",
                            verdictCfg.bg,
                            verdictCfg.color,
                          )}
                        >
                          <verdictCfg.icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {entry.verdict}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
