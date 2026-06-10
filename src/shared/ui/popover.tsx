"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "./cn";

/**
 * Popover leve (estilo shadcn/ui, sem dependência externa).
 * Fecha com clique fora ou Escape. Uso:
 *
 * <Popover>
 *   <PopoverTrigger>Filtro</PopoverTrigger>
 *   <PopoverContent>…</PopoverContent>
 * </Popover>
 */

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopover(): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) throw new Error("usePopover deve ser usado dentro de <Popover>");
  return context;
}

export function Popover({ className, children }: { className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, contentId }}>
      <div ref={rootRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { open, setOpen, contentId } = usePopover();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  align = "start",
  children,
}: {
  className?: string;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const { open, contentId } = usePopover();
  if (!open) return null;

  return (
    <div
      id={contentId}
      className={cn(
        "absolute top-full z-50 mt-2 min-w-56 rounded-2xl border border-primary-100 bg-white p-2 shadow-brand",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
