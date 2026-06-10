"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { cn } from "./cn";

/**
 * Dialog/modal leve (estilo shadcn/ui, sem dependência externa).
 * Suporta uso controlado (`open`/`onOpenChange`) ou não controlado via
 * <DialogTrigger>. Fecha com overlay, Escape ou <DialogClose>.
 */

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog deve ser usado dentro de <Dialog>");
  return context;
}

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const titleId = useId();

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId }}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { setOpen } = useDialog();
  return (
    <button type="button" onClick={() => setOpen(true)} className={className}>
      {children}
    </button>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { open, setOpen, titleId } = useDialog();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-bubble border border-primary-100 bg-white p-6 shadow-brand-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { titleId } = useDialog();
  return (
    <h2 id={titleId} className={cn("text-xl font-extrabold text-primary-700", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={cn("mt-1 text-sm text-ink-muted", className)}>{children}</p>;
}

export function DialogClose({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { setOpen } = useDialog();
  return (
    <button type="button" onClick={() => setOpen(false)} className={className}>
      {children}
    </button>
  );
}
