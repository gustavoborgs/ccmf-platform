# Módulo Participants

> Código: `src/modules/participants` · Status: em desenvolvimento

## Objetivo

Exposição pública dos participantes aprovados: galeria por ano, página
individual, likes e compartilhamento.

## Responsabilidades

- Galeria `/participantes/[ano]` (somente `APPROVED`, `SEMIFINALIST`, `WINNER`).
- Página `/participantes/[ano]/[slug]` com foto, categoria, cidade/UF.
- Like anônimo (sem login) com deduplicação por fingerprint.
- Metadados Open Graph para compartilhamento (WhatsApp/Instagram).
- Não gerencia dados cadastrais (módulo `registrations`).

## API pública

| Função | Descrição |
| --- | --- |
| `listPublicParticipants(year)` | Galeria do ano, ordenada por likes |
| `getPublicParticipant(year, slug)` | Página individual |
| `likeRegistration(registrationId, fingerprint)` | Like único por visitante |
| `buildLikeFingerprint(ip, userAgent)` | Hash anônimo do visitante |

## Regras de negócio

1. Somente inscrições aprovadas aparecem publicamente — **nunca** expor
   crianças não aprovadas ou sem pagamento.
2. Não expor dados sensíveis: somente primeiro nome + sobrenome, cidade/UF,
   categoria e foto. Nunca data de nascimento completa ou dados do responsável.
3. Like é por inscrição (criança × edição) e idempotente por fingerprint
   (hash sha256 de ip+user-agent). `likesCount` é cache desnormalizado.
4. Likes são engajamento social e **não influenciam** o julgamento técnico
   (prêmio "mamãe mais engajada" é apurado pelo admin fora do ranking técnico).
5. URL de compartilhamento usa o slug do participante; OG image = foto de capa
   (com moldura quando disponível).

## Permissões

- Tudo público (leitura + like). Sem escrita autenticada.
