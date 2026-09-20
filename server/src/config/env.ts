import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("materials"),
  OPENAI_API_KEY: z.string().min(1),
  // Fase 1 (planejador — só decide os NOMES dos subtemas): 1 chamada só,
  // então usa um modelo mais forte pra pegar um bom recorte do material.
  OPENAI_MODEL_SUBTEMAS: z.string().min(1).default("gpt-4o"),
  // Fase 2 (1 chamada por subtema, todas em paralelo — gera conceitos +
  // perguntas): mini é suficiente pra tarefa e mais barato/rápido, importante
  // porque várias chamadas disparam ao mesmo tempo dentro do teto de 60s da
  // função na Vercel.
  OPENAI_MODEL_CONCEITOS: z.string().min(1).default("gpt-4o-mini"),
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
