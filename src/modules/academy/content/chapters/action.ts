import { withReadingMinutes } from "../../reading";
import { getDiagramPath, getModuleCoverPath } from "../../visual-assets";

export const fotogeniaPrimeiroPasso = withReadingMinutes({
  slug: "fotogenia-primeiro-passo",
  moduleSlug: "action",
  moduleOrder: 5,
  chapterNumber: 25,
  title: "Fotogenia como primeiro passo estratégico",
  subtitle: "CCMF como entrada segura e inteligente",
  cover: getModuleCoverPath("action"),
  blocks: [
    {
      type: "paragraph",
      text: "Se você quer começar com critério, não com improviso, fotogenia e a melhor porta de entrada. O CCMF te entrega experiência oficial, exposição organizada e aprendizado pratico sem te empurrar para compromisso que sua família ainda não quer assumir.",
    },
    {
      type: "heading",
      level: 2,
      text: "Por que o CCMF faz sentido como primeiro passo",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Entrada acessivel para testar prontidão da criança e da família.",
        "Regulamento, histórico e processo claro de participação.",
        "Matérial oficial para portfolio inicial e apresentação.",
        "Vivencia real de exposição com menor risco financeiro.",
      ],
    },
    {
      type: "image",
      src: getDiagramPath("funnel"),
      alt: "Funil de desenvolvimento: fotogenia, visibilidade, seletividade e oportunidades",
      caption: "No início, o objetivo não é fechar contrato. E construir base com critério.",
    },
    {
      type: "heading",
      level: 2,
      text: "Framework PASSO 4x",
    },
    {
      type: "table",
      headers: ["Etapa", "Objetivo", "Acao prática", "Indicador de avancar"],
      rows: [
        ["Preparar", "organizar entrada", "selecionar fotos e ler regulamento", "inscrição feita sem pressa"],
        ["Apresentar", "ganhar experiência", "participar com rotina preservada", "criança engajada e tranquila"],
        ["Selecionar", "filtrar próximas oportunidades", "avaliar convites com checklist", "proposta coerente com fase"],
        ["Orientar", "decidir próximo ciclo", "ajustar plano 30/60/90", "família alinhada e sem sobrecarga"],
      ],
    },
    {
      type: "quote",
      text: "Comecar pequeno com método vale mais do que entrar grande por ansiedade.",
    },
    {
      type: "caseStudy",
      title: "Primeiro passo que virou processo",
      body: "Familia entrou no CCMF para testar fotogenia da filha de 6 anos. Com a experiência, organizou portfolio, aprendeu a filtrar propostas e evitou contrato precipitado. Em vez de prometer milagre, o processo deu clareza para o próximo passo.",
      takeaway: "CCMF bem usado vira base de decisão, não loteria.",
    },
    {
      type: "alert",
      title: "Não confunda vitrine com carreira",
      body: "Participar de concurso não substitui gestão. O valor esta em usar a experiência para decidir melhor os próximos ciclos.",
    },
    {
      type: "exercise",
      title: "Checklist de início com critério",
      steps: [
        "Defina o objetivo da sua família para este primeiro ciclo.",
        "Valide se as fotos aténdem aos requisitos tecnicos básicos.",
        "Leia regulamento completo e anote duvidas antes de inscrever.",
        "Decida com calma, sem comparação com outras famílias.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "CCMF e primeiro passo seguro para ganhar experiência real.",
        "Fotogenia organiza entrada no mercado sem salto de risco.",
        "Quem começa com critério aumenta chance de continuidade.",
      ],
    },
  ],
});

