import { Type } from "@google/genai";
import { gemini } from "../../config/gemini";
import { env } from "../../config/env";
import { HttpError } from "../../middlewares/errorHandler";
import {
  GeneratedStudyContent,
  generatedStudyContentSchema,
} from "../../schemas/studyContent.schema";
import { buildStudyContentPrompt } from "./buildPrompt";

const perguntaItemSchema = {
  type: Type.OBJECT,
  properties: {
    nivel: { type: Type.INTEGER },
    pergunta: { type: Type.STRING },
    dica: { type: Type.STRING },
    alternativas: {
      type: Type.OBJECT,
      properties: {
        A: { type: Type.STRING },
        B: { type: Type.STRING },
        C: { type: Type.STRING },
        D: { type: Type.STRING },
      },
      required: ["A", "B", "C", "D"],
    },
    resposta: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
    explicacao: { type: Type.STRING },
  },
  required: ["nivel", "pergunta", "dica", "alternativas", "resposta", "explicacao"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    subtemas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nome: { type: Type.STRING },
          conceitos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nome: { type: Type.STRING },
                tag_foco: { type: Type.BOOLEAN },
                perguntas: {
                  type: Type.ARRAY,
                  items: perguntaItemSchema,
                  minItems: "3",
                  maxItems: "3",
                },
              },
              required: ["nome", "tag_foco", "perguntas"],
            },
          },
        },
        required: ["nome", "conceitos"],
      },
    },
  },
  required: ["subtemas"],
};

// Timeout por chamada individual ao Gemini — proteção só contra uma chamada
// realmente travada (rede morta, sem resposta nenhuma), não contra geração
// demorada — confirmado que uma geração de material grande pode legitimamente
// passar de 27s (o valor anterior cortava gerações válidas no meio, gerando
// "AbortError: This operation was aborted"). 50s dá bastante fôlego pro caso
// normal. Em produção (Vercel Hobby, maxDuration 60s no vercel.json), ainda
// existe o teto de 60s da própria plataforma — se UMA chamada já está perto
// de 50s e ainda precisar do retry de schema (ver generateStudyContent), dá
// pra estourar o limite da função lá. Não tem como resolver isso só com
// timeout sem também aumentar o maxDuration (exige plano Pro, até 300s).
const TIMEOUT_POR_CHAMADA_MS = 50000;

async function callGemini(prompt: string): Promise<unknown> {
  let raw: string | undefined;

  try {
    const response = await gemini.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        httpOptions: { timeout: TIMEOUT_POR_CHAMADA_MS },
      },
    });
    raw = response.text;
  } catch (err) {
    console.error("Falha ao chamar o Gemini:", err);
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

interface GenerateInput {
  disciplinaNome: string;
  tags: string[];
  texto: string;
}

/**
 * Chama o Gemini pedindo subtemas/conceitos/perguntas para a disciplina já
 * escolhida. Faz no máximo 1 retry se a resposta não bater com o schema
 * esperado — no pior caso são 2 chamadas ao Gemini (até TIMEOUT_POR_CHAMADA_MS
 * cada) numa única requisição, o que cabe nos 60s da função com folga.
 *
 * Não faz retry automático em erro transitório (ex: 503 de sobrecarga): na
 * prática, quando o Gemini rejeita por sobrecarga costuma continuar
 * rejeitando por bem mais que alguns segundos — um retry imediato não ajuda
 * e só consome parte do orçamento de tempo à toa. Melhor falhar rápido com
 * uma mensagem clara e deixar o usuário tentar de novo.
 */
export async function generateStudyContent({
  disciplinaNome,
  tags,
  texto,
}: GenerateInput): Promise<GeneratedStudyContent> {
  const firstPrompt = buildStudyContentPrompt({ disciplinaNome, tags, texto });
  const firstRaw = await callGemini(firstPrompt);
  const firstParsed = generatedStudyContentSchema.safeParse(firstRaw);

  if (firstParsed.success) {
    return firstParsed.data;
  }

  const retryPrompt = buildStudyContentPrompt({
    disciplinaNome,
    tags,
    texto,
    correcaoAnterior: firstParsed.error.message,
  });
  const retryRaw = await callGemini(retryPrompt);
  const retryParsed = generatedStudyContentSchema.safeParse(retryRaw);

  if (retryParsed.success) {
    return retryParsed.data;
  }

  throw new HttpError(
    422,
    "A IA não conseguiu gerar um conteúdo válido para este material após uma nova tentativa."
  );
}
