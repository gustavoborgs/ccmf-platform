import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/** Validação das bordas do módulo Payments. Spec: docs/modules/payments.md */

export const creditCardSchema = z.object({
  holderName: z.string().min(3, "Informe o nome impresso no cartão"),
  number: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Número do cartão inválido")),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Mês inválido (MM)"),
  expiryYear: z
    .string()
    .transform((value) => (value.length === 2 ? `20${value}` : value))
    .pipe(z.string().regex(/^20\d{2}$/, "Ano inválido (AAAA)")),
  ccv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});

export const checkoutInputSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("PIX"), registrationId: z.string().min(1) }),
  z.object({ method: z.literal("BOLETO"), registrationId: z.string().min(1) }),
  z.object({
    method: z.literal("CREDIT_CARD"),
    registrationId: z.string().min(1),
    creditCard: creditCardSchema,
  }),
]);

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type CreditCardInput = z.infer<typeof creditCardSchema>;

/** Filtros da listagem administrativa de cobranças (`/admin/pagamentos`). */
export const ADMIN_PAYMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "RECEIVED",
  "OVERDUE",
  "REFUNDED",
  "CANCELED",
  "FAILED",
] as const;

export const ADMIN_PAYMENT_METHODS = ["PIX", "BOLETO", "CREDIT_CARD"] as const;

export const adminPaymentFiltersSchema = z.object({
  q: textParam,
  status: enumParam(ADMIN_PAYMENT_STATUSES),
  method: enumParam(ADMIN_PAYMENT_METHODS),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminPaymentFilters = z.infer<typeof adminPaymentFiltersSchema>;
