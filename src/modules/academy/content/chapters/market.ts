import { withReadingMinutes } from "../../reading";
import { getCasePath, getDiagramPath, getModuleCoverPath } from "../../visual-assets";

export const mercadoDoTalento = withReadingMinutes({
  slug: "mercado-do-talento",
  moduleSlug: "market",
  moduleOrder: 2,
  chapterNumber: 9,
  title: "Como funciona o mercado de talento infantil",
  subtitle: "Quem contrata, por que contrata e o que realmente pesa",
  cover: getModuleCoverPath("market"),
  blocks: [
    {
      type: "paragraph",
      text: "Meu amor, antes de investir dinheiro, tempo e expectativa, você precisa entender o jogo de verdade. Mercado infantil não é um bloco único. São vários micromercados com ritmos, critérios e caches diferentes. Quem entende essa lógica toma decisão com clareza. Quem não entende, compra promessa.",
    },
    {
      type: "heading",
      level: 2,
      text: "Como o mercado se organiza na prática",
    },
    {
      type: "table",
      headers: ["Segmento", "Onde aparece", "Como costuma contratar", "Faixa de cachê inicial"],
      rows: [
        ["Moda/catálogo", "E-commerce, lookbook, campanha sazonal", "Casting por foto e prova de roupa", "R$ 250 a R$ 1.200"],
        ["Publicidade", "Filme, foto, digital ads, social da marca", "Briefing, teste e aprovação final do cliente", "R$ 500 a R$ 4.000+"],
        ["TV/streaming", "Novela, serie, programa e participacoes", "Banco de elenco, teste gravado e callback", "R$ 300 a R$ 2.500 por diaria"],
        ["Conteúdo digital", "Publi, reels, UGC, campanhas de creator", "Contato direto, agência ou assessoria", "R$ 150 a R$ 3.000 por entrega"],
        ["Eventos e ativacoes", "Feiras, lancamentos, ações presenciais", "Produtora com casting local", "R$ 180 a R$ 900 por turno"],
      ],
    },
    {
      type: "paragraph",
      text: "Perceba uma coisa: em todos os segmentos, o primeiro filtro acontece por imagem e perfil. Ninguém começa pelo talento completo porque o contratante ainda não conhece a criança. O mercado primeiro compra adequação ao briefing, depois avalia repertório e postura.",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Briefing manda mais que vontade da família: idade aparente, energia, biotipo e disponibilidade contam.",
        "Prazo e urgência mudam tudo: job que fecha em 24h valoriza quem responde rápido e com material organizado.",
        "Relacionamento profissional acelera convite recorrente: quem entrega bem hoje volta para lista de amanhã.",
      ],
    },
    {
      type: "quote",
      text: "Mercado não contrata sonho abstrato. Contrata perfil certo para necessidade concreta.",
    },
    {
      type: "image",
      src: getCasePath("tvSet"),
      alt: "Bastidor de set com equipe técnica e talento infantil em preparação",
      caption: "Nos bastidores, decisão e técnica andam juntas: perfil, tempo e entrega.",
    },
    {
      type: "caseStudy",
      title: "Da inscrição ao primeiro cachê regional",
      body: "A família da Alice, 6 anos, saiu do interior para tentar mercado em capital sem estratégia. Nos primeiros meses, recebeu dezenas de propostas confusas. Quando organizou fotos, perfil e disponibilidade, passou a responder somente oportunidades alinhadas. Em três meses, Alice entrou em campanha de varejo local com cachê de R$ 900 e uso de imagem por 6 meses. O que mudou não foi sorte. Foi leitura de mercado.",
      takeaway: "Quem entende o segmento para de atirar para todos os lados.",
    },
    {
      type: "alert",
      title: "Demanda não é afeto",
      body: "Seu filho pode ser incrivel e, ainda assim, não encaixar naquele job. Isso não é rejeição da criança. E aderencia a briefing. Quando a família mistura mercado com valor pessoal, nasce sofrimento desnecessário e decisões impulsivas.",
    },
    {
      type: "exercise",
      title: "Raio x do seu mercado local",
      steps: [
        "Escolha dois segmentos para foco dos próximos 90 dias.",
        "Liste 10 marcas/produtoras que usam talentos infantis na sua região ou no digital.",
        "Anote perfil recorrente, faixa de idade e estilo de imagem que mais aparece.",
        "Defina o que falta hoje para seu filho competir com segurança nesse recorte.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Mercado infantil e composto por microsegmentos com regras diferentes.",
        "Imagem organizada abre conversa; repertório sustenta continuidade.",
        "Não encaixar em um briefing não define valor da criança.",
      ],
    },
  ],
});

