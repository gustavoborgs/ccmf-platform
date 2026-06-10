import Link from "next/link";
import { notFound } from "next/navigation";
import { PartnerForm } from "@/modules/content/components/partner-form";
import { getAdminPartnerById } from "@/modules/content/service";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card } from "@/shared/ui";

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await getAdminPartnerById(id);
  if (!partner) notFound();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/parceiros"
            className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
          >
            ← Voltar para parceiros
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-primary-700">{partner.name}</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Edite tipo, status, ordem, URL e logo deste parceiro.
          </p>
        </div>
        {partner.active && partner.url && (
          <Button href={partner.url} variant="outline" target="_blank" rel="noopener noreferrer">
            Abrir site
          </Button>
        )}
      </section>

      <Card className="p-5 sm:p-6">
        <PartnerForm
          initial={{
            id: partner.id,
            name: partner.name,
            type: partner.type,
            logoKey: partner.logoKey,
            logoUrl: partner.logoKey ? getPublicUrl(partner.logoKey) : null,
            url: partner.url,
            order: partner.order,
            active: partner.active,
          }}
        />
      </Card>
    </div>
  );
}
