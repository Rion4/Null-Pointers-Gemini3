
"use client";

import { Shield, MessageSquare, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationProps {
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

export function Navigation({
  currentSection,
  setCurrentSection,
}: NavigationProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const isHome = pathname === "/";
  const isChat = pathname === "/chat";

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "glass-effect border-b border-border/50 backdrop-blur-xl"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-all group"
          >
            <div className="relative">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-all" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              RuleGuard
            </span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                isHome
                  ? "text-primary font-medium bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => router.push("/chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                isChat
                  ? "text-primary font-medium bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </button>
          </div>

          {/* Right side: Theme toggle */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-xl p-2.5 transition-all hover:bg-muted hover:scale-110 active:scale-95"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}