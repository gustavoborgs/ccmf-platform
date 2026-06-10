# Módulo Participants

> Código: `src/modules/participants` · Status: implementado

## Objetivo

Exposição pública dos participantes aprovados: galeria por ano, página
individual, likes e compartilhamento.

## Responsabilidades

- `/participantes` — redireciona para a edição mais recente com aprovados.
- Galeria `/participantes/[ano]` (somente `APPROVED`, `SEMIFINALIST`, `WINNER`),
  com busca por nome (`?q=`) e filtro por categoria (`?categoria=slug`) na URL.
- Página `/participantes/[ano]/[slug]` com fotos (portfólio), categoria, cidade/UF
  e moldura da edição sobreposta quando `Contest.frameImageKey` existir.
- Like anônimo (sem login) com deduplicação por fingerprint
  (`likeRegistrationAction`; localStorage só lembra o estado visual no aparelho).
- Compartilhamento mobile-first: Web Share API com fallback de copiar link.
- Metadados Open Graph para compartilhamento (WhatsApp/Instagram).
- Não gerencia dados cadastrais (módulo `registrations`).

## API pública

| Função | Descrição |
| --- | --- |
| `listPublicYears()` | Anos com participantes públicos (recente primeiro) |
| `listPublicParticipants(year, filters?)` | Galeria do ano (filtros: `q`, `categorySlug`), ordenada por likes |
| `getPublicParticipant(year, slug)` | Página individual (fotos com capa primeiro) |
| `likeRegistration(registrationId, fingerprint)` | Like único por visitante |
| `buildLikeFingerprint(ip, userAgent)` | Hash anônimo do visitante |
| `publicDisplayName(fullName)` | Nome público (primeiro nome + sobrenome) |
| `publicStatusBadge(status, gender)` | Selo de vencedor/semifinalista |

## Regras de negócio

1. Somente inscrições aprovadas aparecem publicamente — **nunca** expor
   crianças não aprovadas ou sem pagamento.
2. Não expor dados sensíveis: somente primeiro nome + sobrenome, cidade/UF,
   categoria e foto. Nunca data de nascimento completa ou dados do responsável.
3. Like é por inscrição (criança × edição) e idempotente por fingerprint
   (hash sha256 de ip+user-agent). `likesCount` é cache desnormalizado.
4. Likes são engajamento social e **não influenciam** o julgamento técnico
   (prêmio "mamãe mais engajada" é apurado pelo admin fora do ranking técnico).
5. URL de compartilhamento usa o slug do participante; a página exibe a foto
   com moldura quando disponível. OG image usa a foto de capa original na v1
   (composição server-side fica para evolução do módulo `media`).

## Permissões

- Tudo público (leitura + like). Sem escrita autenticada.
