const LINKS = {
  Product:     ["Analysis", "Compare", "History", "API"],
  "Use Cases": ["NDAs", "Employment", "SaaS Contracts", "Vendor Terms"],
  Resources:   ["Documentation", "Blog", "Changelog", "Status"],
  Company:     ["About", "Privacy", "Terms", "Contact"],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border px-6 lg:px-8 pt-16 pb-10">
      <div className="mx-auto max-w-7xl">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">

          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="footer-shield-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="#4285F4" />
                    <stop offset="33%"  stopColor="#EA4335" />
                    <stop offset="66%"  stopColor="#FBBC04" />
                    <stop offset="100%" stopColor="#34A853" />
                  </linearGradient>
                </defs>
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="url(#footer-shield-g)" />
              </svg>
              <span className="font-semibold text-[15px] text-foreground">ClauseGuard</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              AI-powered contract risk analysis for everyone.
            </p>
          </div>

          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
                {heading}
              </p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {year} ClauseGuard. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
