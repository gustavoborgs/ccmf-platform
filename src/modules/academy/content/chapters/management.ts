import { withReadingMinutes } from "../../reading";
import { getDiagramPath, getModuleCoverPath } from "../../visual-assets";

export const planoPorFases = withReadingMinutes({
  slug: "plano-por-fases",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 19,
  title: "Plano por fases: do sonho ao processo",
  subtitle: "Ações certas para cada idade",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Minha linda, carreira infantil não se monta no improviso. O que protege e funciona aos 3 anos pode prejudicar aos 11. Aqui você vai trabalhar com plano por fase, com objetivo, sinal de prontidão e limite de carga.",
    },
    {
      type: "heading",
      level: 2,
      text: "Framework FASES 6x",
    },
    {
      type: "paragraph",
      text: "Use o ciclo em cada fase: Foco da idade, Ações-chave, Sinais de prontidão, Exposição adequada, Salvaguardas da família, Semáforo de ajuste. Quando um item quebra, você ajusta o plano antes de aceitar nova oportunidade.",
    },
    {
      type: "image",
      src: getDiagramPath("timeline"),
      alt: "Linha do tempo da carreira infantil com prioridades por faixa etária",
      caption: "Planejamento por idade reduz ansiedade e evita decisão por impulso.",
    },
    {
      type: "heading",
      level: 2,
      text: "Plano detalhado por faixa etária",
    },
    {
      type: "table",
      headers: ["Faixa", "Foco", "Ações práticas da fase", "Sinal de avancar"],
      rows: [
        [
          "0 a 2 anos",
          "Memória e naturalidade",
          "1 concurso pontual; fotos simples e atuais; rotina de sono preservada; nada de agenda lotada",
          "Criança permanece tranquila em situacoes novas",
        ],
        [
          "3 a 5 anos",
          "Ludico com estrutura",
          "treino leve de expressão brincando; 1 vivência guiada por trimestre; conversas curtas sobre limites de toque, roupa e cansaço",
          "Participa com alegria e sem medo persistente",
        ],
        [
          "6 a 8 anos",
          "Disciplina inicial",
          "cadastro organizado; portfolio enxuto; repertório único por vez (teatro ou dança); calendário escolar protegido",
          "Cumpre combinados sem perder rendimento escolar",
        ],
        [
          "9 a 11 anos",
          "Autonomia assistida",
          "simular casting em casa; ensinar etiqueta de set; incluir a criança nas decisões; revisar propostas com checklist",
          "Consegue dizer sim e não com clareza e respeito",
        ],
        [
          "12 a 14 anos",
          "Posicionamento e responsabilidade",
          "definir nichos possiveis; negociar agenda com escola; orientar sobre imagem digital; revisar contrato com apoio jurídico",
          "Mantem saúde emocional e rotina sustentável",
        ],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Ações por idade para os próximos 30 dias",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "**0 a 2 anos:** escolher duas fotos representativas e encerrar por ai neste ciclo.",
        "**3 a 5 anos:** montar mini rotina de presença de camera em forma de brincadeira, 10 minutos por semana.",
        "**6 a 8 anos:** atualizar cadastro e escolher apenas uma frente de desenvolvimento artístico.",
        "**9 a 11 anos:** fazer simulação de teste com feedback positivo e orientação de postura.",
        "**12 a 14 anos:** abrir conversa franca sobre limites, contrato, internet e prioridades da escola.",
      ],
    },
    {
      type: "quote",
      text: "Carreira infantil premium não é gastar mais. É decidir melhor, no tempo certo da criança.",
    },
    {
      type: "caseStudy",
      title: "Familia que trocou pressa por método",
      body: "Mãe de menino de 7 anos queria agência imediata. Ajustamos para plano por fase: primeiro foto e repertório, depois exposição, depois filtro de proposta. Em 6 meses, ele evoluiu em confiança, sem queda na escola e sem rombo financeiro.",
      takeaway: "Método por fase gera consistência e protege a infância.",
    },
    {
      type: "alert",
      title: "Erro que custa caro",
      body: "Pular fase por ansiedade de adulto costuma gerar recusa, cansaço e gasto desnecessário. Se você precisou convencer demais a criança, provavelmente não é hora de acelerar.",
    },
    {
      type: "exercise",
      title: "Raio X da fase atual",
      steps: [
        "Marque a faixa etária e escreva o foco principal da fase.",
        "Escolha duas ações práticas da tabela para os próximos 30 dias.",
        "Defina um limite claro: o que sua família não vai aceitar neste ciclo.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Plano por fase evita decisão por impulso.",
        "Sinal de prontidão vale mais que pressa.",
        "Proteger rotina, escola e emoção faz parte da gestão profissional.",
      ],
    },
  ],
});

