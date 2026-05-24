"use client";

import { FileText, X, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentContextBarProps {
  filename: string;
  charCount?: number;
  pageCount?: number | null;
  uploadedAt: Date;
  onClear: () => void;
  onReanalyze?: () => void;
  isLoading?: boolean;
}

export function DocumentContextBar({
  filename,
  charCount,
  pageCount,
  uploadedAt,
  onClear,
  onReanalyze,
  isLoading = false,
}: DocumentContextBarProps) {
  const timeStr = uploadedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl glass-card border border-primary/20 animate-fade-in-up mb-3">
      {/* File icon */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <FileText className="h-3.5 w-3.5 text-primary" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Loaded at {timeStr}
            {pageCount != null &&
              ` · ${pageCount} page${pageCount !== 1 ? "s" : ""}`}
            {charCount != null && ` · ${(charCount / 1000).toFixed(1)}k chars`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={isLoading}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all",
              isLoading && "opacity-50 cursor-not-allowed",
            )}
            title="Re-analyze with different persona"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
          </button>
        )}
        <button
          onClick={onClear}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          title="Clear document"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