export const portasECaminhos = withReadingMinutes({
  slug: "portas-e-caminhos",
  moduleSlug: "market",
  moduleOrder: 2,
  chapterNumber: 10,
  title: "As portas e os caminhos",
  subtitle: "Estratégia de entrada sem pular etapa",
  cover: getModuleCoverPath("market"),
  blocks: [
    {
      type: "paragraph",
      text: "Não existe uma única porta magica. Existe porta adequada para cada momento da família e da criança. Quando você escolhe a porta certa para a fase certa, reduz risco e aumenta aprendizado com menos desgaste.",
    },
    {
      type: "heading",
      level: 2,
      text: "As seis portas reais do mercado",
    },
    {
      type: "table",
      headers: ["Porta", "Objetivo", "Vantagem", "Risco se mal usada"],
      rows: [
        ["Concurso sério", "Visibilidade e validacao", "Baixo custo inicial", "Entrar por impulso sem regulamento"],
        ["Agência", "Representacao comercial", "Acesso a jobs filtrados", "Contrato ruim e cobranca antecipada"],
        ["Casting direto", "Concorrer em selecoes abertas", "Contato com producoes reais", "Perder tempo com fraude"],
        ["Rede social profissional", "Portifolio vivo", "Descoberta organica", "Exposição excessiva da criança"],
        ["Cursos de repertório", "Treinar habilidade", "Melhora de performance", "Confundir curso com agênciamento"],
        ["Networking de famílias", "Troca de referência", "Informação de bastidor", "Repassar boato como verdade"],
      ],
    },
    {
      type: "paragraph",
      text: "Na prática, os caminhos se cruzam. Você pode começar em concurso, ganhar material oficial, organizar rede social e só depois conversar com agência. Ou pode iniciar por casting direto em produtoras locais e evoluir para representação. O segredo não é velocidade. É sequência inteligente.",
    },
    {
      type: "checklist",
      items: [
        "Essa porta respeita a idade e rotina escolar da criança?",
        "Existe custo inicial claro e proporcional ao momento atual?",
        "A empresa/projeto tem histórico verificavel e transparência?",
        "Você entende exatamente o que esta sendo comprado?",
      ],
    },
    {
      type: "image",
      src: getCasePath("familyPlan"),
      alt: "Familia revisando planejamento da carreira infantil em casa",
      caption: "Gestão boa escolhe porta por estratégia, não por ansiedade.",
    },
    {
      type: "caseStudy",
      title: "Sequencia que funcionou",
      body: "A mãe do Davi, 5 anos, queria assinar contrato de dois anos logo no início. Parou, estudou o mercado e fez caminho em três etapas: concurso para avaliação, curso de teatro para repertório e somente depois reuniao com duas agências. Assinou com a que cobrava apenas comissão sobre jobs fechados. Em oito meses, Davi fez dois trabalhos pagos e manteve rotina escolar.",
      takeaway: "Porta certa na ordem certa economiza dinheiro e protege a criança.",
    },
    {
      type: "alert",
      title: "Não confunda função de cada porta",
      body: "Curso ensina. Agência representa. Concurso valida e da vitrine. Rede social mostra bastidor. Quando tudo se mistura no discurso de venda, geralmente o foco não é carreira da criança. E faturamento em cima da ansiedade da família.",
    },
    {
      type: "exercise",
      title: "Plano de porta para 90 dias",
      steps: [
        "Defina uma porta principal para agora e uma secundaria para depois.",
        "Escreva quais evidencias vao mostrar que essa porta funcionou em 90 dias.",
        "Liste três custos possiveis e um limite financeiro para não ultrapassar.",
        "Converse com a criança sobre como ela se sente com esse passo.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Não existe porta única; existe porta adequada por fase.",
        "Sequencia inteligente reduz erro caro.",
        "Misturar funções abre espaco para golpe e frustração.",
      ],
    },
  ],
});

