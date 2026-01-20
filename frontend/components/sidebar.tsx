"use client"

import { useState } from "react"
import { CheckCircle2, HelpCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="w-80 space-y-4">
      {/* Safety Indicator */}
      <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-warning"></div>
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-warning animate-pulse"></div>
          </div>
          <span className="text-sm font-medium">Caution: Ambiguity Detected</span>
        </div>
      </div>

      {/* Next Action Card */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Next Action</span>
        </div>
        <p className="text-sm leading-relaxed">
          <strong>Do not auto-renew.</strong> Request explicit renewal in writing to retain flexibility for rate
          renegotiation.
        </p>
      </div>

      {/* Reasoning Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between bg-transparent"
        onClick={() => setShowReasoning(!showReasoning)}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Show Reasoning
        </span>
      </Button>

      {showReasoning && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Legal Agent</p>
              <p className="text-xs text-muted-foreground mt-1">
                Found auto-renewal clause. No explicit opt-out mechanism detected.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Financial Agent</p>
              <p className="text-xs text-muted-foreground mt-1">
                Annual renewal cost: $120,000. Rate locked for 3 years.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Secured by</p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Bank-level encryption
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Zero data training
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Privacy guaranteed
          </div>
        </div>
      </div>
    </div>
  )
}