export const plano306090 = withReadingMinutes({
  slug: "plano-30-60-90",
  moduleSlug: "action",
  moduleOrder: 5,
  chapterNumber: 26,
  title: "Plano 30/60/90 com execução semanal",
  subtitle: "Da intenção para rotina prática",
  cover: getModuleCoverPath("action"),
  blocks: [
    {
      type: "paragraph",
      text: "Agora você vai sair do campo da ideia e entrar no campo da agenda. O plano 30/60/90 funciona quando tem dono, prazo e revisão. Vou te dar um roteiro semana a semana para evitar paralisia e excesso.",
    },
    {
      type: "heading",
      level: 2,
      text: "Dias 1 a 30: fundacao",
    },
    {
      type: "table",
      headers: ["Semana", "Foco", "Entregavel da semana"],
      rows: [
        ["Semana 1", "Diagnostico", "definir objetivo, limite financeiro e limite de agenda"],
        ["Semana 2", "Ativos", "organizar fotos e revisar apresentação básica da criança"],
        ["Semana 3", "Entrada", "concluir inscrição no CCMF ou ação equivalente de baixo risco"],
        ["Semana 4", "Governanca", "registrar rotina, checklist de decisão e pasta de documentos"],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Dias 31 a 60: construção",
    },
    {
      type: "table",
      headers: ["Semana", "Foco", "Entregavel da semana"],
      rows: [
        ["Semana 5", "Repertório", "escolher uma frente de desenvolvimento artístico"],
        ["Semana 6", "Comúnicação", "definir padrão de resposta para propostas"],
        ["Semana 7", "Financeiro", "alimentar planilha de custos e revisar teto mensal"],
        ["Semana 8", "Ajuste", "avaliar sinais da criança e recalibrar carga"],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Dias 61 a 90: consolidacao",
    },
    {
      type: "table",
      headers: ["Semana", "Foco", "Entregavel da semana"],
      rows: [
        ["Semana 9", "Filtro", "classificar convites em aceitar, negociar ou recusar"],
        ["Semana 10", "Contrato", "rodar checklist jurídico em qualquer proposta ativa"],
        ["Semana 11", "Performance", "medir impacto em escola, emoção e convivio familiar"],
        ["Semana 12", "Fechamento", "escrever relatorio de ciclo e novo plano 90 dias"],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Ritual semanal de 20 minutos",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Revisar o que foi combinado e o que foi entregue.",
        "Conferir sinais da criança: energia, motivação e cansaço.",
        "Atualizar planilha de custos e compromissos da semana seguinte.",
        "Escolher apenas uma prioridade principal para a próxima semana.",
      ],
    },
    {
      type: "quote",
      text: "Plano que cabe na semana vira resultado. Plano que só inspira vira frustacao.",
    },
    {
      type: "caseStudy",
      title: "90 dias que tiraram uma família da confusão",
      body: "Responsavel tinha muitas ideias, mas nenhuma rotina. Com plano semanal, ela organizou documentos, reduziu gastos por impulso e passou a decidir proposta com critério. O principal ganho não foi fama, foi governanca.",
      takeaway: "Método semanal cria tranquilidade e melhora decisão.",
    },
    {
      type: "alert",
      title: "Não lote o plano",
      body: "Querer executar tudo no mesmo mês aumenta erro e desgaste. Uma entrega boa por semana vale mais que cinco iniciadas e nenhuma concluida.",
    },
    {
      type: "exercise",
      title: "Montagem do seu sprint da semana",
      steps: [
        "Escolha uma única meta prioritaria para os próximos 7 dias.",
        "Defina dois micro passos executaveis até sexta-feira.",
        "Agende 20 minutos no domingo para revisão de ciclo.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "30/60/90 funciona com disciplina semanal.",
        "Sem dono, prazo e revisão, o plano não sai do papel.",
        "Ritmo consistente vence arrancada ansiosa.",
      ],
    },
  ],
});

export const anexos = withReadingMinutes({
  slug: "anexos",
  moduleSlug: "action",
  moduleOrder: 5,
  chapterNumber: 27,
  title: "Anexos praticos para decisão profissional",
  subtitle: "Templatés, glossario e FAQ de gestão",
  cover: getModuleCoverPath("action"),
  blocks: [
    {
      type: "paragraph",
      text: "Este capítulo e sua central de operação. Sempre que surgir duvida, proposta ou gasto novo, volte aqui. O objetivo e transformar intenção em processo repetível.",
    },
    {
      type: "heading",
      level: 2,
      text: "Templaté 1: checklist de foto para inscrição",
    },
    {
      type: "checklist",
      items: [
        "Foto atual, tirada nos ultimos 6 meses",
        "Rosto visivel, sem obstrucao de cabelo ou acessorio",
        "Iluminacao natural ou uniforme, sem sombra pesada",
        "Fundo simples, sem elementos que distraiam",
        "Expressão natural, sem pose forcada",
        "Roupa neutra e adequada para idade",
        "Imagem nitida, sem borrado",
        "Sem filtro de beleza ou edicao que altere tracos",
        "Enquadramento adequado (rosto e busto em destaque)",
        "Arquivo com tamanho e formato aceitos no regulamento",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Templaté 2: 15 perguntas para agência ou produção",
    },
    {
      type: "checklist",
      items: [
        "Quem é o contratante final da ação?",
        "Qual é o objetivo da campanha e o perfil procurado?",
        "Qual é o cronograma completo de datas e horários?",
        "Qual é o valor bruto e o valor líquido previsto?",
        "Quais comissoes e taxas serao descontadas?",
        "Quando e como o pagamento sera realizado?",
        "Quais custos ficam por conta da família?",
        "Como sera o uso de imagem (prazo, midia, territorio)?",
        "Existe clausula de exclusividade? Em que termos?",
        "Qual é o procedimento de cancelamento ou remarcação?",
        "Havera estrutura adequada para criança e responsável no local?",
        "Quem sera o contato responsável no dia da atividade?",
        "E possível analisar contrato com antecedencia minima de 24h?",
        "Existe autorização complementar separada do contrato principal?",
        "Qual canal oficial para registro de duvidas e ajustes?",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Templaté 3: guia de planilha de orcamento",
    },
    {
      type: "table",
      headers: ["Coluna", "O que registrar", "Frequencia"],
      rows: [
        ["Data", "dia do gasto ou recebimento", "sempre que ocorrer"],
        ["Catégoria", "foto, deslocamento, curso, jurídico, outros", "sempre que ocorrer"],
        ["Descricao", "detalhe objetivo do item", "sempre que ocorrer"],
        ["Valor", "entrada ou saida em reais", "sempre que ocorrer"],
        ["Status", "previsto, pago, recebido", "revisão semanal"],
        ["Retorno esperado", "qual ganho pratico o gasto deve trazer", "antes de pagar"],
      ],
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Abra uma aba para planejamento e outra para realizado.",
        "Compare previsto x realizado todo domingo.",
        "Se passar do teto por 2 semanas, reduza a carga do plano.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Templaté 4: glossario essencial (15+ termos)",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "**Book:** ensaio fotografico para portfolio.",
        "**Casting:** processo seletivo para trabalho específico.",
        "**Callback:** segunda etapa apos triagem inicial.",
        "**Cachê:** valor pago pelo trabalho executado.",
        "**Briefing:** orientação do cliente sobre o que precisa.",
        "**Usage rights:** condições de uso de imagem.",
        "**Buyout:** pagamento para uso ampliado sem novos cachês durante prazo.",
        "**Exclusividade:** restricao para atuar em catégorias concorrentes.",
        "**Comissão:** percentual retido por agência ou intermediador.",
        "**Call time:** horário oficial de apresentação no local.",
        "**Release:** autorização formal de uso de imagem.",
        "**Set:** ambiente de gravacao ou sessão fotografica.",
        "**Fit de perfil:** adequação ao perfil buscado na campanha.",
        "**Raté card:** referência de valores práticados.",
        "**Pauta:** plano operacional do dia de produção.",
        "**Rider:** exigencias técnicas e operacionais acordadas.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "FAQ rápido da gestora",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "**Preciso de agência para começar?** Não. Comece por experiência de baixo risco e ativos básicos.",
        "**Vale pagar mensalidade para entrar?** So com contrato claro, histórico e contrapartida objetiva.",
        "**Meu filho não quer em alguns dias, e normal?** Sim. Sinal de emoção deve orientar o ritmo.",
        "**Quando buscar advogado?** Em contrato relevante, exclusividade ou uso amplo de imagem.",
        "**Como saber se devo recusar?** Quando faltar transparência, respeito a rotina ou segurança financeira.",
      ],
    },
    {
      type: "quote",
      text: "Ferramenta boa não elimina risco. Ela reduz erro repetido e melhora sua decisão.",
    },
    {
      type: "exercise",
      title: "Organização final da sua pasta de gestão",
      steps: [
        "Criar pasta com subpastas: fotos, contratos, comprovantes e propostas.",
        "Salvar estes templatés e adaptar com a realidade da sua família.",
        "Definir um dia fixo da semana para revisão de 20 minutos.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Templatés aceleram decisão sem perder critério.",
        "15 perguntas certas evitam erros caros.",
        "Glossario e FAQ dao autonomia para negociar com segurança.",
      ],
    },
  ],
});
