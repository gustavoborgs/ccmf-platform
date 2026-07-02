import { withReadingMinutes } from "../../reading";
import { getCasePath, getDiagramPath, getModuleCoverPath } from "../../visual-assets";

export const aImagem = withReadingMinutes({
  slug: "a-imagem",
  moduleSlug: "assets",
  moduleOrder: 3,
  chapterNumber: 14,
  title: "A imagem: fotos que abrem portas",
  subtitle: "Construção visual com estratégia e verdade",
  cover: getModuleCoverPath("assets"),
  blocks: [
    {
      type: "paragraph",
      text: "No mercado infantil, foto não é detalhe estetico. E infraestrutura comercial. Antes de qualquer conversa, o cliente olha imagem para decidir se chama ou não chama. Por isso eu digo: começar pela imagem não é superficialidade. E estratégia de entrada.",
    },
    {
      type: "heading",
      level: 2,
      text: "Pilares de imagem que converte em convite",
    },
    {
      type: "table",
      headers: ["Pilar", "O que significa", "Erro comum"],
      rows: [
        ["Naturalidade", "Expressão espontanea e postura infantil", "Poses adultizadas e rigidas"],
        ["Técnica básica", "Luz boa, nitidez, enquadramento limpo", "Foto escura, tremida ou recortada mal"],
        ["Atualizacao", "Matérial recente da fase atual", "Usar foto antiga por apego"],
        ["Coerencia", "Conjunto de imagens com mesma qualidade", "Misturar foto profissional com selfie confusa"],
        ["Verdade visual", "Sem filtro que muda tracos da criança", "Excesso de edicao e IA"],
      ],
    },
    {
      type: "paragraph",
      text: "Você não precisa começar com pacote caro. Precisa começar com critério. Janela, horário certo, criança descansada e direção afetiva produzem resultado superior a estudio sofisticado sem preparo emocional.",
    },
    {
      type: "image",
      src: getCasePath("backstage"),
      alt: "Fotógrafa conduzindo ensaio infantil em ambiente leve",
      caption: "Ensaio infantil bom respeita ritmo e humor da criança.",
    },
    {
      type: "checklist",
      items: [
        "Rosto visivel em pelo menos 3 enquadramentos",
        "Expressão natural sem excesso de pose",
        "Roupa sem marca dominante e sem ruido visual",
        "Fundo limpo e iluminacao uniforme",
        "Arquivo nitido em boa resolucao",
      ],
    },
    {
      type: "quote",
      text: "Foto de talento infantil não imita adulto. Revela verdade da criança.",
    },
    {
      type: "caseStudy",
      title: "Atualizacao que destravou convites",
      body: "O cadastro da Lara, 7 anos, tinha fotos de 14 meses atras. Cabelo, altura e denticao ja estavam diferentes. A mãe refez seis imagens simples com direção correta e atualizou portfolio. Em 45 dias, recebeu dois convites para teste de varejo infantil e um para conteúdo digital local.",
      takeaway: "Imagem atualizada muda resposta do mercado sem precisar de milagre.",
    },
    {
      type: "alert",
      title: "Filtro forte quebra confiança",
      body: "Se a criança do set não corresponde ao material enviado, a confiança da equipe despenca. Isso pode fechar portas futuras, mesmo quando o talento existe. Honestidade visual protege reputação.",
    },
    {
      type: "exercise",
      title: "Auditoria premium de portfolio",
      steps: [
        "Selecione 12 fotos atuais e elimine as 6 mais fracas por critério tecnico.",
        "Classifique as 6 restantes em: close, meio corpo e corpo inteiro.",
        "Escolha 4 imagens finais para cadastro oficial e 2 de reserva.",
        "Agende revisão do portfolio a cada 4 ou 5 meses.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Imagem e ativo comercial, não enfeite.",
        "Naturalidade, atualização e técnica básica vencem produção vazia.",
        "Revisão periódica evita perder oportunidade por material antigo.",
      ],
    },
  ],
});

