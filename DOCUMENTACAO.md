# Elix — Backend v1 (documentação)

Este documento descreve o que foi implementado na branch `feature/backend-mvp`:
um backend mínimo que troca os dados mockados do app por dados reais, gerados a
partir dos materiais de estudo que o usuário envia.

O plano original de design está em
[`~/.claude/plans/precisamos-planejar-o-backend-fluttering-treasure.md`](.) (fora
do repo) — este documento é o retrato do que foi de fato construído, já incorporando
o ajuste pedido depois: **macrotema deixou de ser gerado pela IA e passou a ser a
própria disciplina** cadastrada no onboarding.

## 1. Visão geral do fluxo

```
Onboarding (addSubjects.tsx)
  → PATCH /api/users/me { disciplinas }
  → backend cria 1 macro_tema por disciplina nova (nunca deleta)

Upload de material (addContent.tsx)
  → usuário escolhe a disciplina (dropdown, alimentado por GET /api/macro-temas)
  → POST /api/materials { file, macro_tema_id, tags }
  → backend extrai texto (PDF/DOCX) → Gemini gera subtemas/conceitos/perguntas
    → grava tudo dentro do macrotema escolhido → devolve o StudyContentData atualizado

Home (HomeScreen.tsx)
  → GET /api/study-content → macrotemas com subtemas/conceitos/perguntas reais

Quiz de hoje (quiz/index.tsx)
  → GET /api/quiz/today → subconjunto de perguntas, transformadas para o shape do quiz
```

Tudo síncrono: o app manda o arquivo e espera uma única resposta já com o
conteúdo gerado (sem endpoint de status/polling nesta fase).

### Fluxo detalhado do backend (upload → geração)

O trecho mais complexo é o pipeline síncrono disparado por `POST /api/materials`
(implementado em `server/src/services/materials.service.ts` +
`server/src/services/ingestion/*`). O diagrama abaixo mostra exatamente esse
caminho, incluindo o retry único de validação e os dois desfechos possíveis:

```mermaid
sequenceDiagram
    actor U as Usuário
    participant App as App (Expo)
    participant API as Backend (Express)
    participant DB as Supabase (Postgres + Storage)
    participant AI as Gemini

    U->>App: Escolhe disciplina + arquivo, toca "Gerar revisão"
    App->>API: POST /api/materials (file, macro_tema_id, tags)

    API->>DB: valida se macro_tema_id pertence ao usuário
    DB-->>API: ok (ou 404 se não pertencer)

    API->>DB: insert materials (status = "processando")
    API->>DB: upload best-effort do arquivo original (Storage)
    Note over API,DB: se o Storage falhar, o pipeline segue mesmo assim

    API->>API: extrai texto (pdf-parse / mammoth) e trunca (MAX_INPUT_CHARS)
    API->>AI: gera subtemas → conceitos → perguntas (JSON estruturado)
    AI-->>API: JSON

    API->>API: valida a resposta com zod

    alt JSON inválido na 1ª tentativa
        API->>AI: reenvia o prompt com o erro de validação (1 retry)
        AI-->>API: novo JSON
        API->>API: valida novamente
    end

    alt ainda inválido após o retry
        API->>DB: materials.status = "erro" + erro_mensagem
        API-->>App: 422 { erro_mensagem }
        App-->>U: Alert de erro, permanece na tela
    else conteúdo válido
        API->>DB: insere sub_temas/conceitos/perguntas (transação atômica)
        API->>DB: materials.status = "concluido"; users.fez_upload = true
        DB-->>API: StudyContentData atualizado do usuário
        API-->>App: 200 { material_id, macrotemas }
        App->>App: atualiza studyContentStore + userDataStore
        App-->>U: navega para Home com o macrotema já enriquecido
    end
```

## 2. Onde está cada coisa

