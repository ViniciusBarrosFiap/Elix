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

  // Integração Notion (OAuth 2.0) — opcionais: sem elas o server sobe normal,
  // só as rotas /api/notion respondem 501. Criada em notion.so/my-integrations
  // como integração PÚBLICA. NOTION_REDIRECT_URI precisa ser a URL pública
  // deste server (ex: https://seu-deploy.vercel.app/api/notion/callback) e
  // bater exatamente com o que está cadastrado na integração.
  NOTION_CLIENT_ID: z.string().min(1).optional(),
  NOTION_CLIENT_SECRET: z.string().min(1).optional(),
  NOTION_REDIRECT_URI: z.string().url().optional(),
  // Deep link pro app depois que o OAuth termina — precisa bater com o
  // "scheme" do app.json (expo). Default assume o scheme "elix" já usado.
  APP_DEEP_LINK_URL: z.string().min(1).default("elix://notion-connected"),
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