export const marcaPessoal = withReadingMinutes({
  slug: "marca-pessoal",
  moduleSlug: "assets",
  moduleOrder: 3,
  chapterNumber: 15,
  title: "Marca pessoal e presença digital segura",
  subtitle: "Visibilidade inteligente sem sacrificar segurança",
  cover: getModuleCoverPath("assets"),
  blocks: [
    {
      type: "paragraph",
      text: "Marca pessoal infantil não é sobre viralizar. E sobre construir percepção profissional com limite claro de exposição. A pergunta correta não é como crescer rápido. É como crescer com segurança e consistência.",
    },
    {
      type: "heading",
      level: 2,
      text: "Arquitetura minima de perfil profissional",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Bio clara com faixa etária e contato do responsável.",
        "Grade curta e limpa com imagens reais e atuais.",
        "Destaques de bastidores seguros: ensaio, concurso, estudo de repertório.",
        "Linguagem adequada para infância, sem erotizacao ou apelo adulto.",
        "Frequencia sustentável, sem escravizar rotina da família.",
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "Governanca de segurança digital",
    },
    {
      type: "checklist",
      items: [
        "Não públicar escola, uniforme, endereco ou rotina detalhada",
        "Não exibir ambientes intimos da casa",
        "Moderar comentarios e mensagens privadas",
        "Separar vida pessoal da criança do perfil de trabalho",
        "Definir politica de postagem em dias de set e viagem",
      ],
    },
    {
      type: "image",
      src: getCasePath("familyPlan"),
      alt: "Responsavel organizando calendário de conteúdo infantil seguro",
      caption: "Presença digital boa nasce de critério editorial e proteção.",
    },
    {
      type: "quote",
      text: "Perfil infantil profissional e vitrine de trabalho, não reality show da família.",
    },
    {
      type: "caseStudy",
      title: "Visibilidade sem superexposição",
      body: "A família da Nina, 6 anos, criou perfil com 15 públicacoes iniciais e governanca clara: post quinzenal, nenhum dado pessoal, DM respondida apenas pela mãe. Sem viralizar, recebeu convite de produtora regional para teste de campanha de inverno. O diferencial foi organização e segurança.",
      takeaway: "Mercado sério prefere perfil limpo e confiavel a perfil caotico.",
    },
    {
      type: "alert",
      title: "Número sem estratégia vira armadilha",
      body: "Correr atras de curtida pode empurrar a família para conteúdo inadequado e cansaço emocional da criança. Priorize reputação profissional e segurança jurídica. Alcance e consequencia, não objetivo principal.",
    },
    {
      type: "exercise",
      title: "Revisão editorial de 30 minutos",
      steps: [
        "Análise as ultimas 12 públicacoes com olhar de cliente e de segurança.",
        "Remova o que expoe rotina, localização ou intimidade.",
        "Atualize bio com contato do responsável e proposta de perfil.",
        "Monte pauta para os próximos 30 dias com no maximo 4 posts.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Marca pessoal infantil exige critério, não exibicao maxima.",
        "Segurança digital faz parte da gestão profissional.",
        "Perfil simples, organizado e consistente abre portas reais.",
      ],
    },
  ],
});