export const gestaoDeDinheiro = withReadingMinutes({
  slug: "gestão-de-dinheiro",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 20,
  title: "Gestão de dinheiro com critério",
  subtitle: "O que pagar, quando pagar e quanto custa de verdade",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Gestão premium é clareza financeira. Dinheiro não compra oportunidade boa, mas falta de controle empurra a família para proposta ruim. Vamos trabalhar com previsão de custo, teto mensal e gatilho de decisão.",
    },
    {
      type: "heading",
      level: 2,
      text: "Regra 40-40-20 do caixa da carreira",
    },
    {
      type: "paragraph",
      text: "40% para base (imagem e repertório), 40% para execução (deslocamento, material, taxas pontuais), 20% para reserva de oportunidade e jurídico. Se você não consegue manter essa lógica, reduza o ritmo da carreira antes de aumentar gasto.",
    },
    {
      type: "heading",
      level: 2,
      text: "Orcamento mensal por fase de maturidade",
    },
    {
      type: "table",
      headers: ["Nivel", "Faixa sugerida", "Objetivo financeiro", "Risco principal"],
      rows: [
        ["Inicio organizado", "R$ 120 a R$ 350", "Entrar com baixo risco", "Comprar pacote por ansiedade"],
        ["Construção", "R$ 350 a R$ 900", "Manter consistência", "Gastar sem cronograma"],
        ["Operação ativa", "R$ 900 a R$ 2.200", "Sustentar testes e revisões", "Escalar custo antes do retorno"],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "O que pagar em cada momento",
    },
    {
      type: "table",
      headers: ["Momento", "Pagar agora", "Pode esperar", "Não pagar sem demanda real"],
      rows: [
        [
          "Primeiro passo",
          "inscrição em concurso sério; fotos limpas e atuais",
          "book completo; assessoria constante",
          "mensalidade com promessa vaga",
        ],
        [
          "Primeiras convocacoes",
          "deslocamento planejado; roupa neutra adequada",
          "curso extra paralelo",
          "pacote fechado de servicos sem contrato claro",
        ],
        [
          "Primeiro contrato",
          "revisão jurídica; controle de comissão e prazo",
          "nova produção de fotos, se ainda atual",
          "clausula de exclusividade sem contrapartida real",
        ],
        [
          "Rotina de trabalhos",
          "atualização periódica de material; fundo de reserva",
          "upgrade estetico frequente",
          "divida para manter aparencia de status",
        ],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Custos tipicos de referência",
    },
    {
      type: "table",
      headers: ["Item", "Faixa comum", "Observação prática"],
      rows: [
        ["Inscrição em concurso sério", "R$ 50 a R$ 280", "compare edital, histórico e transparência"],
        ["Atualizacao de fotos básicas", "R$ 0 a R$ 450", "celular bem usado resolve no início"],
        ["Deslocamento para teste", "R$ 40 a R$ 320", "planeje ida e volta antes de confirmar"],
        ["Revisão contratual pontual", "R$ 250 a R$ 900", "custa menos que erro de contrato"],
        ["Repertório mensal", "R$ 90 a R$ 500", "escolha uma frente por vez"],
      ],
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Defina um teto mensal que não aperta contas da casa.",
        "Liste custos fixos e variáveis da carreira em planilha simples.",
        "Aplique a regra: proposta fora do teto exige contrapartida clara.",
      ],
    },
    {
      type: "quote",
      text: "Financeiro organizado da liberdade para dizer não ao que não presta.",
    },
    {
      type: "caseStudy",
      title: "R$ 480 que viraram estratégia",
      body: "Familia recebeu primeiro cachê líquido de R$ 480. Em vez de gastar no impulso, separou 50% para reserva da carreira, 30% para custo futuro e 20% para experiência da criança. No próximo convite, ja tinham caixa para deslocamento e revisão de contrato.",
      takeaway: "Cachê pequeno com gestão boa vira estabilidade.",
    },
    {
      type: "alert",
      title: "Divida não é estratégia",
      body: "Se precisa parcelar para parecer profissional, você ja perdeu controle. Carreira infantil sustentável cresce por ciclo, não por vitrine de curto prazo.",
    },
    {
      type: "exercise",
      title: "Mapa financeiro de 90 dias",
      steps: [
        "Anote seu teto mensal e os custos fixos obrigatorios.",
        "Preencha os custos variáveis previstos por semana.",
        "Marque em vermelho todo gasto que não tem retorno esperado claro.",
        "Corte pelo menos um item por impulso antes de fechar o mês.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Orcamento protege seu filho e sua casa.",
        "Pague por demanda real, não por medo de ficar para tras.",
        "Quem controla caixa negocia melhor e recusa melhor.",
      ],
    },
  ],
});

