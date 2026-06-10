import { z } from "zod";

/**
 * Validação centralizada das variáveis de ambiente (server-only).
 * Lazy: valida no primeiro acesso em runtime, para não exigir secrets
 * durante o `next build`.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL: z.string().url(),

  ASAAS_BASE_URL: z.string().url(),
  ASAAS_API_KEY: z.string().min(1),
  ASAAS_WEBHOOK_TOKEN: z.string().min(1),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    cached ??= envSchema.parse(process.env);
    return cached[prop as keyof Env];
  },
});
