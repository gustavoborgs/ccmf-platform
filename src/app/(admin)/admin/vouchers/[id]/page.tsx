import Link from "next/link";
import { notFound } from "next/navigation";
import { VoucherForm } from "@/modules/vouchers/components/voucher-form";
import { getAdminVoucher } from "@/modules/vouchers/service";
import { formatCentsBRL } from "@/shared/utils";
import { Card } from "@/shared/ui";
import { formatDateTime, StatusBadge } from "../../_components/admin-ui";

const redemptionStatusLabel: Record<string, string> = {
  RESERVED: "Reservado",
  CONFIRMED: "Confirmado",
  RELEASED: "Liberado",
};

const redemptionStatusTone: Record<string, "warning" | "success" | "neutral"> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  RELEASED: "neutral",
};

export default async function AdminVoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucher = await getAdminVoucher(id);
  if (!voucher) notFound();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/vouchers"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para vouchers
        </Link>
        <h1 className="mt-3 break-all font-mono text-2xl font-extrabold text-primary-700 sm:text-3xl">
          {voucher.code}
        </h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Edite validade, limite e status. Código e desconto ficam bloqueados após o primeiro uso.
        </p>
      </section>

      <Card className="p-5 sm:p-6">
        <VoucherForm
          initial={{
            id: voucher.id,
            code: voucher.code,
            description: voucher.description,
            discountCents: voucher.discountCents,
            maxUses: voucher.maxUses,
            startsAt: voucher.startsAt,
            endsAt: voucher.endsAt,
            active: voucher.active,
            confirmedCount: voucher.confirmedCount,
            reservedCount: voucher.reservedCount,
            hasAnyRedemption: voucher.hasAnyRedemption,
          }}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-primary-100 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold text-primary-700">
            Últimas utilizações
          </h2>
          <p className="text-sm text-ink-muted">Até 50 redemptions mais recentes.</p>
        </div>
        {voucher.redemptions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-muted">Nenhum uso registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-primary-50">
            {voucher.redemptions.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="break-all font-mono font-bold text-primary-800">
                    {item.registration.protocol}
                  </p>
                  <p className="break-words text-sm text-ink-muted">
                    {item.guardian.user.name} · {item.guardian.user.email}
                  </p>
                  <p className="text-xs text-ink-muted">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:text-right">
                  <StatusBadge tone={redemptionStatusTone[item.status] ?? "neutral"}>
                    {redemptionStatusLabel[item.status] ?? item.status}
                  </StatusBadge>
                  <p className="text-sm font-bold text-ink">
                    {formatCentsBRL(item.discountCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
