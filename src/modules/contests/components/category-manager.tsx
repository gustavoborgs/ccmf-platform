"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from "@/shared/ui";
import { formatAgeRange } from "@/shared/utils";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  updateCategoryAction,
} from "../actions";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  order: number;
  registrationsCount: number;
};

/**
 * Gestão das categorias (faixas etárias em meses) de uma edição:
 * criar, editar, reordenar e excluir. As regras (sobreposição de faixas,
 * exclusão com inscrições) são validadas no service.
 */
export function CategoryManager({
  contestId,
  categories,
}: {
  contestId: string;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; category: CategoryRow } | { mode: "delete"; category: CategoryRow } | null
  >(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function refreshAndClose() {
    setDialog(null);
    router.refresh();
  }

  function handleMove(categoryId: string, direction: "up" | "down") {
    setRowError(null);
    startTransition(async () => {
      const result = await moveCategoryAction({ categoryId, direction });
      if (!result.ok) {
        setRowError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 px-5 py-4">
        <div>
          <h2 className="text-xl font-extrabold text-primary-700">Categorias</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Faixas etárias em meses completos na data da inscrição. As faixas não podem se
            sobrepor.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setDialog({ mode: "create" })}>
          Nova categoria
        </Button>
      </div>

      {rowError && (
        <p className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {rowError}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24">Ordem</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Faixa etária</TableHead>
            <TableHead>Meses</TableHead>
            <TableHead>Inscrições</TableHead>
            <TableHead className="w-40 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-10 text-center text-ink-muted">
                Nenhuma categoria cadastrada. Crie a primeira faixa etária desta edição.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MoveButton
                      label="Subir"
                      disabled={isPending || index === 0}
                      onClick={() => handleMove(category.id, "up")}
                    >
                      ↑
                    </MoveButton>
                    <MoveButton
                      label="Descer"
                      disabled={isPending || index === categories.length - 1}
                      onClick={() => handleMove(category.id, "down")}
                    >
                      ↓
                    </MoveButton>
                    <span className="ml-1 text-sm font-bold text-primary-700">{index + 1}º</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-bold">{category.name}</p>
                  <p className="text-ink-muted">{category.slug}</p>
                </TableCell>
                <TableCell className="font-semibold text-primary-700">
                  {formatAgeRange(category.minAgeMonths, category.maxAgeMonths)}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {category.minAgeMonths}–{category.maxAgeMonths}
                </TableCell>
                <TableCell>{category.registrationsCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDialog({ mode: "edit", category })}
                      className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog({ mode: "delete", category })}
                      disabled={category.registrationsCount > 0}
                      title={
                        category.registrationsCount > 0
                          ? "Categoria com inscrições não pode ser excluída."
                          : undefined
                      }
                      className="rounded-full border border-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Excluir
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {(dialog?.mode === "create" || dialog?.mode === "edit") && (
        <CategoryFormDialog
          contestId={contestId}
          category={dialog.mode === "edit" ? dialog.category : null}
          onClose={() => setDialog(null)}
          onSaved={refreshAndClose}
        />
      )}

      {dialog?.mode === "delete" && (
        <DeleteCategoryDialog
          category={dialog.category}
          onClose={() => setDialog(null)}
          onDeleted={refreshAndClose}
        />
      )}
    </div>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-100 text-sm font-bold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function CategoryFormDialog({
  contestId,
  category,
  onClose,
  onSaved,
}: {
  contestId: string;
  category: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(category?.name ?? "");
  const [minAge, setMinAge] = useState(category ? String(category.minAgeMonths) : "");
  const [maxAge, setMaxAge] = useState(category ? String(category.maxAgeMonths) : "");

  const minMonths = Number(minAge);
  const maxMonths = Number(maxAge);
  const validRange =
    minAge !== "" &&
    maxAge !== "" &&
    Number.isInteger(minMonths) &&
    Number.isInteger(maxMonths) &&
    maxMonths >= minMonths;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = { name, minAgeMonths: minMonths, maxAgeMonths: maxMonths };

    startTransition(async () => {
      const result = category
        ? await updateCategoryAction({ categoryId: category.id, category: payload })
        : await createCategoryAction({ contestId, category: payload });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{category ? `Editar ${category.name}` : "Nova categoria"}</DialogTitle>
        <DialogDescription>
          Idades em <strong>meses completos</strong> na data da inscrição (ex.: Bebê = 0 a 10).
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Nome" hint='Ex.: "Bebê", "Mirim", "Infantil"'>
            <TextInput
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              placeholder="Bebê"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Idade mínima (meses)">
              <TextInput
                type="number"
                required
                min={0}
                max={240}
                value={minAge}
                onChange={(event) => setMinAge(event.target.value)}
                disabled={isPending}
                placeholder="0"
              />
            </Field>
            <Field label="Idade máxima (meses)">
              <TextInput
                type="number"
                required
                min={0}
                max={240}
                value={maxAge}
                onChange={(event) => setMaxAge(event.target.value)}
                disabled={isPending}
                placeholder="10"
              />
            </Field>
          </div>

          <p className="rounded-2xl bg-primary-50/60 px-4 py-3 text-sm text-ink-muted">
            {validRange ? (
              <>
                Faixa:{" "}
                <strong className="text-primary-700">{formatAgeRange(minMonths, maxMonths)}</strong>
              </>
            ) : (
              "Preencha a faixa em meses para ver o resumo."
            )}
          </p>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
              Cancelar
            </DialogClose>
            <Button type="submit" size="sm" disabled={isPending || !validRange}>
              {isPending ? "Salvando..." : category ? "Salvar categoria" : "Criar categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
  category,
  onClose,
  onDeleted,
}: {
  category: CategoryRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Excluir {category.name}?</DialogTitle>
        <DialogDescription>
          A categoria ({formatAgeRange(category.minAgeMonths, category.maxAgeMonths)}) será removida
          desta edição. Esta ação não pode ser desfeita.
        </DialogDescription>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
            Cancelar
          </DialogClose>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir categoria"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
