import { notFound } from "next/navigation";
import { AdminPlaceholderPage } from "../_components/admin-placeholder-page";

const SECTION_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    spec: string;
    items: string[];
  }
> = {
  leads: {
    title: "CRM de leads",
    description:
      "Board para recuperar abandono pré-conta e acompanhar o funil derivado das inscrições.",
    spec: "docs/modules/leads.md",
    items: [
      "Coluna pré-conta com leads NEW capturados no wizard.",
      "Colunas pós-conta derivadas de Registration, sem duplicar estado.",
      "Ações futuras de descarte manual e automações de WhatsApp/e-mail.",
    ],
  },
  inscricoes: {
    title: "Inscrições",
    description:
      "Fila operacional para acompanhar inscrições, fotos, pagamento e revisão editorial.",
    spec: "docs/modules/registrations.md",
    items: [
      "Filtrar por edição, categoria e status da máquina Registration.status.",
      "Revisar inscrições pagas antes da publicação pública.",
      "Aprovar, rejeitar com motivo e preparar reativação futura de inscrições recusadas.",
    ],
  },
  pagamentos: {
    title: "Pagamentos",
    description:
      "Acompanhamento das cobranças Asaas e conciliação de status de pagamento.",
    spec: "docs/modules/payments.md",
    items: [
      "Consultar cobranças por inscrição e responsável.",
      "Auditar status PENDING, CONFIRMED, RECEIVED, OVERDUE, REFUNDED e CANCELED.",
      "Usar webhooks como fonte de verdade e polling apenas como conciliação ativa.",
    ],
  },
  responsaveis: {
    title: "Responsáveis",
    description: "Visão administrativa dos responsáveis, dados de contato e participantes.",
    spec: "docs/modules/guardians.md",
    items: [
      "Listar nome, e-mail, telefone, número de participantes e inscrições pagas.",
      "Buscar por nome, e-mail ou CPF com cuidado para dados sensíveis.",
      "Detalhar participantes, pagamentos e vínculo com lead correspondente.",
    ],
  },
  participantes: {
    title: "Participantes",
    description:
      "Gestão administrativa das crianças inscritas por edição, categoria e status.",
    spec: "docs/modules/guardians.md + docs/modules/participants.md",
    items: [
      "Filtrar por ano, categoria e status de inscrição.",
      "Visualizar fotos enviadas, responsável, pagamento e dados não públicos.",
      "Garantir que somente aprovados sejam expostos na galeria pública.",
    ],
  },
  julgamento: {
    title: "Julgamento",
    description: "Área planejada para ranking técnico, jurados e promoção dos resultados.",
    spec: "docs/modules/judging.md",
    items: [
      "Rodada 1 promove aprovados para semifinalistas.",
      "Rodada 2 promove semifinalistas para vencedores.",
      "Admin vê ranking consolidado e executa promoção explícita dos selecionados.",
    ],
  },
  concursos: {
    title: "Concursos",
    description: "Gestão das edições anuais, categorias, regulamento, taxa e moldura.",
    spec: "docs/modules/contests.md",
    items: [
      "CRUD de edições do concurso e status da máquina Contest.status.",
      "Categorias por edição com faixas etárias em meses.",
      "Moldura, regulamento e data de revelação vinculados à edição.",
    ],
  },
  conteudo: {
    title: "Conteúdo",
    description: "Área planejada para conteúdo institucional, blog, vídeos e parceiros.",
    spec: "docs/modules/content.md",
    items: [
      "CRUD de posts em markdown, vídeos do YouTube e parceiros.",
      "Inbox de mensagens enviadas pelo formulário de contato.",
      "Publicação controlada por publishedAt e flags de ativo.",
    ],
  },
  configuracoes: {
    title: "Configurações",
    description: "Espaço reservado para ajustes operacionais e futuras automações.",
    spec: "evolução futura",
    items: [
      "Templates e cadências de comunicação.",
      "Preferências operacionais da plataforma.",
      "Novas integrações administrativas após criação de spec própria.",
    ],
  },
};

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = SECTION_CONTENT[section];
  if (!content) notFound();

  return <AdminPlaceholderPage {...content} />;
}
