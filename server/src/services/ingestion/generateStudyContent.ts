import OpenAI from "openai";
import { z } from "zod";
import { openai } from "../../config/openai";
import { env } from "../../config/env";
import { HttpError } from "../../middlewares/errorHandler";
import {
  GeneratedConceito,
  GeneratedStudyContent,
  generatedConceitoSchema,
  generatedStudyContentSchema,
} from "../../schemas/studyContent.schema";
import { buildConceitosPrompt, buildSubtemasPrompt } from "./buildPrompt";

// ── Schemas de resposta da OpenAI (JSON Schema puro, para Structured
// Outputs com strict:true) ────────────────────────────────────────────────
// Cada fase pede um pedaço pequeno da árvore, não a árvore inteira — ver
// generateStudyContent() para o porquê (arquitetura em 2 fases/N agentes).
//
// O modo strict da OpenAI não aceita minItems/maxItems em arrays nem campos
// opcionais — quem garante "exatamente 4 perguntas, níveis 1/2/3/4 sem
// repetir" continua sendo a validação Zod logo abaixo, este schema é só um
// guia estrutural pro modelo. Nível 4 (dissertativa) tem um formato diferente
// dos níveis 1-3 (sem alternativas/resposta, com resposta_modelo no lugar) —
// modelado como `anyOf` de duas variantes, já que o modo strict não aceita
// propriedade "opcional" dentro de um único objeto.

const perguntaMultiplaEscolhaItemSchema = {
  type: "object",
  properties: {
    nivel: { type: "integer", enum: [1, 2, 3] },
    pergunta: { type: "string" },
    dica: { type: "string" },
    alternativas: {
      type: "object",
      properties: {
        A: { type: "string" },
        B: { type: "string" },
        C: { type: "string" },
        D: { type: "string" },
      },
      required: ["A", "B", "C", "D"],
      additionalProperties: false,
    },
    resposta: { type: "string", enum: ["A", "B", "C", "D"] },
    explicacao: { type: "string" },
  },
  required: ["nivel", "pergunta", "dica", "alternativas", "resposta", "explicacao"],
  additionalProperties: false,
};

const perguntaDissertativaItemSchema = {
  type: "object",
  properties: {
    nivel: { type: "integer", enum: [4] },
    pergunta: { type: "string" },
    dica: { type: "string" },
    resposta_modelo: { type: "string" },
    explicacao: { type: "string" },
  },
  required: ["nivel", "pergunta", "dica", "resposta_modelo", "explicacao"],
  additionalProperties: false,
};

const perguntaItemSchema = {
  anyOf: [perguntaMultiplaEscolhaItemSchema, perguntaDissertativaItemSchema],
};

const conceitoItemSchema = {
  type: "object",
  properties: {
    nome: { type: "string" },
    tag_foco: { type: "boolean" },
    perguntas: { type: "array", items: perguntaItemSchema },
  },
  required: ["nome", "tag_foco", "perguntas"],
  additionalProperties: false,
};

// Fase 1 — só os nomes dos subtemas.
const subtemasListResponseSchema = {
  type: "object",
  properties: {
    subtemas: {
      type: "array",
      items: {
        type: "object",
        properties: { nome: { type: "string" } },
        required: ["nome"],
        additionalProperties: false,
      },
    },
  },
  required: ["subtemas"],
  additionalProperties: false,
};

const subtemasListSchema = z.object({
  subtemas: z.array(z.object({ nome: z.string().min(1) })).min(1),
});

// Fase 2 — conceitos+perguntas de UM subtema por vez.
const conceitosResponseSchema = {
  type: "object",
  properties: {
    conceitos: { type: "array", items: conceitoItemSchema },
  },
  required: ["conceitos"],
  additionalProperties: false,
};