export const concursoAgenciaBook = withReadingMinutes({
  slug: "concurso-agência-book",
  moduleSlug: "market",
  moduleOrder: 2,
  chapterNumber: 11,
  title: "Concurso x Agência x Book",
  subtitle: "Comparativo real de função, custo e retorno",
  cover: getModuleCoverPath("market"),
  blocks: [
    {
      type: "paragraph",
      text: "Esse trio confunde até família experiente. Vamos simplificar com critério de gestão: para que serve cada um, quando entra e qual erro mais caro de cada escolha.",
    },
    {
      type: "table",
      headers: ["Critero", "Concurso sério", "Agência", "Book fotografico"],
      rows: [
        ["Função principal", "Validar e dar visibilidade", "Representar e negociar jobs", "Atualizar material visual"],
        ["Modelo de ganho", "Taxa de inscrição/regras públicas", "Comissão sobre cachê fechado", "Venda de servico fotografico"],
        ["Contrato longo", "Não", "Pode existir, exige leitura", "Não"],
        ["Risco principal", "Entrar em concurso sem credibilidade", "Assinar sem entender cláusulas", "Pagar caro sem demanda concreta"],
        ["Melhor momento", "Inicio ou reposicionamento", "Quando ha prontidão comercial", "Quando job ou teste pede material novo"],
        ["Pergunta chave", "Quem avalia e como?", "Como vocês ganham quando meu filho trabalha?", "Esse investimento vai ser usado quando?"],
      ],
    },
    {
      type: "image",
      src: getDiagramPath("comparison"),
      alt: "Comparativo visual entre concurso, agência e book fotográfico",
      caption: "Tres ferramentas diferentes, três papeis diferentes.",
    },
    {
      type: "quote",
      text: "Book não abre mercado sozinho. Ele acompanha oportunidade real.",
    },
    {
      type: "paragraph",
      text: "Concurso sério funciona como radar. Agência funciona como ponte comercial. Book funciona como ferramenta de apresentação. Quando você usa cada um no papel certo, o investimento faz sentido. Quando inverte, vira custo emocional e financeiro.",
    },
    {
      type: "image",
      src: getCasePath("backstage"),
      alt: "Equipe de produção avaliando fotos de casting em tablet",
      caption: "No casting real, material e contexto pesam junto.",
    },
    {
      type: "caseStudy",
      title: "Dois caminhos opostos",
      body: "A família do Rafael, 6 anos, pagou R$ 1.800 em book completo sem job em vista. Em nove meses, nenhum teste real. Já a Giovana, 7 anos, entrou primeiro em concurso, recebeu convite para teste de campanha escolar e só entao fez atualização fotografica de R$ 480 focada no briefing pedido. Em 30 dias, fechou trabalho de R$ 1.200.",
      takeaway: "Mesma ferramenta, resultado diferente por causa do momento de uso.",
    },
    {
      type: "alert",
      title: "Fluxo de cobranca invertido",
      body: "Se o dinheiro entra pesado para a empresa antes de qualquer entrega comercial, acenda alerta. Agência seria cresce quando o talento trabalha e recebe cachê. Cobranca inicial pode existir em casos específicos, mas precisa ser proporcional, opcional e totalmente transparente.",
    },
    {
      type: "exercise",
      title: "Diagnostico da proposta que você recebeu",
      steps: [
        "Liste o que estão te vendendo hoje: concurso, agência, book ou pacote misto.",
        "Escreva qual problema real essa compra resolve agora.",
        "Se não houver problema real, adie por 30 dias e reavalie sem pressa.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Concurso, agência e book são ferramentas, não promessas de resultado.",
        "Momento de entrada define retorno de cada investimento.",
        "Transparência de modelo de ganho protege a família.",
      ],
    },
  ],
});

