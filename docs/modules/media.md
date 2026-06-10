# Módulo Media

> Código: `src/modules/media` · Status: em desenvolvimento

## Objetivo

Upload das fotos dos participantes (direto para o S3) e geração da
"foto com moldura" da edição.

## Responsabilidades

- Gerar presigned URLs e registrar `Photo` na inscrição (`requestPhotoUpload`).
- Fornecer dados para composição foto + moldura (`getFramedPhotoData`).
- Upload da moldura da edição e dos logos de parceiros (admin) — mesma mecânica.
- Não decide quais fotos aparecem no site (módulo `participants`/`registrations`).

## Fluxo de upload

```
browser → action requestPhotoUpload(registrationId, fileName, contentType)
  1. valida dono da inscrição + limite de 2 fotos + tipo (jpeg/png/webp)
  2. monta key: contests/<ano>/registrations/<id>/<uuid>.<ext>
  3. cria Photo (1ª foto = isCover) e retorna presigned URL (5 min)
browser → PUT direto no S3 (a imagem não passa pelo servidor Next)
```

## Foto com moldura

- A moldura é um PNG transparente por edição (`Contest.frameImageKey`).
- Perfil público do participante exibe a moldura como camada visual sobre a foto
  quando a edição tem `frameImageKey`.
- v1: composição **no client** via `<canvas>` (download direto pelo responsável
  em `/conta` após confirmação do pagamento).
- Evolução: endpoint server-side com `sharp` para gerar e cachear a imagem
  composta no S3 (necessário para usar como OG image).

## Padrão de imagem (global)

- **Retrato 3:4** em toda a aplicação: fotos de participantes e moldura
  (`PHOTO_ASPECT` em `src/shared/utils.ts`).
- Crop obrigatório no frontend (ex.: react-easy-crop) antes do upload; o
  service valida `width`/`height` com tolerância de 2% e rejeita fora do padrão.
- Largura mínima: 600px (qualidade para galeria e moldura).
- A moldura da edição (`Contest.frameImageKey`) é um PNG transparente 3:4 —
  sobreposição direta sem distorção.

## Regras de negócio

1. Máximo de **2 fotos** por inscrição; primeira enviada vira capa.
2. Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`. Limite de 10 MB
   (validado no presign via `ContentLength` — pendente).
3. O banco guarda apenas `storageKey`; URLs públicas via `getPublicUrl()`.
4. Troca de foto: remove a antiga do S3 (`deleteObject`) e cria nova — só
   permitida antes da aprovação.

## Permissões

- Upload de fotos: `GUARDIAN` dono da inscrição (status até `UNDER_REVIEW`).
- Upload de moldura/logos: `ADMIN`.
