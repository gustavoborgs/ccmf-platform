import { db } from "@/shared/db";

/**
 * Módulo Judging: votação técnica dos jurados.
 * Spec: docs/modules/judging.md
 *
 * Rodada 1: jurados avaliam APPROVED -> top 80 viram SEMIFINALIST
 * Rodada 2: jurados avaliam SEMIFINALIST -> top 10 (2 por categoria) viram WINNER
 */

export async function castVote(params: {
  judgeId: string;
  registrationId: string;
  score: number;
  round: 1 | 2;
  comment?: string;
}) {
  if (params.score < 1 || params.score > 10) {
    throw new Error("Nota deve estar entre 1 e 10.");
  }

  return db.vote.upsert({
    where: {
      judgeId_registrationId_round: {
        judgeId: params.judgeId,
        registrationId: params.registrationId,
        round: params.round,
      },
    },
    update: { score: params.score, comment: params.comment },
    create: params,
  });
}

/** Ranking por média de notas dentro de uma categoria/rodada. */
export async function getCategoryRanking(categoryId: string, round: number) {
  const grouped = await db.vote.groupBy({
    by: ["registrationId"],
    where: { round, registration: { categoryId } },
    _avg: { score: true },
    _count: { score: true },
    orderBy: { _avg: { score: "desc" } },
  });

  return grouped.map((row) => ({
    registrationId: row.registrationId,
    averageScore: row._avg.score ?? 0,
    totalVotes: row._count.score,
  }));
}
