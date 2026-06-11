-- Marca usuários criados por importação/convite que ainda precisam definir senha.
ALTER TABLE "users" ADD COLUMN "requiresPasswordSetup" BOOLEAN NOT NULL DEFAULT false;
