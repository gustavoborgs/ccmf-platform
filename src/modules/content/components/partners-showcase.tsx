import Image from "next/image";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import type { PartnerType } from "../validators";

type Partner = {
  id: string;
  name: string;
  type: PartnerType;
  logoKey: string | null;
  url: string | null;
};

const GROUPS: { type: PartnerType; title: string; description: string }[] = [
  {
    type: "MASTER",
    title: "Parceiros master",
    description: "Marcas que tornam o concurso possível.",
  },
  {
    type: "MEDIA",
    title: "Veículos de comunicação",
    description: "Apoio na divulgação das edições.",
  },
  {
    type: "SPONSOR",
    title: "Patrocinadores",
    description: "Empresas que premiam os destaques.",
  },
];

/** Três vitrines de parceiros da home (docs/modules/content.md). */
export function PartnersShowcase({ partners }: { partners: Partner[] }) {
  const groups = GROUPS.map((group) => ({
    ...group,
    items: partners.filter((partner) => partner.type === group.type),
  })).filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section
          key={group.type}
          className="rounded-bubble border border-primary-100/80 bg-white/85 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary-100/70 pb-4">
            <h3 className="font-display text-xl font-extrabold text-primary-700">{group.title}</h3>
            <p className="text-sm text-ink-muted">{group.description}</p>
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {group.items.map((partner) => (
              <li key={partner.id}>
                <PartnerBadge partner={partner} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PartnerBadge({ partner }: { partner: Partner }) {
  const content = partner.logoKey ? (
    <Image
      src={getPublicUrl(partner.logoKey)}
      alt={partner.name}
      width={160}
      height={80}
      className="h-11 w-auto max-w-32 object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
    />
  ) : (
    <span className="text-center font-display text-base font-extrabold text-ink-muted transition duration-300 group-hover:text-primary-700">
      {partner.name}
    </span>
  );

  const badgeClasses =
    "group flex h-20 w-full items-center justify-center rounded-3xl border border-primary-100 " +
    "bg-white px-5 transition duration-300 hover:border-primary-200 hover:bg-surface " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200";

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        title={partner.name}
        className={badgeClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <div title={partner.name} className={badgeClasses}>
      {content}
    </div>
  );
}