export const contratosEDireitos = withReadingMinutes({
  slug: "contratos-e-direitos",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 21,
  title: "Contratos, direitos e uso de imagem",
  subtitle: "Guia geral com base no ECA",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Sempre que aparece contrato, seu papel de gestora fica mais importante que o brilho da oportunidade. O ECA existe para proteger a criança e o adolescente, e você precisa transformar essa proteção em pergunta objetiva na mesa de negociação.",
    },
    {
      type: "heading",
      level: 2,
      text: "ECA na prática: 5 pontos de proteção",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Prioridade absoluta ao desenvolvimento da criança: trabalho não pode ferir saúde, estudo e dignidade.",
        "Exposição de imagem precisa de finalidade, prazo e limites claros.",
        "Participação deve ter acompanhamento de responsável e condições adequadas.",
        "Remuneracao e comissão precisam estar descritas, com forma e prazo de pagamento.",
        "Nenhuma clausula pode tratar menor como adulto sem proteção específica.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Checklist antes de assinar",
    },
    {
      type: "checklist",
      items: [
        "Quem esta contratando e quem responde jurídicamente pela campanha",
        "Uso de imagem com prazo, territorio e mídias descritas",
        "Valor bruto, descontos, comissão, prazo e comprovante de pagamento",
        "Horario de chamada, tempo de espera e estrutura no local",
        "Presença de responsável permitida durante toda a atividade",
        "Regras de cancelamento e remarcação sem penalidade abusiva",
        "Clausula de exclusividade com limite e contrapartida clara",
        "Previsão de rescisão: como sair e em quanto tempo",
        "Autorizacoes adicionais separadas do contrato principal",
      ],
    },
    {
      type: "paragraph",
      text: "Este conteúdo e orientação geral. Em contrato de valor relevante, exclusividade, uso nacional amplo ou prazo longo, a revisão jurídica profissional deixa de ser opcional e passa a ser proteção básica.",
    },
    {
      type: "quote",
      text: "Proposta boa sobrevive a pergunta difícil. Proposta ruim foge da transparência.",
    },
    {
      type: "caseStudy",
      title: "Assinatura adiada, problema evitado",
      body: "Responsavel recebeu contrato com uso de imagem sem prazo definido e multa alta para rescisão. Em vez de assinar no mesmo dia, pediu ajuste por escrito e revisão jurídica. A produtora aceitou limitar prazo e reduzir multa.",
      takeaway: "Quando o papel melhora apos pergunta, você evitou um risco real.",
    },
    {
      type: "alert",
      title: "Não assine no corredor",
      body: "Pressa, urgência emocional e promessa verbal são terreno perigoso. Sem contrato claro, sem resposta por escrito, sem assinatura.",
    },
    {
      type: "exercise",
      title: "Ritual de 15 minutos pre-assinatura",
      steps: [
        "Leia o contrato em voz alta e marque termos vagos.",
        "Converta cada termo vago em pergunta objetiva por mensagem.",
        "Peca as respostas por escrito e salve em pasta da família.",
        "Somente depois compare risco, valor e impacto na rotina escolar.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "ECA e proteção ativa, não burocracia.",
        "Contrato claro tem prazo, valor, uso de imagem e saida definida.",
        "Quando a proposta e importante, revisão jurídica e investimento inteligente.",
      ],
    },
  ],
});

