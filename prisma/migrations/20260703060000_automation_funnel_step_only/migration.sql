-- Converte configs legadas (statuses) para etapa do funil.
UPDATE "automations"
SET
  "config" = ("config" - 'statuses') || jsonb_build_object('funnelStep', 'PENDING_PHOTOS')
WHERE
  "config" ? 'statuses'
  AND NOT ("config" ? 'funnelStep');
