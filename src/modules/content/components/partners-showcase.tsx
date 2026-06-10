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
    <div className="grid gap-12">
      {groups.map((group) => (
        <section key={group.type} className="border-t border-primary-100/70 pt-8 first:border-t-0 first:pt-0">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="font-display text-xl font-extrabold text-primary-700">{group.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{group.description}</p>
          </div>

          <ul className="mx-auto mt-8 grid max-w-5xl grid-cols-2 place-items-center gap-x-6 gap-y-9 sm:grid-cols-3 sm:gap-x-10 lg:grid-cols-5">
            {group.items.map((partner) => (
              <li key={partner.id} className="flex w-full justify-center">
                <PartnerLogo partner={partner} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const logo = partner.logoKey ? (
    <span className="flex h-14 w-full items-center justify-center sm:h-16">
      <Image
        src={getPublicUrl(partner.logoKey)}
        alt=""
        width={176}
        height={88}
        className="max-h-12 w-auto max-w-32 object-contain opacity-55 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:max-h-14 sm:max-w-36"
      />
    </span>
  ) : (
    <span className="flex h-14 w-full items-center justify-center rounded-3xl bg-surface-muted px-4 text-center font-display text-base font-extrabold text-primary-700 sm:h-16">
      {getInitials(partner.name)}
    </span>
  );

  const partnerClasses =
    "group flex w-full max-w-40 flex-col items-center gap-2 px-2 py-1 text-center transition duration-300 " +
    "focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200";

  const content = (
    <>
      {logo}
      <span className="line-clamp-2 min-h-9 text-xs font-bold leading-snug text-ink-muted transition duration-300 group-hover:text-primary-700 sm:text-sm">
        {partner.name}
      </span>
    </>
  );

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        title={partner.name}
        className={partnerClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <div title={partner.name} className={partnerClasses}>
      {content}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
