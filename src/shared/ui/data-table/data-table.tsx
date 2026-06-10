import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import type { DataTableColumn } from "./types";

/**
 * Tabela genérica das listagens administrativas. Server Component puro:
 * as células são funções de render definidas na página (colunas tipadas
 * pelo retorno do service).
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro encontrado.",
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column.id} className={column.headClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="py-10 text-center text-ink-muted">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
