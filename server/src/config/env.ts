import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("materials"),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.0-flash"),
  MAX_INPUT_CHARS: z.coerce.number().default(80000),
  MAX_UPLOAD_MB: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Variáveis de ambiente inválidas ou ausentes:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error(
    "Configuração inválida — confira o .env contra .env.example antes de subir o server."
  );
}

export const env = parsed.data;
