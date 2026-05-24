"use client";

import { useEffect } from "react";

/**
 * Tracks cursor position and writes --cursor-x / --cursor-y to :root.
 * The CSS uses these for a radial gradient spotlight that follows the cursor.
 * No DOM node — purely a side-effect component.
 */
export function CursorSpotlight() {
  useEffect(() => {
    const root = document.documentElement;

    const onMove = (e: MouseEvent) => {
      root.style.setProperty("--cursor-x", `${e.clientX}px`);
      root.style.setProperty("--cursor-y", `${e.clientY}px`);
    };

    // Start spotlight off-screen so it doesn't flash at 0,0 on load
    root.style.setProperty("--cursor-x", "-500px");
    root.style.setProperty("--cursor-y", "-500px");

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return null;
}