export const negociandoPropostas = withReadingMinutes({
  slug: "negociando-propostas",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 22,
  title: "Como negociar proposta sem ser empresária",
  subtitle: "Roteiro de 7 perguntas para aceitar ou recusar",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Você não precisa ser empresária para negociar bem. Você precisa de método, calma e critério. Proposta boa suporta conversa objetiva. Proposta ruim tenta acelerar sua decisão.",
    },
    {
      type: "heading",
      level: 2,
      text: "Script de 7 perguntas",
    },
    {
      type: "checklist",
      items: [
        "Qual é o objetivo exato do trabalho e o perfil esperado da criança?",
        "Quais datas, horários e duração total da atividade?",
        "Quanto sera pago, quando e de que forma?",
        "Qual porcentagem de comissão e quais custos ficam com a família?",
        "Como sera o uso de imagem: prazo, territorio e mídias?",
        "Existe exclusividade? Se sim, por quanto tempo e com qual contrapartida?",
        "Quais são as condições para cancelar, remarcar ou rescindir?",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Matriz de decisão: aceitar, negociar ou recusar",
    },
    {
      type: "table",
      headers: ["Critério", "Aceitar", "Negociar", "Recusar"],
      rows: [
        ["Contrato", "claro e completo", "tem lacunas ajustaveis", "vago ou contraditorio"],
        ["Financeiro", "compativel com custo e risco", "valor baixo com espaco de ajuste", "pagamento indefinido ou abusivo"],
        ["Rotina da criança", "preserva escola e saúde", "exige pequenos ajustes", "impacta descanso, estudo ou emoção"],
        ["Uso de imagem", "prazo e limites definidos", "precisa restringir mídias", "uso ilimitado sem compensacao"],
      ],
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Recebeu proposta: agradeca e confirme prazo de retorno.",
        "Rode as 7 perguntas e registre respostas por escrito.",
        "Classifique em aceitar, negociar ou recusar com base na matriz.",
        "Se negociar, envie contraproposta objetiva em até 24 horas.",
      ],
    },
    {
      type: "quote",
      text: "Negociar não é ser difícil. E proteger seu filho com responsabilidade.",
    },
    {
      type: "caseStudy",
      title: "Não era não, era negociar",
      body: "Uma mãe recebeu convite com cachê baixo e uso amplo de imagem. Em vez de recusar no impulso, aplicou o script, pediu ajuste de prazo e revisão do valor. A proposta melhorou e ficou viavel para a rotina da escola.",
      takeaway: "Pergunta boa aumenta sua margem de escolha.",
    },
    {
      type: "alert",
      title: "Sinais de proposta que deve ser recusada",
      body: "Promessa de fama, pressão para assinatura imediata, taxa antecipada sem contrato e proibicao de levar responsável são sinais de risco alto.",
    },
    {
      type: "exercise",
      title: "Modelo de resposta profissional",
      steps: [
        "Escreva mensagem curta agradecendo a proposta.",
        "Inclua as 7 perguntas em formato objetivo.",
        "Defina data de retorno e registre tudo na pasta da carreira.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Sem método, negociação vira ansiedade.",
        "As 7 perguntas filtram risco e melhoram proposta.",
        "Recusar com clareza também e gestão profissional.",
      ],
    },
  ],
});

export const tempoEscolaEquilibrio = withReadingMinutes({
  slug: "tempo-escola-equilíbrio",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 23,
  title: "Tempo, escola e equilíbrio emocional",
  subtitle: "Agenda que protege resultado e infância",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Se a agenda da carreira atropela escola, sono e convivência, o preço aparece rápido. Equilíbrio não é frescura. É estrutura de performance sustentável para seu filho e para sua família.",
    },
    {
      type: "heading",
      level: 2,
      text: "Framework 3 agendas",
    },
    {
      type: "table",
      headers: ["Agenda", "Prioridade", "Limite minimo", "Alerta vermelho"],
      rows: [
        ["Escolar", "aprendizagem e rotina", "presença, tarefa e descanso", "queda persistente no rendimento"],
        ["Artistica", "oportunidade e treino", "carga semanal definida", "convites sem critério sequenciais"],
        ["Familiar", "vinculo e saúde emocional", "tempo de convivio real", "conflitos constantes por agenda"],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Regras práticas de equilíbrio",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Defina teto de compromissos artisticos por semana conforme idade.",
        "Bloqueie no calendário os horários fixos da escola primeiro.",
        "Reserve uma janela sem carreira para descanso da criança.",
        "Reavalie a cada 15 dias com conversa breve em família.",
      ],
    },
    {
      type: "list",
      ordered: false,
      items: [
        "**Antes de aceitar teste:** verificar impacto em prova, sono e deslocamento.",
        "**Depois de cada atividade:** perguntar como a criança se sentiu no corpo e na emoção.",
        "**No fim do mês:** medir se a rotina ficou melhor, igual ou pior.",
      ],
    },
    {
      type: "quote",
      text: "Agenda cheia não é prova de sucesso. Agenda inteligente sim.",
    },
    {
      type: "caseStudy",
      title: "Plano semanal com margem de respiro",
      body: "Familia com duas crianças colocou regra de no maximo um compromisso artístico por semana no periodo letivo. O resultado foi menos conflito em casa, melhor humor e continuidade no projeto por mais de um ano.",
      takeaway: "Ritmo sustentável sustenta a carreira por mais tempo.",
    },
    {
      type: "alert",
      title: "Quando a rotina começa a cobrar",
      body: "Irritação frequente, choro antes de teste, queda na escola e cansaço crônico são sinais para reduzir carga imediatamente.",
    },
    {
      type: "exercise",
      title: "Auditoria de agenda da família",
      steps: [
        "Abra o calendário das próximas quatro semanas.",
        "Marque escola, sono, lazer e deslocamentos obrigatorios.",
        "Inclua compromissos artisticos e confira se excedeu seu teto.",
        "Cancele ou remaneje o que comprometer descanso e escola.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Equilíbrio e parte da estratégia, não premio final.",
        "Escola, sono e saúde emocional são inegociáveis.",
        "Sem margem de respiro, a carreira perde qualidade.",
      ],
    },
  ],
});