| Camada | Local |
|---|---|
| Backend (API) | `/server` — Express + TypeScript |
| Schema do banco | `/server/sql/001_init.sql`, `/server/sql/002_functions.sql` |
| App (React Native/Expo) | raiz do repo, inalterado na estrutura, só trocou de onde os dados vêm |
| Setup/deploy do backend | [`/server/README.md`](server/README.md) |

## 3. Modelo de dados

```
users
  └─ (users.disciplinas: text[]) ──sincroniza──> macro_temas (1 por disciplina)
                                                      └─ sub_temas
                                                           └─ conceitos
                                                                └─ perguntas

materials (registro de cada upload; aponta para o macro_tema escolhido)
```

Decisão central desta fase: **macrotema = disciplina**. As disciplinas digitadas
no onboarding nascem como `macro_temas` automaticamente — sem esperar nenhum
upload. Ao enviar um material, o usuário escolhe a qual macrotema ele pertence;
a IA só gera o que fica *dentro* dele (subtemas → conceitos → perguntas), nunca
mais a árvore inteira do zero. Um macrotema pode receber conteúdo de vários
uploads ao longo do tempo — cada envio soma subtemas novos, sem tentar mesclar
com o que já existe (ver limitações).

Detalhe de schema que vale destacar: `Pergunta` ganhou um campo `dica` gerado
pela própria IA, separado de `explicacao`. `dica` é mostrada **antes** do
usuário responder e nunca pode indicar a resposta certa; `explicacao` só
aparece **depois**. Reaproveitar `explicacao` como `dica` (a ideia original)
entregaria a resposta antes da hora — por isso o campo extra.

Schema completo comentado: [`server/sql/001_init.sql`](server/sql/001_init.sql).

## 4. Referência da API

Toda rota (exceto `/api/health`) exige o header `X-Device-Id: <uuid>` — a
identidade é anônima por dispositivo, sem login/senha. Se o device ainda não
existe, o backend cria o usuário automaticamente na primeira request.

| Método | Rota | Payload | Retorna |
|---|---|---|---|
| `GET` | `/api/health` | — | `{ ok: true }` |
| `POST` | `/api/users/identify` | — | `UserData` (cria se necessário) |
| `GET` | `/api/users/me` | — | `UserData` |
| `PATCH` | `/api/users/me` | `Partial<{nome, curso, semestre, disciplinas, primeiroAcesso, fezUpload}>` | `UserData` — se `disciplinas` vier, sincroniza `macro_temas` |
| `GET` | `/api/macro-temas` | — | `[{id, nome, emoji, status}]` — para o dropdown de upload |
| `POST` | `/api/materials` | `multipart/form-data`: `file`, `macro_tema_id` (obrigatório), `tags` (JSON array opcional) | `{ material_id, macrotemas: [...] }` |
| `GET` | `/api/study-content` | — | `StudyContentData` (`{ macrotemas: [...] }`) |
| `GET` | `/api/quiz/today` | `?limit=10` opcional | `QuizQuestionsData` (`{ questoes: [...] }`) |

`GET /api/quiz/today` não tem tabela própria — seleciona um subconjunto de
`perguntas` do usuário (mais próximas da `proxima_revisao`) e transforma o
shape na leitura (`pergunta→titulo`, `dica→dica`, `alternativas→opcoes[]`,
`resposta→id_gabarito`, `conceito.nome→categoria`).

Erros seguem o formato `{ "erro_mensagem": "..." }` com o status HTTP
apropriado (`400` payload inválido, `401` sem `X-Device-Id`, `404` macrotema
não encontrado/não pertence ao usuário, `422` falha de extração/validação da
IA, `500`/`502` falhas internas ou da IA).

## 5. O que mudou no app

A arquitetura já preparava esse ponto de integração — só os repositories e um
punhado de call sites mudaram, nenhum componente visual precisou ser reescrito:

