export function BrowserFrame() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-full bg-destructive"></div>
            <div className="h-3 w-3 rounded-full bg-warning"></div>
            <div className="h-3 w-3 rounded-full bg-muted/50"></div>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <p className="text-muted-foreground font-medium">Reviewing Contract Clause 4.2</p>
              <p className="text-xs text-muted-foreground mt-1">Standard commercial lease agreement</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-muted/50 text-xs flex items-center gap-2">
              <span>Processing</span>
              <div className="h-2 w-2 rounded-full bg-primary animate-dot-pulse"></div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Form field: Annual Rent Amount"
                className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Select auto-renewal option...</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="space-y-3 text-xs">
              <div className="animate-guidance-item guidance-item-1 flex items-start gap-3 pl-3 border-l-2 border-warning py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0 mt-1"></div>
                <span className="text-muted-foreground">Clause 4.2: Auto-renewal clause detected</span>
              </div>
              <div className="animate-guidance-item guidance-item-2 flex items-start gap-3 pl-3 border-l-2 border-accent py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0 mt-1"></div>
                <span className="text-muted-foreground">Your liability is capped at 12 months</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
