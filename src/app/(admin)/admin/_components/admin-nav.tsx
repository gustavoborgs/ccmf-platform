"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/ui";
import { ADMIN_NAV_GROUPS } from "./admin-nav-data";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 font-display text-xs font-extrabold uppercase tracking-widest text-primary-700/60">
            {group.label}
          </p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => {
              const active =
                item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                    active
                      ? "bg-primary-700 text-white shadow-brand"
                      : "text-ink-muted hover:bg-primary-50 hover:text-primary-700",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {item.label}
                    {item.status === "planned" && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                          active ? "bg-white/20 text-white" : "bg-accent-50 text-accent-700",
                        )}
                      >
                        Futuro
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