export const repertorioPorFase = withReadingMinutes({
  slug: "repertório-por-fase",
  moduleSlug: "assets",
  moduleOrder: 3,
  chapterNumber: 16,
  title: "O repertório: o que desenvolver por fase",
  subtitle: "Competencias certas no tempo certo",
  cover: getModuleCoverPath("assets"),
  blocks: [
    {
      type: "paragraph",
      text: "Talento infantil que dura não depende só de rosto bonito. Depende de repertório emocional, corporal e comúnicacional. Em outras palavras: o que a criança sabe sustentar quando a camera liga.",
    },
    {
      type: "table",
      headers: ["Fase", "Idade", "Foco principal", "Sinal de progresso"],
      rows: [
        ["Bebe/mirim", "0 a 2", "Conforto, rotina e espontaneidade", "Tolera ambiente novo sem estresse extremo"],
        ["Infantil inicial", "3 a 5", "Brincadeira dirigida e comando simples", "Responde com leveza a orientação básica"],
        ["Infantil avancado", "6 a 9", "Postura, foco curto e trabalho em equipe", "Mantem energia em set com pausas"],
        ["Pre teen/teen", "10 a 14", "Autonomia, disciplina e identidade", "Entende briefing e colabora com consciencia"],
      ],
    },
    {
      type: "paragraph",
      text: "Curso certo na hora certa acelera maturidade de set. Curso errado na hora errada cria exaustão e rejeição. Escolha uma frente por ciclo, acompanhe prazer da criança e ajuste sem culpa. Repertório é maratona pedagogica.",
    },
    {
      type: "image",
      src: getDiagramPath("timeline"),
      alt: "Linha do tempo de desenvolvimento de repertório por idade",
      caption: "Cada fase pede habilidade diferente. Forcar etapa gera bloqueio.",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Teatro infantil fortalece presença, escuta e jogo de cena.",
        "Danca ajuda ritmo, coordenacao e consciencia corporal.",
        "Manequim infantil pode trabalhar postura e deslocamento.",
        "Oratoria lúdica melhora dicção e confiança em camera.",
      ],
    },
    {
      type: "caseStudy",
      title: "Repertório que virou diferencial",
      body: "O Pedro, 8 anos, travava no teste quando recebia comando novo. A família iniciou teatro uma vez por semana por quatro meses. No casting seguinte, ele ouviu orientação, ajustou rápido e manteve naturalidade. Resultado: aprovação para campanha escolar com diaria de R$ 750.",
      takeaway: "Mercado percebe quando a criança consegue transformar orientação em entrega.",
    },
    {
      type: "alert",
      title: "Agenda lotada não é gestão",
      body: "Tres cursos, ensaio, concurso e escola na mesma semana costumam gerar cansaço, queda de rendimento e perda de prazer. Proteja infância, sono e convivio familiar. Sem isso não existe carreira saudável.",
    },
    {
      type: "exercise",
      title: "Plano trimestral de repertório",
      steps: [
        "Defina a fase atual da criança e uma habilidade foco para 12 semanas.",
        "Escolha uma atividade com carga sustentável para a rotina da família.",
        "Crie dois indicadores simples: prazer da criança e evolucao técnica.",
        "Reavalie no fim do ciclo se mantem, troca ou pausa.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Repertório é o motor que sustenta oportunidade no longo prazo.",
        "Cada fase tem prioridade técnica e emocional propria.",
        "Uma atividade bem conduzida vale mais que agenda lotada.",
      ],
    },
  ],
});

export const redeDeApoio = withReadingMinutes({
  slug: "rede-de-apoio",
  moduleSlug: "assets",
  moduleOrder: 3,
  chapterNumber: 17,
  title: "A rede de apoio",
  subtitle: "Estrutura humana para sustentar a jornada",
  cover: getModuleCoverPath("assets"),
  blocks: [
    {
      type: "paragraph",
      text: "Nenhuma família sustenta carreira infantil sozinha por muito tempo. A rede certa distribui carga, melhora decisão e protege emocionalmente a criança. A rede errada suga dinheiro e energia.",
    },
    {
      type: "heading",
      level: 2,
      text: "Nucleos da rede inteligente",
    },
    {
      type: "table",
      headers: ["Nucleo", "Quem entra", "Quando ativar"],
      rows: [
        ["Criativo", "Fotografo, coach de imagem, professor de repertório", "Desde fase inicial"],
        ["Comercial", "Agência, produtora, contatos de casting", "Quando houver prontidão de mercado"],
        ["Jurídico-financeiro", "Advogado, contador, orientação fiscal", "No primeiro contrato pago"],
        ["Emocional-familiar", "Parceiro(a), parentes de confiança, famílias alinhadas", "Durante toda a jornada"],
      ],
    },
    {
      type: "paragraph",
      text: "Rede de apoio de verdade fala verdade mesmo quando incomoda. Ela não promete atalhos. Ela organiza caminho. O critério principal para escolher parceiro de rede e histórico de entrega com etica.",
    },
    {
      type: "image",
      src: getCasePath("training"),
      alt: "Criança em atividade de repertório com apoio de adultos",
      caption: "Rede boa combina técnica, afeto e limite.",
    },
    {
      type: "quote",
      text: "Quem só aparece para vender pacote não é rede. E custo.",
    },
    {
      type: "caseStudy",
      title: "Parceria que multiplicou oportunidades",
      body: "A família da Helena encontrou fotógrafa infantil com método claro e respeito ao ritmo da criança. Depois de dois ensaios consistentes, a profissional indicou Helena para duas produtoras de confiança. Não houve promessa milagrosa. Houve relacionamento profissional construído com entrega e respeito.",
      takeaway: "Rede boa nasce de confiança repetida, não de contato aleatório.",
    },
    {
      type: "alert",
      title: "Rede toxica desgasta a família",
      body: "Afaste-se de quem ridiculariza limites, desqualifica sua intuicao ou pressiona gasto sem necessidade. Rede saudável ajuda você a decidir melhor. Não decide por você com medo e culpa.",
    },
    {
      type: "exercise",
      title: "Mapa da rede em 4 blocos",
      steps: [
        "Divida seu caderno em: criativo, comercial, jurídico-financeiro e emocional.",
        "Preencha quem você ja tem em cada bloco.",
        "Identifique um vazio critico para preencher neste mês.",
        "Defina um critério de escolha para esse novo parceiro.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Carreira infantil sustentável depende de rede qualificada.",
        "Rede certa traz verdade, método e proteção.",
        "Construa por camadas, sem pressa e sem ingenuidade.",
      ],
    },
  ],
});

