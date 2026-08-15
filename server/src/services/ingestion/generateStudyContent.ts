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

async function callGemini(prompt: string): Promise<unknown> {
  let raw: string | undefined;

  try {
    const response = await gemini.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    raw = response.text;
  } catch (err) {
    console.error("Falha ao chamar o Gemini:", err);
    throw new HttpError(502, "Não foi possível gerar sua revisão agora, tente novamente em instantes.");
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
 * Chama o Gemini pedindo subtemas/conceitos/perguntas para a disciplina já escolhida.
 * Faz no máximo 1 retry se a resposta não bater com o schema esperado.
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
