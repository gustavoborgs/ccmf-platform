"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, cn } from "@/shared/ui";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-primary-700 transition hover:bg-primary-50"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="h-6 w-6"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-primary-100 bg-white shadow-brand">
          <nav className="flex flex-col px-4 py-3">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === link.href : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 font-semibold transition",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-ink-muted hover:bg-primary-50 hover:text-primary-700",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 flex gap-3 border-t border-primary-100 pt-4 pb-2">
              <Button href="/entrar" variant="outline" size="sm" className="flex-1">
                Entrar
              </Button>
              <Button href="/inscricao" size="sm" className="flex-1">
                Inscrição
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
