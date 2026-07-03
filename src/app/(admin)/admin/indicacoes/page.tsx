import { listContestFilterOptions } from "@/modules/contests/service";
import { AdminCampaignForm } from "@/modules/referrals/components/admin-campaign-form";
import { listAdminCampaigns } from "@/modules/referrals/service";
import { Card, DataTable, type DataTableColumn } from "@/shared/ui";
import { formatDateTime, StatusBadge } from "../_components/admin-ui";

type CampaignRow = Awaited<ReturnType<typeof listAdminCampaigns>>[number];

const columns: DataTableColumn<CampaignRow>[] = [
  {
    id: "contest",
    header: "Edição",
    cell: (campaign) => (
      <div>
        <p className="font-bold">{campaign.contest.year}</p>
        <p className="text-ink-muted">{campaign.contest.name}</p>
      </div>
    ),
  },
  {
    id: "name",
    header: "Campanha",
    cell: (campaign) => (
      <div>
        <p className="font-bold">{campaign.name}</p>
        <p className="text-ink-muted">{campaign.rewardLikesCount} curtidas por indicação aprovada</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (campaign) => (
      <StatusBadge tone={campaign.enabled ? "success" : "neutral"}>
        {campaign.enabled ? "Ativa" : "Desligada"}
      </StatusBadge>
    ),
  },
  {
    id: "period",
    header: "Período",
    cell: (campaign) => (
      <div className="text-sm text-ink-muted">
        <p>Início: {campaign.startsAt ? formatDateTime(campaign.startsAt) : "Sem limite"}</p>
        <p>Fim: {campaign.endsAt ? formatDateTime(campaign.endsAt) : "Sem limite"}</p>
      </div>
    ),
  },
  {
    id: "referrals",
    header: "Indicações",
    cell: (campaign) => <span className="font-bold">{campaign._count.referrals}</span>,
  },
];

export default async function AdminReferralsPage() {
  const [contests, campaigns] = await Promise.all([listContestFilterOptions(), listAdminCampaigns()]);
  const activeCampaign = campaigns[0];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold text-primary-700">Indicações</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Configure campanhas por edição. Quando uma inscrição indicada é aprovada, o participante
          que indicou recebe curtidas bônus na inscrição dele na mesma edição.
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <h2 className="text-xl font-extrabold text-primary-700">Campanha</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Uma campanha por edição. O link de compartilhamento usa{" "}
          <code className="rounded bg-primary-50 px-1">/inscricao?indicacao=CODIGO</code>.
        </p>
        <div className="mt-6">
          <AdminCampaignForm
            contests={contests}
            initial={
              activeCampaign
                ? {
                    contestId: activeCampaign.contestId,
                    name: activeCampaign.name,
                    enabled: activeCampaign.enabled,
                    rewardLikesCount: activeCampaign.rewardLikesCount,
                    startsAt: activeCampaign.startsAt?.toISOString(),
                    endsAt: activeCampaign.endsAt?.toISOString(),
                  }
                : undefined
            }
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-extrabold text-primary-700">Campanhas cadastradas</h2>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={campaigns}
            rowKey={(campaign) => campaign.id}
            emptyMessage="Nenhuma campanha cadastrada."
          />
        </div>
      </Card>
    </div>
  );
}
