export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  status: "available" | "planned";
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Operação",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "Resumo da operação, inscrições e próximos passos.",
        status: "available",
      },
      {
        href: "/admin/leads",
        label: "CRM de leads",
        description: "Pré-conta e funil derivado das inscrições.",
        status: "available",
      },
      {
        href: "/admin/inscricoes",
        label: "Inscrições",
        description: "Fila de revisão, aprovação e rejeição.",
        status: "available",
      },
      {
        href: "/admin/pagamentos",
        label: "Pagamentos",
        description: "Cobranças, conciliação Asaas e status.",
        status: "available",
      },
    ],
  },
  {
    label: "Pessoas",
    items: [
      {
        href: "/admin/responsaveis",
        label: "Responsáveis",
        description: "Cadastro dos responsáveis e seus participantes.",
        status: "available",
      },
      {
        href: "/admin/participantes",
        label: "Participantes",
        description: "Crianças inscritas por edição, categoria e status.",
        status: "available",
      },
      {
        href: "/admin/julgamento",
        label: "Julgamento",
        description: "Ranking técnico, jurados e promoção de resultados.",
        status: "planned",
      },
    ],
  },
  {
    label: "Site",
    items: [
      {
        href: "/admin/concursos",
        label: "Concursos",
        description: "Edições, categorias, taxa, regulamento e moldura.",
        status: "available",
      },
      {
        href: "/admin/conteudo",
        label: "Conteúdo",
        description: "Blog, vídeos, parceiros e mensagens de contato.",
        status: "planned",
      },
      {
        href: "/admin/configuracoes",
        label: "Configurações",
        description: "Espaço reservado para automações e ajustes futuros.",
        status: "planned",
      },
    ],
  },
];
