"use client"

import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface NavigationProps {
  currentSection: string
  setCurrentSection: (section: string) => void
}

export function Navigation({ currentSection, setCurrentSection }: NavigationProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const newIsDark = !isDark
    setIsDark(newIsDark)
    if (newIsDark) {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }
    localStorage.setItem("theme", newIsDark ? "dark" : "light")
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border glass-effect">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">RuleGuard</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => setCurrentSection("home")}
              className={`text-sm transition-colors ${
                currentSection === "home" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Product
            </button>
            <button
              onClick={() => setCurrentSection("demo")}
              className={`text-sm transition-colors ${
                currentSection === "demo" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setCurrentSection("pricing")}
              className={`text-sm transition-colors ${
                currentSection === "pricing"
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pricing
            </button>
            <button
              onClick={() => setCurrentSection("docs")}
              className={`text-sm transition-colors ${
                currentSection === "docs" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Docs
            </button>
          </div>

          {/* Right side: Theme toggle and CTA buttons */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            )}
            <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
              Sign In
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
