"use client"
import { Sidebar } from "@/components/sidebar"
import { BrowserFrame } from "@/components/browser-frame"

export function BrowserDemo() {
  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Live Assistance. Real Results.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how RuleGuard provides real-time guidance while you work on critical tasks
          </p>
        </div>

        <div className="relative">
          <div className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <BrowserFrame />
            </div>
            <div className="hidden lg:block">
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
