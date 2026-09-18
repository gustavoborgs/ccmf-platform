import Link from "next/link";
import { VoucherForm } from "@/modules/vouchers/components/voucher-form";
import { Card } from "@/shared/ui";

export default function NewVoucherPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/vouchers"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para vouchers
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Novo voucher</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Defina o código, o desconto em reais, o limite de usos e a validade opcional.
        </p>
      </section>

      <Card className="p-5 sm:p-6">
        <VoucherForm />
      </Card>
    </div>
  );
}
