import type { ReactNode } from "react";

/**
 * Contratos do kit DataTable.
 *
 * O estado de filtros/busca/paginação vive na URL (searchParams): a página
 * (Server Component) valida com Zod, consulta o service paginado e renderiza
 * `DataTableToolbar` + `DataTable` + `DataTablePagination`.
 */

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** classes extras aplicadas no <th> */
  headClassName?: string;
  /** classes extras aplicadas no <td> */
  cellClassName?: string;
};

export type DataTableFilterOption = {
  value: string;
  label: string;
};

export type DataTableFilter = {
  /** nome do parâmetro na URL (ex.: "status") */
  id: string;
  label: string;
  options: DataTableFilterOption[];
};

export type DataTablePaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
