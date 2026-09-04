/**
 * Seed dos 8 artigos do cluster SEO "carreira de modelo infantil".
 * Insere como RASCUNHO (publishedAt = null) para revisão no admin.
 *
 * Uso: npx tsx scripts/seed-blog-seo-posts.ts
 * Env: DATABASE_URL, BLOG_SEED_AUTHOR_EMAIL (opcional, default admin@ccmf.com.br)
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type SeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  content: string;
};

const AUTHOR_EMAIL = process.env.BLOG_SEED_AUTHOR_EMAIL ?? "admin@ccmf.com.br";

const POSTS: SeedPost[] = [
  {
    title: "Como colocar meu filho para ser modelo: guia completo para mães",
    slug: "como-colocar-meu-filho-para-ser-modelo",
    excerpt:
      "Passo a passo seguro para iniciar a carreira de modelo infantil: interesse da criança, fotos, golpes, agências e alternativas honestas como concursos sérios.",
    metaDescription:
      "Guia para mães: como colocar o filho para ser modelo infantil com segurança, sem golpes e sem sacrificar a infância.",
    category: "carreira",
    content: `# Como colocar meu filho para ser modelo: guia completo para mães

Colocar um filho para ser modelo infantil **não começa com uma agência cara** — começa com observação, material simples e critérios claros para proteger a criança.

Este guia resume o caminho mais seguro para famílias brasileiras que buscam carreira de modelo fotográfico infantil sem cair em promessas de fama.

## 1. Observe se a criança realmente gosta

Antes de investir, veja se a criança:

- se sente confortável diante da câmera;
- consegue seguir orientações simples sem sofrimento;
- demonstra interesse genuíno (não só o desejo dos adultos).

Se houver resistência forte, pause. Nenhuma carreira vale a infância.

## 2. Monte um material inicial honesto

No começo, você **não precisa** de book profissional. Duas fotos boas, bem iluminadas, com expressão natural e fundo simples já bastam para muitos processos de fotogenia.

Prefira:

- luz natural perto da janela;
- roupa simples;
- rosto nítido e expressão espontânea.

## 3. Filtre oportunidades e golpes

Desconfie de quem:

- cobra alto adiantado por “garantia de trabalho”;
- promete fama rápida;
- pressiona a assinar na hora;
- evita explicar contrato e comissão.

Propostas sérias explicam regras, prazos e direitos da criança.

## 4. Escolha caminhos transparentes

Uma boa porta de entrada é um **concurso de fotogenia com regulamento público**, categorias por idade e comunicação clara — como o [Concurso Criança Mais Fotogênica](/o-concurso).

Isso ajuda a família a testar o interesse da criança sem transformar o início em dívida.

## 5. Estude gestão de carreira antes de acelerar

Ser modelo infantil envolve cachês, contratos, rotina escolar e proteção. O curso [Como Gerenciar a Carreira do Seu Filho](/curso), da fundadora Claudia Cavalcante, ensina esse método — e é gratuito para inscritos no concurso.

## Resumo prático

1. Interesse real da criança.
2. Fotos simples e honestas.
3. Zero pressão e zero promessa milagrosa.
4. Preferir regras públicas a “pacotes mágicos”.
5. Família no comando das decisões.

Quer começar com uma experiência oficial? Veja a [inscrição da edição atual](/inscricao) ou leia o guia completo em [carreira de modelo infantil](/carreira-de-modelo-infantil).
`,
  },
  {
    title: "Como gerenciar a carreira de modelo do seu filho",
    slug: "como-gerenciar-a-carreira-de-modelo-do-seu-filho",
    excerpt:
      "O papel do pai e da mãe como gestores: rotina, contratos, cachês, rejeições e como proteger a infância sem travar oportunidades reais.",
    metaDescription:
      "Como gerenciar a carreira de modelo infantil do seu filho com método, números reais e proteção da infância.",
    category: "carreira",
    content: `# Como gerenciar a carreira de modelo do seu filho

Gerenciar a carreira de modelo infantil é menos sobre “descobrir o próximo artista” e mais sobre **organizar decisões** — com a infância no centro.

## O responsável é o gestor

A criança participa; o adulto decide com critério. Isso inclui:

- aceitar ou recusar trabalhos;
- controlar agenda e deslocamentos;
- ler contratos antes de assinar;
- proteger sono, escola e lazer.

## O método POFIA (em resumo)

No curso da Claudia Cavalcante, o método POFIA organiza a gestão:

- **Proteger** — bem-estar e direitos da criança;
- **Organizar** — rotina, documentos e material;
- **Filtrar** — propostas, agências e custos;
- **Investir** — só com critério e margem;
- **Acompanhar** — humor, desempenho e limites.

## Números e expectativas realistas

Mercado infantil tem faixas de cachê, comissões e custos variáveis. Quem entra sem referência financeira sofre com frustação e pressão indevida.

## Quando acelerar e quando pausar

Acelere quando há conforto da criança e propostas claras. Pause quando houver cansaço, queda de desempenho escolar ou pressão emocional.

## Próximo passo

O curso [Como Gerenciar a Carreira do Seu Filho](/curso) aprofunda cada etapa. Para inscritos no [CCMF](/inscricao), o acesso é liberado como brinde da participação.
`,
  },
  {
    title: "Agência de modelo infantil é confiável? Como identificar golpes",
    slug: "agencia-de-modelo-infantil-golpes",
    excerpt:
      "Sinais de alerta, perguntas obrigatórias antes de assinar e como diferenciar agência séria de proposta que explora famílias.",
    metaDescription:
      "Como saber se uma agência de modelo infantil é confiável e quais golpes mães e pais devem evitar.",
    category: "carreira",
    content: `# Agência de modelo infantil é confiável? Como identificar golpes

Nem toda agência de modelo infantil é golpe — mas **muitas famílias são alvo** de propostas abusivas. Este artigo ajuda a filtrar.

## Sinais de alerta (bandeiras vermelhas)

- Cobrança alta antecipada com promessa de “trabalho garantido”.
- Pressão para decidir na hora.
- Contrato vago ou inexistente.
- Promessa de fama rápida.
- Resistência a explicar comissão e direitos autorais/imagem.

## Perguntas que você deve fazer

1. Como funciona a comissão da agência?
2. Quais custos são da família e quais da agência?
3. Existe contrato escrito com cláusulas claras?
4. Como a criança é protegida em sets e castings?
5. Posso levar o contrato para analisar com calma?

Se a resposta for evasiva, saia.

## O que uma agência séria costuma fazer

- Explica o processo sem milagre.
- Não garante resultado.
- Documenta tudo.
- Respeita escola e limites da criança.

## Alternativa no início

Antes de agência, muitas famílias testam fotogenia com [concursos transparentes](/o-concurso) e material simples. Também vale estudar o [curso de gestão de carreira](/curso) para chegar mais preparada a qualquer conversa comercial.
`,
  },
  {
    title: "Book fotográfico infantil vale a pena? Custos e alternativas",
    slug: "book-fotografico-infantil-vale-a-pena",
    excerpt:
      "Quando o book ajuda, quando é gasto precoce e quais alternativas honestas existem para começar a carreira de modelo infantil.",
    metaDescription:
      "Book fotográfico infantil vale a pena? Veja custos, momento certo e alternativas para começar sem gastar demais.",
    category: "fotos",
    content: `# Book fotográfico infantil vale a pena? Custos e alternativas

O book fotográfico infantil **pode valer a pena** — mas raramente é o primeiro passo obrigatório.

## Quando o book faz sentido

- Já existe demanda (casting, agência séria ou direção clara).
- A família entende o objetivo das fotos.
- O ensaio respeita o ritmo da criança.

## Quando é gasto precoce

- Ninguém pediu book ainda.
- A criança não gosta de fotos.
- A venda do book vem amarrada a “garantia de trabalho”.

## Alternativas no início

1. Fotos bem feitas em casa (luz natural, fundo simples).
2. Material de participação em concurso sério.
3. Ensaio pontual só quando houver necessidade real.

## Como escolher um fotógrafo

Peça referências de trabalho infantil, combine pausas, evite sessões longas demais e alinhe uso de imagem.

## Conclusão

Book não abre carreira sozinho. Critério, proteção e material honesto abrem mais portas do que um álbum caro sem plano. Veja também o guia [carreira de modelo infantil](/carreira-de-modelo-infantil) e dicas de [fotos em casa](/blog/como-tirar-boas-fotos-do-seu-filho-em-casa).
`,
  },
  {
    title: "Modelo mirim: idade mínima, direitos e o que diz a lei",
    slug: "modelo-mirim-idade-direitos-lei",
    excerpt:
      "O que famílias precisam saber sobre idade, autorizações e proteção no trabalho artístico infantil — sem juridiquês desnecessário.",
    metaDescription:
      "Modelo mirim no Brasil: idade, direitos, autorizações e cuidados legais para proteger a criança.",
    category: "carreira",
    content: `# Modelo mirim: idade mínima, direitos e o que diz a lei

Falar de modelo mirim exige cuidado: **criança não é adulto em miniatura**. Regras de trabalho artístico infantil existem para proteger, não para burocratizar à toa.

## Idade e categorias

Não há um único número mágico para “começar”. Depende do tipo de atividade e das autorizações exigidas localmente.

No [Concurso Criança Mais Fotogênica](/o-concurso), as categorias vão de bebê a teen (cerca de 2 meses a 14 anos), com regras públicas no regulamento.

## Direitos que a família deve proteger

- Jornada compatível com a idade.
- Acompanhamento do responsável.
- Escola e descanso priorizados.
- Consentimento claro de uso de imagem.
- Contrato compreensível antes de qualquer trabalho remunerado.

## DRT e autorizações

Trabalhos artísticos infantis podem exigir autorizações específicas conforme a localidade e o tipo de produção. Em caso de dúvida, busque orientação oficial ou jurídica — não confie só na “palavra” de intermediários.

## Regra de ouro

Se uma proposta ignora proteção, escola ou consentimento, **não é oportunidade** — é risco.

Para decisões práticas do dia a dia, o [curso de gestão de carreira](/curso) ajuda a família a filtrar com método.
`,
  },
  {
    title: "Como tirar boas fotos do seu filho em casa (guia prático)",
    slug: "como-tirar-boas-fotos-do-seu-filho-em-casa",
    excerpt:
      "Luz, enquadramento, expressão e erros comuns: um guia rápido para fotos infantis honestas sem estúdio profissional.",
    metaDescription:
      "Como tirar boas fotos do seu filho em casa: luz natural, enquadramento, expressão e checklist para inscrição.",
    category: "fotos",
    content: `# Como tirar boas fotos do seu filho em casa (guia prático)

Você não precisa de estúdio para tirar **boas fotos infantis**. Luz, paciência e naturalidade resolvem a maior parte.

## Checklist rápido

1. **Luz natural** perto da janela (evite sol duro no rosto).
2. **Fundo simples** — parede clara ou ambiente sem bagunça.
3. **Formato retrato** (celular na vertical).
4. **Rosto nítido** e olhos visíveis.
5. **Expressão natural** — brinque, converse, não force pose.

## O que evitar

- Filtros pesados e beleza artificial demais.
- Fotos tremidas ou escuras.
- Muitos acessórios competindo com o rosto.
- Sessão longa que cansa a criança.

## Duas fotos bastam em muitos processos

Para inscrição em concurso de fotogenia, duas fotos boas costumam ser suficientes. Veja a [página de inscrição](/inscricao) e o [regulamento](/regulamento) da edição ativa.

## Extra: prepare a criança

Explique com carinho o que vai acontecer, faça pausas e pare se ela demonstrar desconforto. Foto boa também é foto ética.
`,
  },
  {
    title: "Concurso de fotogenia infantil: como funciona e como participar",
    slug: "concurso-de-fotogenia-infantil-como-funciona",
    excerpt:
      "O que é um concurso de fotogenia, como diferir de agência/book, e como funciona a participação no CCMF com regras públicas.",
    metaDescription:
      "Como funciona um concurso de fotogenia infantil e como participar do Criança Mais Fotogênica com segurança.",
    category: "concurso",
    content: `# Concurso de fotogenia infantil: como funciona e como participar

Um concurso de fotogenia infantil avalia **expressão, presença e qualidade da fotografia** — com regras públicas e categorias por idade.

## Como funciona (visão geral)

1. Responsável se inscreve online.
2. Envia fotos da criança.
3. A organização avalia conforme critérios divulgados.
4. Participantes aprovados podem aparecer na galeria pública.
5. Resultados são comunicados pelos canais oficiais (no CCMF, com Live Revelação).

## CCMF em números de contexto

O Concurso Criança Mais Fotogênica do Brasil está na **19ª edição**, com categorias de bebê a teen e avaliação técnica. Conheça em [O Concurso](/o-concurso).

## O que a família recebe ao participar

Além da disputa, a inscrição pode incluir materiais da participação e o curso [Como Gerenciar a Carreira do Seu Filho](/curso) como brinde para inscritos confirmados.

## Como participar

Acesse a [inscrição](/inscricao), leia o [regulamento](/regulamento) e prepare duas fotos em formato retrato. Em caso de dúvida, use o [contato oficial](/contato).
`,
  },
  {
    title: "Autoestima infantil: o que concursos sérios agregam",
    slug: "autoestima-infantil-e-concursos-serios",
    excerpt:
      "Quando um concurso bem conduzido reforça autoestima — e quando a pressão dos adultos atrapalha. Sinais para observar em casa.",
    metaDescription:
      "Autoestima infantil e concursos: como uma experiência séria pode celebrar a criança sem pressão tóxica.",
    category: "autoestima",
    content: `# Autoestima infantil: o que concursos sérios agregam

Autoestima infantil não nasce de troféu — nasce de **pertença, cuidado e reconhecimento genuíno**. Um concurso sério pode celebrar a criança; um ambiente tóxico pode machucar.

## O que ajuda

- Elogiar esforço e expressão, não só “ganhar”.
- Respeitar o ritmo da criança.
- Manter escola e rotina no centro.
- Separar valor da criança do resultado do concurso.

## O que atrapalha

- Comparação constante com outras crianças.
- Pressão por curtidas ou “vitória a qualquer custo”.
- Castigo emocional se não houver destaque.
- Adultos vivendo a frustração pela criança.

## Papel de um concurso transparente

Com regulamento público, categorias justas e comunicação clara, a família vive uma experiência organizada — não uma corrida desesperada. É o espírito do [CCMF](/o-concurso).

## Se a criança não quiser continuar

Pare. Autoestima também é poder dizer não. O amor dos responsáveis não depende de faixa, título ou galeria.

Para aprofundar o equilíbrio entre oportunidade e proteção, veja o [curso para responsáveis](/curso) e o guia de [carreira de modelo infantil](/carreira-de-modelo-infantil).
`,
  },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida.");
  }

  const author = await prisma.user.findFirst({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, name: true, email: true },
  });

  if (!author) {
    console.warn(
      `Autor ${AUTHOR_EMAIL} não encontrado. Posts serão criados sem authorId. ` +
        "Ajuste BLOG_SEED_AUTHOR_EMAIL ou atribua no admin.",
    );
  } else {
    console.log(`Autor: ${author.name ?? author.email} (${author.id})`);
  }

  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true },
    });

    if (existing) {
      console.log(`• skip (já existe): ${post.slug}`);
      skipped += 1;
      continue;
    }

    await prisma.blogPost.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        metaDescription: post.metaDescription,
        category: post.category,
        content: post.content.trim(),
        coverKey: null,
        publishedAt: null,
        authorId: author?.id ?? null,
      },
    });

    console.log(`✓ rascunho criado: ${post.slug}`);
    created += 1;
  }

  console.log(`\nConcluído: ${created} criados, ${skipped} ignorados.`);
  console.log("Revise e publique em /admin/blog.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
