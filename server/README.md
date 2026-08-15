# Elix Server

Backend mínimo do Elix: recebe um material de estudo (PDF/DOCX), extrai o texto,
manda para o Gemini gerar subtemas/conceitos/perguntas dentro da disciplina
escolhida pelo usuário, e salva tudo no Supabase.

Visão geral da arquitetura, schema e decisões de design: veja
[`/DOCUMENTACAO.md`](../DOCUMENTACAO.md) na raiz do repo.

## Setup

### 1. Instale as dependências

```bash
cd server
npm install
```

### 2. Crie um projeto Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. No **SQL Editor**, rode nesta ordem (cada arquivo depende do anterior):
   - [`sql/001_init.sql`](sql/001_init.sql) — cria as tabelas e enums.
   - [`sql/002_functions.sql`](sql/002_functions.sql) — cria a função de persistência transacional.
   - [`sql/003_progressao_por_conceito.sql`](sql/003_progressao_por_conceito.sql) — modelo
     pedagógico real: nível por conceito, status próprio, 3 perguntas fixas por conceito.
   - [`sql/004_streak.sql`](sql/004_streak.sql) — coluna de streak do usuário.
   - [`sql/005_disciplinas_ativas.sql`](sql/005_disciplinas_ativas.sql) — permite
     "remover" uma disciplina sem apagar o conteúdo já gerado (soft-remove).
3. Em **Storage**, crie um bucket **privado** chamado `materials` (ou o nome que você
   colocar em `SUPABASE_STORAGE_BUCKET`). Se pular esse passo, o upload do arquivo
   original ao Storage falha silenciosamente e o pipeline segue normalmente mesmo
   assim (é best-effort, ver documentação).
4. Em **Project Settings > API**, copie a `URL` e a `service_role` key (não a `anon`
   key — este server precisa de privilégios totais, e é ele quem garante o
   isolamento por usuário, não o Supabase Auth/RLS).

### 3. Gere uma API key do Gemini

Em https://aistudio.google.com/apikey.

### 4. Configure o `.env`

```bash
cp .env.example .env
# edite .env com suas credenciais reais
```

### 5. Rode localmente

```bash
npm run dev
```

Deve subir em `http://localhost:3333` (ou a porta que você configurou). Teste com:

```bash
curl http://localhost:3333/api/health
# { "ok": true }
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o server local com watch (`tsx`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Roda o build compilado (`node dist/index.js`) |
| `npm run typecheck` | Só verifica tipos, sem gerar output |

## Testando o fluxo completo via curl

```bash
DEVICE="teste-$(date +%s)"
BASE="http://localhost:3333"

# 1. Cria o usuário
curl -s -X POST "$BASE/api/users/identify" -H "X-Device-Id: $DEVICE" | jq

# 2. Cadastra disciplinas (isso já cria os macrotemas)
curl -s -X PATCH "$BASE/api/users/me" -H "X-Device-Id: $DEVICE" \
  -H "Content-Type: application/json" \
  -d '{"disciplinas":["Endocrinologia","Neurociência"]}' | jq

# 3. Lista os macrotemas e pega um id
curl -s "$BASE/api/macro-temas" -H "X-Device-Id: $DEVICE" | jq

# 4. Envia um material para o macrotema escolhido
curl -s -X POST "$BASE/api/materials" -H "X-Device-Id: $DEVICE" \
  -F "file=@/caminho/para/algum.pdf" \
  -F "macro_tema_id=<id-do-passo-3>" \
  -F 'tags=["eixo HPT"]' | jq

# 5. Confere o conteúdo gerado e o quiz de hoje
curl -s "$BASE/api/study-content" -H "X-Device-Id: $DEVICE" | jq
curl -s "$BASE/api/quiz/today" -H "X-Device-Id: $DEVICE" | jq
```

## Troubleshooting

### `502` com `erro_mensagem` genérica no upload / log mostra `429 RESOURCE_EXHAUSTED`

O Gemini recusou a chamada por cota. Duas causas distintas, mesmo sintoma:

- **`limit: 0` no erro** (cota zero, não é rate-limit temporário — retry não resolve):
  o modelo configurado em `GEMINI_MODEL` não tem cota provisionada nesse projeto/conta,
  mesmo que a API key seja válida. Confira suas cotas **por modelo** em
  https://ai.dev/rate-limit (ou Google AI Studio → "Limite de taxa da API") — é comum
  `gemini-2.0-flash` aparecer com `0/0` enquanto `gemini-2.5-flash` ou
  `gemini-2.5-flash-lite` têm cota normal no mesmo projeto. Troque `GEMINI_MODEL` no
  `.env` para um modelo com cota disponível e reinicie o server.
- Se todos os modelos estiverem em `0/0`: a conta Google por trás da API key pode não
  ter o free tier provisionado (comum em contas Workspace/organizacionais, ou em
  algumas regiões que exigem billing habilitado mesmo para ficar dentro do tier
  gratuito). Ative billing no projeto do Google Cloud associado ou gere a chave a
  partir de uma conta Gmail pessoal.

O log do server (`console.error("Falha ao chamar o Gemini:", ...)` em
`generateStudyContent.ts`) sempre imprime o erro completo da API — o cliente só recebe
uma mensagem genérica, mas o motivo real está sempre no log.

### `502` com log mostrando `404 Not Found` / "model ... is no longer available"

Não é cota — o modelo em `GEMINI_MODEL` foi descontinuado pela Google (ex:
`gemini-2.0-flash` parou de responder com esse erro em agosto/2026). Troque para um
modelo atual (`gemini-2.5-flash` funcionava no momento em que este README foi escrito)
e reinicie o server. Testado e confirmado: o pipeline trata isso como qualquer outra
falha do Gemini — o material fica marcado `status: 'erro'` com a mensagem genérica, nada
fica gravado pela metade.

### `Error: Node.js 20 detected without native WebSocket support`

Acontece ao iniciar o server em Node < 22 — o `@supabase/supabase-js` tenta inicializar
um cliente Realtime (que não usamos) e precisa de um WebSocket. Já corrigido em
`src/config/supabase.ts` passando o pacote `ws` como transport; se você ver esse erro
mesmo assim, confirme que rodou `npm install` depois de atualizar o repo.

## Deploy na Vercel

1. Crie um novo projeto na Vercel apontando para este repositório.
2. Em **Project Settings > General > Root Directory**, defina `server`.
3. Em **Project Settings > Environment Variables**, adicione as mesmas variáveis
   do seu `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_STORAGE_BUCKET`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
   `MAX_INPUT_CHARS`, `MAX_UPLOAD_MB`). Não defina `PORT` — a Vercel gerencia isso.
4. `vercel.json` já configura `maxDuration: 60` na função — se seu plano Vercel
   permitir um valor maior e materiais grandes estiverem estourando o tempo,
   ajuste esse número (ver riscos na documentação sobre processamento síncrono).
5. Deploy. A URL final (`https://seu-projeto.vercel.app`) é o que vai em
   `EXPO_PUBLIC_API_BASE_URL` no `.env` do app (raiz do repo).

## Nota sobre a vulnerabilidade do `npm audit`

`npm audit` acusa 2 vulnerabilidades moderadas em `uuid` (via `gaxios`, dependência
transitiva do SDK oficial `@google/genai`). Não há um pacote de nível superior para
fixar diretamente sem forçar um downgrade/upgrade potencialmente quebrando o SDK do
Gemini; é uma dependência interna do próprio SDK do Google, não do nosso código.
Reavalie quando o `@google/genai` atualizar sua própria dependência de `gaxios`.