| Arquivo | Mudança |
|---|---|
| `src/lib/deviceId.ts` (novo) | Gera/persiste o UUID de identidade anônima via `expo-secure-store` |
| `src/lib/config.ts` (novo) | Lê `EXPO_PUBLIC_API_BASE_URL` |
| `src/lib/apiClient.ts` (novo) | Wrapper de `fetch` com header `X-Device-Id` e tratamento de erro padrão |
| `src/services/user/user.repository.ts` | `getUser`/`updateUser` agora chamam a API real |
| `src/services/user/user.service.ts` | `updateUser` virou assíncrono (antes só mexia na store local) |
| `src/services/studyContent/studyContent.repository.ts` | `getAll` real + novo `listMacroTemas` |
| `src/services/quiz/quiz.repository.ts` | `getAll` chama `/api/quiz/today` |
| `src/services/materials/*` (novo) | `uploadFile` — usado pelo botão "Gerar revisão" |
| `src/types/studyContent.ts` | `Pergunta` ganhou `dica: string` |
| `src/types/quizQuestions.ts` | `QuizQuestion` ganhou `id: string` |
| `app/(auth)/signUp.tsx`, `app/(auth)/addSubjects.tsx` | `UserService.updateUser(...)` agora tem `await` + tratamento de erro |
| `app/(tabs)/studyContents/addContent.tsx` | Novo dropdown obrigatório de disciplina; `handleGenerate` agora faz o upload de verdade e mostra estado de carregamento |

## 6. Rodando tudo localmente

1. Suba o backend seguindo [`server/README.md`](server/README.md) (`npm run dev`
   dentro de `/server`, com Supabase e Gemini configurados).
2. Na raiz do repo, copie `.env.example` para `.env` e aponte
   `EXPO_PUBLIC_API_BASE_URL` para o IP da sua máquina na rede local (não
   `localhost` — o emulador/dispositivo físico não o enxerga), ex:
   `http://192.168.0.10:3333`.
3. `npx expo start --android` (ou `--ios`) como já validamos antes.
4. Fluxo esperado: onboarding grava disciplinas reais → elas aparecem como
   cards vazios na home → upload de um material com uma disciplina escolhida
   faz aquele card específico ganhar conteúdo → quiz de hoje mostra perguntas
   geradas de verdade.

## 7. Limitações conhecidas (aceitas nesta fase)

- **Sem autenticação real** — identidade por device, reinstalar o app perde o
  histórico.
- **Sem repetição espaçada de verdade** — `proxima_revisao`/`review_stage`/
  `performance` nascem com defaults; nada os recalcula ainda.
- **Resultado do quiz não é salvo** — o quiz responde só na tela, como no mock.
- **Sem merge entre uploads do mesmo macrotema** — cada envio soma subtemas
  novos; enviar dois materiais sobre o mesmo assunto gera conteúdo duplicado.
- **Emoji fixo (📘)** em todo macrotema — antes vinha da IA a partir do
  material; agora o macrotema nasce só do nome da disciplina, sem conteúdo
  para basear um emoji melhor.
- **Processamento síncrono, sem fila** — upload de arquivo muito grande/lento
  pode esbarrar no timeout da função serverless.
- **Sem chunking** — materiais muito longos são truncados (`MAX_INPUT_CHARS`)
  antes de chegar à IA.
- **Sem RLS no Supabase** — o isolamento por usuário é responsabilidade do
  código do backend (Service Role Key), não do banco.
- **Tipos duplicados** entre `src/types/*.ts` (app) e `server/src/schemas/*.ts`
  (server) — mudar um lado sem o outro quebra silenciosamente.

## 8. Próximos passos sugeridos (fora do escopo desta fase)

1. Persistir resultado do quiz (endpoint de submissão de resposta) e recalcular
   `performance`/`peso_atual`/`status` dos conceitos — é o que faria os
   `LiquidFillCard` da home mostrarem progresso real.
2. Algoritmo de repetição espaçada de verdade sobre `proxima_revisao`/`review_stage`.
3. Login real (para não depender só de identidade por device).
4. Integração com Notion (o botão já existe na UI).
5. Merge/deduplicação inteligente entre uploads do mesmo macrotema.
