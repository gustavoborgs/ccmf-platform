"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { createVoucher, updateVoucher } from "./service";
import { voucherFormSchema } from "./validators";

/**
 * Server Actions administrativas do módulo Vouchers.
 * Spec: docs/modules/vouchers.md
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateVouchers(voucherId?: string) {
  revalidatePath("/admin/vouchers");
  if (voucherId) revalidatePath(`/admin/vouchers/${voucherId}`);
}

export async function createVoucherAction(
  input: unknown,
): Promise<ActionResult<{ voucherId: string }>> {
  await requireRole("ADMIN");

  const parsed = voucherFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const voucher = await createVoucher(parsed.data);
    revalidateVouchers(voucher.id);
    return { ok: true, data: { voucherId: voucher.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateVoucherAction(
  voucherId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = voucherFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateVoucher(voucherId, parsed.data);
    revalidateVouchers(voucherId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
