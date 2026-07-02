"use client";

import { useEffect, useState } from "react";

/** Barra de progresso de leitura fixa no topo da página do capítulo. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const value = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(value);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1 bg-primary-100"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso de leitura"
    >
      <div
        className="h-full bg-brand-gradient transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