const conceitosListSchema = z.object({
  conceitos: z.array(generatedConceitoSchema).min(1),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// O SDK (openai) expõe o status HTTP direto em APIError#status: 4xx (ex: 429
// de rate limit/cota — costuma continuar rejeitando por bastante tempo, retry
// imediato não ajuda) não é reenviado automaticamente; 5xx (sobrecarga
// momentânea do lado da OpenAI) ou erro de conexão (status undefined) valem
// um retry curto.
function isErroTransitorioDoServico(err: unknown): boolean {
  if (err instanceof OpenAI.APIConnectionError) return true;
  if (err instanceof OpenAI.APIError) return typeof err.status !== "number" || err.status >= 500;
  return false;
}

const TENTATIVAS_SOBRECARGA = 2; // 1ª chamada + 1 retry
const DELAY_ENTRE_TENTATIVAS_MS = 3000;

async function callOpenAI(
  model: string,
  prompt: string,
  schemaName: string,
  jsonSchema: Record<string, unknown>
): Promise<unknown> {
  let raw: string | null | undefined;
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= TENTATIVAS_SOBRECARGA; tentativa++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema: jsonSchema },
        },
        // gpt-4o / gpt-4o-mini (família usada aqui) não aceitam
        // reasoning_effort — a OpenAI rejeita com 400 "Unrecognized request
        // argument" se esse campo for enviado. Só a família gpt-5/o-series
        // aceita; se algum dia trocar de volta, reintroduzir esse parâmetro.
      });
      raw = response.choices[0]?.message?.content;
      ultimoErro = undefined;
      break;
    } catch (err) {
      ultimoErro = err;
      const podeTentarDeNovo = isErroTransitorioDoServico(err) && tentativa < TENTATIVAS_SOBRECARGA;
      if (!podeTentarDeNovo) break;
      console.warn(
        `OpenAI sobrecarregada (tentativa ${tentativa}/${TENTATIVAS_SOBRECARGA}), tentando de novo em ${DELAY_ENTRE_TENTATIVAS_MS}ms...`
      );
      await sleep(DELAY_ENTRE_TENTATIVAS_MS);
    }
  }

  if (ultimoErro) {
    console.error("Falha ao chamar a OpenAI:", ultimoErro);
    throw new HttpError(
      502,
      "Não foi possível gerar sua revisão agora — o serviço de IA está sobrecarregado. Tente novamente em instantes."
    );
  }

  if (!raw) {
    throw new HttpError(502, "A IA não retornou conteúdo. Tente novamente.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(502, "A IA retornou um JSON inválido. Tente novamente.");
  }
}

/**
 * Chama a OpenAI e valida a resposta contra `zodSchema`, com no máximo 1
 * retry (reenviando o prompt com o erro de validação anexado) se a 1ª
 * resposta não bater com o schema — aplicado por chamada (fase 1, ou cada
 * subtema da fase 2), não pra árvore inteira de uma vez. `errorLabel` entra
 * na mensagem de erro final, pra quem ler o log saber qual chamada falhou.
 */
async function callOpenAIValidated<T>(
  model: string,
  buildPrompt: (correcaoAnterior?: string) => string,
  schemaName: string,
  jsonSchema: Record<string, unknown>,
  zodSchema: z.ZodType<T>,
  errorLabel: string
): Promise<T> {
  const firstRaw = await callOpenAI(model, buildPrompt(), schemaName, jsonSchema);
  const firstParsed = zodSchema.safeParse(firstRaw);
  if (firstParsed.success) return firstParsed.data;

  const retryRaw = await callOpenAI(model, buildPrompt(firstParsed.error.message), schemaName, jsonSchema);
  const retryParsed = zodSchema.safeParse(retryRaw);
  if (retryParsed.success) return retryParsed.data;

  throw new HttpError(422, `${errorLabel} após uma nova tentativa.`);
}

interface GenerateInput {
  disciplinaNome: string;
  tags: string[];
  texto: string;
}