export const acelerarSegurarParar = withReadingMinutes({
  slug: "acelerar-segurar-parar",
  moduleSlug: "management",
  moduleOrder: 4,
  chapterNumber: 24,
  title: "Quando acelerar, segurar e parar",
  subtitle: "Matriz de decisão para liderar com clareza",
  cover: getModuleCoverPath("management"),
  blocks: [
    {
      type: "paragraph",
      text: "Gestora madura não opera no oito ou oitenta. Ela sabe acelerar quando existe janela real, segurar quando a base precisa de ajuste e parar quando o custo superou o benefício. Este capítulo fecha sua caixa de decisão.",
    },
    {
      type: "heading",
      level: 2,
      text: "Matriz ASP: acelerar, segurar, parar",
    },
    {
      type: "table",
      headers: ["Decisão", "Sinais positivos", "Sinais de risco", "Acao imediata"],
      rows: [
        [
          "Acelerar",
          "oportunidade concreta, contrato claro, criança bem e família alinhada",
          "agenda no limite",
          "aceitar com plano de execução e revisão semanal",
        ],
        [
          "Segurar",
          "interesse existe, mas base esta instavel",
          "cansaço, queda escolar, proposta confusa",
          "pausar novos convites por 15 a 30 dias para ajuste",
        ],
        [
          "Parar",
          "pedido consistente da criança para interromper",
          "ambiente toxico, risco emocional ou financeiro alto",
          "encerrar ciclo com comúnicação formal e cuidado emocional",
        ],
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Checklist de decisão em 5 minutos",
    },
    {
      type: "checklist",
      items: [
        "A criança quer participar hoje, sem pressão?",
        "A rotina escolar permanece preservada neste ciclo?",
        "A proposta tem contrato e pagamento claros?",
        "A família consegue executar sem estresse financeiro?",
        "Existe plano de saida se algo sair do controle?",
      ],
    },
    {
      type: "list",
      ordered: false,
      items: [
        "**Acelerar com segurança:** definir responsável por cada etapa e data de revisão.",
        "**Segurar com inteligencia:** reduzir agenda sem abandonar o projeto.",
        "**Parar com dignidade:** comúnicar, registrar e cuidar da emoção da criança.",
      ],
    },
    {
      type: "quote",
      text: "Parar um ciclo no momento certo também e vitoria de gestão.",
    },
    {
      type: "caseStudy",
      title: "Desacelerar para não quebrar",
      body: "Após duas recusas e rotina pesada, família decidiu segurar por 30 dias. Reorganizou agenda, refez material e voltou com mais clareza. No mês seguinte, veio proposta melhor e em condições adequadas.",
      takeaway: "Segurar bem feito evita parar por exaustão.",
    },
    {
      type: "alert",
      title: "Armadilha do ja investi demais",
      body: "Investimento passado não decide futuro. Se hoje esta pesado para a criança ou para a casa, ajuste agora.",
    },
    {
      type: "exercise",
      title: "Semáforo ASP da semana",
      steps: [
        "Marque em verde o que pode acelerar com segurança.",
        "Marque em amarelo o que exige ajuste antes de continuar.",
        "Marque em vermelho o que deve parar imediatamente.",
        "Defina uma única decisão para executar nas próximas 48 horas.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Acelerar, segurar e parar são três formas de liderar.",
        "Critério protege o talento mais que entusiasmo.",
        "Decisão boa e a que sustenta infância, família e projeto.",
      ],
    },
  ],
});