export const bandeirasVermelhas = withReadingMinutes({
  slug: "bandeiras-vermelhas",
  moduleSlug: "market",
  moduleOrder: 2,
  chapterNumber: 12,
  title: "Bandeiras vermelhas e golpes",
  subtitle: "Como blindar seu filho, seu bolso e sua paz",
  cover: getModuleCoverPath("market"),
  blocks: [
    {
      type: "paragraph",
      text: "Toda área com sonho forte atrai oportunidade boa e oportunista ruim. No mercado infantil isso e ainda mais sensivel, porque mexe com afeto e urgência dos pais. Golpe costuma vir com três ingredientes: promessa alta, pressão de tempo e cobranca antecipada.",
    },
    {
      type: "heading",
      level: 2,
      text: "Sinais classicos de risco",
    },
    {
      type: "checklist",
      items: [
        "Promessa de fama, contrato garantido ou retorno financeiro rápido",
        "Urgencia forcada: desconto só se pagar hoje",
        "Mensalidade alta sem histórico de jobs entregues",
        "Book e curso obrigatorios como condição para entrar",
        "Contrato longo sem explicacao clara de cancelamento",
        "Pedido de imagem inadequada para menor",
        "Empresa sem CNPJ claro, sem regulamento e sem trilha pública",
        "Depoimentos vagos sem prova verificavel",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Protocolo de segurança em 4 passos",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Pedir tudo por escrito: valores, prazos, entregas e condições de cancelamento.",
        "Pesquisar reputação em canais independentes e com outras famílias.",
        "Ler contrato fora do ambiente de venda e sem pressa.",
        "Aplicar regra da pausa: qualquer desconforto, interromper decisão por 48 horas.",
      ],
    },
    {
      type: "quote",
      text: "Ansiedade compra rápido. Gestão boa compra com prova.",
    },
    {
      type: "image",
      src: getCasePath("familyPlan"),
      alt: "Responsavel revisando contrato e checklist de segurança",
      caption: "Checklist e pausa estratégica evitam arrependimento caro.",
    },
    {
      type: "caseStudy",
      title: "A seletiva que era funil de pacote",
      body: "Cento e cinquenta famílias foram chamadas para uma suposta seletiva exclusiva. Cada criança ficou menos de dois minutos na frente da camera. Ao final, quase todas foram aprovadas com pacote entre R$ 3.500 e R$ 7.900. Sem cliente contratante, sem briefing, sem cronograma de job. Isso não era casting. Era venda com gatilho emocional.",
      takeaway: "Aprovação em massa sem job definido e sinal direto de armadilha.",
    },
    {
      type: "alert",
      title: "Segurança da criança e inegociavel",
      body: "Não envie material íntimo, não compartilhe rotina escolar, não exponha localização em tempo real. Ensaio e trabalho sério precisam de ambiente claro, equipe identificada e responsável presente. Se algo não fecha, pare imediatamente.",
    },
    {
      type: "exercise",
      title: "Seu detector de risco",
      steps: [
        "Pegue a ultima proposta que você recebeu e passe no checklist.",
        "Marque quantos alertas aparecem.",
        "Dois alertas: pausa e pesquisa. Tres ou mais: descarte.",
        "Registre no diário o que você aprendeu para não repetir padrão.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Golpe usa pressão, promessa e cobranca antecipada.",
        "Checklist e pausa protegem mais do que intuicao sozinha.",
        "Desconforto consistente e sinal de segurança, não de fraqueza.",
      ],
    },
  ],
});