/**
 * Gera subtemas/conceitos/perguntas para a disciplina já escolhida, em 2
 * fases (arquitetura tipo "agente planejador + agentes por subtema em
 * paralelo", ver diagrama discutido com o time):
 *
 *  Fase 1 — 1 chamada rápida à OpenAI só pra decidir os NOMES dos subtemas.
 *  Fase 2 — 1 chamada por subtema, TODAS em paralelo (Promise.allSettled),
 *           cada uma gerando só os conceitos+perguntas daquele subtema.
 *
 * Antes disso tudo saía de uma única chamada gerando a árvore inteira, o que
 * ficava lento (e arriscava o timeout de 60s da função na Vercel) em
 * materiais grandes com muitos subtemas — como cada chamada agora pede uma
 * fatia bem menor de JSON, e as fatias da fase 2 rodam ao mesmo tempo, o
 * tempo total passa a ser ~ tempo do subtema mais lento, não a soma de todos.
 *
 * O contrato de saída (GeneratedStudyContent) não muda — quem chama esta
 * função (materials.service.ts) e quem persiste (persistStudyContent.ts)
 * continuam recebendo a árvore completa, como antes.
 *
 * Mantém a garantia de "nunca grava pela metade": se QUALQUER subtema falhar
 * a validação mesmo após seu próprio retry, a função inteira falha — nada é
 * persistido parcialmente (ver persistStudyContent.ts, que insere tudo numa
 * transação só).
 */
export async function generateStudyContent({
  disciplinaNome,
  tags,
  texto,
}: GenerateInput): Promise<GeneratedStudyContent> {
  const subtemasList = await callOpenAIValidated(
    env.OPENAI_MODEL_SUBTEMAS,
    (correcaoAnterior) => buildSubtemasPrompt({ disciplinaNome, tags, texto, correcaoAnterior }),
    "subtemas_list",
    subtemasListResponseSchema,
    subtemasListSchema,
    "Não foi possível planejar os subtemas deste material"
  );

  const resultados = await Promise.allSettled(
    subtemasList.subtemas.map((subtema) =>
      callOpenAIValidated(
        env.OPENAI_MODEL_CONCEITOS,
        (correcaoAnterior) =>
          buildConceitosPrompt({ disciplinaNome, subtemaNome: subtema.nome, tags, texto, correcaoAnterior }),
        "conceitos_do_subtema",
        conceitosResponseSchema,
        conceitosListSchema,
        `Não foi possível gerar o conteúdo do subtema "${subtema.nome}"`
      ).then((r) => r.conceitos)
    )
  );

  const falhas = resultados
    .map((r, i) => (r.status === "rejected" ? { nome: subtemasList.subtemas[i].nome, erro: r.reason } : null))
    .filter((f): f is { nome: string; erro: unknown } => f !== null);

  if (falhas.length > 0) {
    falhas.forEach((f) => console.error(`Falha ao gerar subtema "${f.nome}":`, f.erro));
    const nomes = falhas.map((f) => `"${f.nome}"`).join(", ");
    throw new HttpError(
      422,
      `A IA não conseguiu gerar o conteúdo de ${falhas.length > 1 ? "alguns subtemas" : "um subtema"} (${nomes}) deste material. Tente novamente.`
    );
  }

  const conceitosPorSubtema = resultados as PromiseFulfilledResult<GeneratedConceito[]>[];

  const generated: GeneratedStudyContent = {
    subtemas: subtemasList.subtemas.map((subtema, i) => ({
      nome: subtema.nome,
      conceitos: conceitosPorSubtema[i].value,
    })),
  };

  // Rede de segurança barata: confirma que a montagem final bate com o
  // schema que o resto do backend espera, antes de seguir pra persistência.
  const finalParsed = generatedStudyContentSchema.safeParse(generated);
  if (!finalParsed.success) {
    console.error("Árvore final malformada após merge dos subtemas:", finalParsed.error.message);
    throw new HttpError(500, "Falha interna ao montar o conteúdo gerado.");
  }

  return finalParsed.data;
}