export const dossieDoTalento = withReadingMinutes({
  slug: "dossie-do-talento",
  moduleSlug: "assets",
  moduleOrder: 3,
  chapterNumber: 18,
  title: "Montando o dossiê oficial do talento",
  subtitle: "Documentação pronta para responder oportunidades reais",
  cover: getModuleCoverPath("assets"),
  blocks: [
    {
      type: "paragraph",
      text: "Quando oportunidade aparece, quase sempre aparece com urgência. Familia que corre para achar documento perde prazo e entra em estresse. Familia que tem dossie pronto responde com profissionalismo e tranquilidade.",
    },
    {
      type: "heading",
      level: 2,
      text: "O que entra no dossie oficial",
    },
    {
      type: "checklist",
      items: [
        "Certidao de nascimento da criança",
        "RG e CPF do responsável legal",
        "Comprovante de residencia atualizado",
        "Fotos oficiais recentes: close, meio corpo e corpo inteiro",
        "Medidas atualizadas: altura, peso, calcado e numeracao de roupa",
        "Video de apresentação de 30 segundos, simples e natural",
        "Autorização para uso de imagem conforme exigência do ECA",
      ],
    },
    {
      type: "paragraph",
      text: "Organize tudo em versoes digital e impressa. No digital, mantenha pasta com nomes padronizados e data de atualização. No físico, use envelope único para levar em set quando solicitado. Esse cuidado parece pequeno, mas passa confiança para agência e produção.",
    },
    {
      type: "image",
      src: getCasePath("familyPlan"),
      alt: "Pasta organizada com documentos e fotos oficiais do talento",
      caption: "Dossie pronto transforma urgência em resposta profissional.",
    },
    {
      type: "table",
      headers: ["Item", "Periodicidade de revisão", "Responsavel"],
      rows: [
        ["Fotos oficiais", "A cada 4 a 6 meses", "Responsavel + fotografo"],
        ["Medidas", "A cada 2 meses ou mudanca visivel", "Responsavel"],
        ["Video 30s", "A cada 4 meses", "Responsavel"],
        ["Documentos civis", "Revisão semestral", "Responsavel"],
      ],
    },
    {
      type: "quote",
      text: "Talento preparado não é o que corre mais. É o que responde melhor.",
    },
    {
      type: "caseStudy",
      title: "Convocação em 24 horas",
      body: "A família do Caio recebeu convite para teste com prazo de um dia. Como o dossie estava pronto, enviou fotos, medidas e video em menos de 40 minutos. Entrou no casting final enquanto outras famílias ainda buscavam documento. Preparação virou vantagem competitiva.",
      takeaway: "Organização de bastidor aumenta chance de entrar no jogo certo.",
    },
    {
      type: "alert",
      title: "Documento sensivel pede sigilo",
      body: "Compartilhe dossie somente com canais confiaveis, contrato ou solicitacao formal. Evite enviar documento completo por grupos abertos. Proteção de dados da criança e parte da sua responsabilidade legal.",
    },
    {
      type: "exercise",
      title: "Montagem do seu dossie hoje",
      steps: [
        "Crie uma pasta digital chamada Dossie Talento Nome da Criança.",
        "Adicione todos os itens do checklist e marque o que falta.",
        "Grave um video de apresentação de 30 segundos com luz natural.",
        "Defina uma data fixa mensal para revisão rapida do dossie.",
      ],
    },
    {
      type: "takeaways",
      items: [
        "Dossie pronto economiza tempo e reduz estresse em convocação urgente.",
        "Checklist minimo inclui certidao, RG do responsável, fotos, medidas, video e autorização ECA.",
        "Organização e sigilo caminham juntos na gestão profissional.",
      ],
    },
  ],
});