export const porDentroDeUmJob = withReadingMinutes({
  slug: "por-dentro-de-um-job",
  moduleSlug: "market",
  moduleOrder: 2,
  chapterNumber: 13,
  title: "Por dentro de um job: do briefing ao cachê",
  subtitle: "Fluxo real de trabalho, comissão e valores práticados",
  cover: getModuleCoverPath("market"),
  blocks: [
    {
      type: "paragraph",
      text: "Agora vou te mostrar o bastidor que quase ninguem explica com clareza. Um job infantil tem etapas objetivas, prazos curtos e responsabilidades de adulto. Entender esse fluxo evita susto, protege seu filho e melhora sua negociação.",
    },
    {
      type: "heading",
      level: 2,
      text: "Etapa 1: briefing e triagem",
    },
    {
      type: "paragraph",
      text: "Tudo começa no briefing do cliente: idade aparente, perfil visual, comportamento esperado, cidade, data e mídias de veiculação. Agência ou produtora filtra talentos e pede material rápido. Aqui ganha quem tem fotos atuais, medidas organizadas e resposta objetiva.",
    },
    {
      type: "heading",
      level: 2,
      text: "Etapa 2: casting e aprovação",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Pre-seleção por foto/video enviado.",
        "Teste presencial ou self tape com orientação de cena.",
        "Callback em alguns casos, com ajuste de perfil.",
        "Aprovação final do cliente com definicao de cachê e direitos de uso.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Etapa 3: set, entrega e pagamento",
    },
    {
      type: "table",
      headers: ["Fase", "O que acontece", "Cuidados da família"],
      rows: [
        ["Pre-produção", "Envio de contrato, call sheet e orientacoes", "Checar horário, figurino, alimentacao e deslocamento"],
        ["Dia de set", "Maquiagem leve, ensaio, gravacao/foto e espera", "Garantir descanso, agua, lanche e bem estar da criança"],
        ["Pos-produção", "Cliente finaliza peca e valida uso de imagem", "Guardar comprovantes e conferir prazo de pagamento"],
        ["Financeiro", "Emissão de recibo/nota e repasse de valor", "Conferir desconto de comissão e saldo líquido"],
      ],
    },
    {
      type: "image",
      src: getCasePath("tvSet"),
      alt: "Set publicitario com criança acompanhada por responsável",
      caption: "Set organizado reduz estresse e melhora performance da criança.",
    },
    {
      type: "paragraph",
      text: "Sobre dinheiro: a comissão de agência costuma ficar entre 20% e 30% do cachê bruto, dependendo do contrato e da praca. Exemplo rápido: cachê de R$ 1.000 com comissão de 20% gera repasse de R$ 800 para a família. Se a comissão for 30%, repasse de R$ 700.",
    },
    {
      type: "paragraph",
      text: "Faixas comuns de valores em jobs de entrada: diaria de catálogo local entre R$ 250 e R$ 900, publicidade digital regional entre R$ 600 e R$ 2.500, campanha nacional pode ultrapassar isso conforme midia, prazo de uso e exclusividade. Não existe tabela única. Existe negociação baseada em escopo.",
    },
    {
      type: "quote",
      text: "Cachê sem contrato claro vira problema. Cachê com contrato claro vira aprendizado e patrimonio.",
    },
    {
      type: "caseStudy",
      title: "Job pequeno, gestão grande",
      body: "A Julia, 8 anos, fechou campanha de farmacia regional por R$ 1.400 brutos. A agência reteve 25% de comissão e a família recebeu R$ 1.050. Como o contrato previa uso por 6 meses em digital e PDV, todos sabiam exatamente o que estava sendo pago. Sem surpresa, sem discussão e com comprovante guardado.",
      takeaway: "Valor importante não é só o bruto. E clareza de uso, prazo e desconto.",
    },
    {
      type: "alert",
      title: "Fluxo opaco e risco alto",
      body: "Se ninguem explica briefing, contrato, forma de pagamento e percentual de comissão, pare o processo. Transparência e critério minimo para qualquer trabalho com menor de idade.",
    },
    {
      type: "exercise",
      title: "Simulador de cachê líquido",
      steps: [
        "Escolha três valores brutos hipoteticos: R$ 500, R$ 1.200 e R$ 2.500.",
        "Calcule quanto sobra com comissão de 20%, 25% e 30%.",
        "Defina qual valor minimo compensa deslocamento e rotina da sua família.",
        "Guarde esse parametro para negociar com mais segurança.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Job profissional tem fluxo: briefing, casting, set e pagamento.",
        "Comissão de agência geralmente varia de 20% a 30%.",
        "Negociação boa depende de contrato claro e expectativa realista.",
      ],
    },
  ],
});
