"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "../cn";
import type { DataTablePaginationMeta } from "./types";

/**
 * Rodapé de paginação das listagens. Constrói os links a partir da URL
 * atual, então busca/filtros são preservados automaticamente.
 */
export function DataTablePagination({ pagination }: { pagination: DataTablePaginationMeta }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { page, pageSize, total, totalPages } = pagination;

  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  function pageHref(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-primary-100 px-5 py-4 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        Mostrando{" "}
        <strong className="text-primary-700">
          {firstItem}-{lastItem}
        </strong>{" "}
        de <strong className="text-primary-700">{total}</strong> registros
      </p>
      <div className="flex items-center gap-2">
        <PageLink href={pageHref(page - 1)} disabled={page <= 1}>
          Anterior
        </PageLink>
        <span className="px-2 font-bold text-primary-700">
          {page}/{totalPages}
        </span>
        <PageLink href={pageHref(page + 1)} disabled={page >= totalPages}>
          Próxima
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const classes = "rounded-full border border-primary-100 px-4 py-2 font-bold transition";

  if (disabled) {
    return <span className={cn(classes, "text-primary-200")}>{children}</span>;
  }
  return (
    <Link href={href} className={cn(classes, "text-primary-700 hover:bg-primary-50")}>
      {children}
    </Link>
  );
}
