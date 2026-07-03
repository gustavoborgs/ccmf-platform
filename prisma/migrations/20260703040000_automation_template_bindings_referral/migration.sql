-- AlterTable: código de indicação do responsável
ALTER TABLE "guardian_profiles" ADD COLUMN "referralCode" TEXT;

UPDATE "guardian_profiles"
SET "referralCode" = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 8))
WHERE "referralCode" IS NULL;

ALTER TABLE "guardian_profiles" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "guardian_profiles_referralCode_key" ON "guardian_profiles"("referralCode");

-- Normaliza automações: templateVariables -> templateBindings com posição
UPDATE "automations"
SET "config" = (config - 'templateVariables') || jsonb_build_object(
  'templateBindings',
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object('variable', value, 'position', ordinality)
        ORDER BY ordinality
      )
      FROM jsonb_array_elements_text(config->'templateVariables') WITH ORDINALITY AS t(value, ordinality)
    ),
    '[]'::jsonb
  )
)
WHERE config ? 'templateVariables';

-- Garante bindings padrão se ficou vazio após migração
UPDATE "automations"
SET "config" = config || jsonb_build_object(
  'templateBindings',
  jsonb_build_array(
    jsonb_build_object('variable', 'guardianName', 'position', 1),
    jsonb_build_object('variable', 'resumeUrl', 'position', 2)
  )
)
WHERE NOT (config ? 'templateBindings')
   OR jsonb_array_length(config->'templateBindings') = 0;
