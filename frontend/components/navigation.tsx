"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

function ShieldLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-shield-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#4285F4" />
          <stop offset="33%"  stopColor="#EA4335" />
          <stop offset="66%"  stopColor="#FBBC04" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        fill="url(#nav-shield-g)"
      />
    </svg>
  );
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [isDark,   setIsDark]   = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    next ? html.classList.add("dark") : html.classList.remove("dark");
    localStorage.setItem("ruleguard-theme", next ? "dark" : "light");
  };

  const isHome    = pathname === "/";
  const isChat    = pathname === "/chat";
  const isCompare = pathname === "/compare";
  const isHistory = pathname === "/history";

  const link = (label: string, active: boolean, href: string) => (
    <button
      key={href}
      onClick={() => router.push(href)}
      className={`relative text-sm transition-colors duration-150 ${
        active
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-foreground rounded-full" />
      )}
    </button>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_var(--border)]"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150"
          >
            <ShieldLogo />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">
              ClauseGuard
            </span>
          </button>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-7">
            {link("Home",    isHome,    "/")}
            {link("Analyze", isChat,    "/chat")}
            {link("Compare", isCompare, "/compare")}
            {link("History", isHistory, "/history")}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>
            )}

            <button
              onClick={() => router.push("/chat")}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 active:scale-[0.97] transition-all duration-150"
            >
              Analyze
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
