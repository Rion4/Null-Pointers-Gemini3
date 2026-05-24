"use client";

import { useRef, useCallback } from "react";

export function use3dTilt(intensity = 10) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0 → 1
      const y = (e.clientY - rect.top) / rect.height;    // 0 → 1
      const rotX = (y - 0.5) * -intensity;               // tilt up/down
      const rotY = (x - 0.5) * intensity;                // tilt left/right
      // Also shift a subtle inner glow based on cursor position
      el.style.setProperty("--tilt-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--tilt-y", `${e.clientY - rect.top}px`);
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
      el.style.transition = "transform 0.08s linear";
    },
    [intensity]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    el.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
