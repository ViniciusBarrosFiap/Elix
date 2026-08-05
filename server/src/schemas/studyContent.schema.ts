import { z } from "zod";

// Espelha src/types/studyContent.ts do app (duplicado de propósito — ver riscos na documentação).

export const statusDominioSchema = z.enum(["comecando", "em_reforco", "consolidando"]);

export const tipoCognitivoSchema = z.enum([
  "lembranca_direta",
  "causa_consequencia",
  "aplicacao_contextual",
  "relacao_entre_conceitos",
  "comparacao",
]);

export const respostaOpcaoSchema = z.enum(["A", "B", "C", "D"]);

export const alternativasSchema = z.object({
  A: z.string().min(1),
  B: z.string().min(1),
  C: z.string().min(1),
  D: z.string().min(1),
});

// ── O que a IA precisa gerar por upload ──────────────────────────────────
// Só subtemas/conceitos/perguntas: o macrotema já existe (é a disciplina escolhida
// no dropdown), então a IA não inventa mais a organização de alto nível.

export const generatedPerguntaSchema = z.object({
  tipo_cognitivo: tipoCognitivoSchema,
  pergunta: z.string().min(1),
  dica: z.string().min(1), // hint pré-resposta, NÃO pode revelar a resposta certa
  alternativas: alternativasSchema,
  resposta: respostaOpcaoSchema,
  explicacao: z.string().min(1), // só aparece pós-resposta
  dificuldade: z.number().int().min(1).max(5),
});

export const generatedConceitoSchema = z.object({
  nome: z.string().min(1),
  perguntas: z.array(generatedPerguntaSchema).min(1),
});

export const generatedSubTemaSchema = z.object({
  nome: z.string().min(1),
  conceitos: z.array(generatedConceitoSchema).min(1),
});

export const generatedStudyContentSchema = z.object({
  subtemas: z.array(generatedSubTemaSchema).min(1),
});

export type GeneratedStudyContent = z.infer<typeof generatedStudyContentSchema>;
export type GeneratedSubTema = z.infer<typeof generatedSubTemaSchema>;
export type GeneratedConceito = z.infer<typeof generatedConceitoSchema>;
export type GeneratedPergunta = z.infer<typeof generatedPerguntaSchema>;

// ── Shape completo de resposta (o que GET /api/study-content devolve) ────
// Estes tipos batem 1:1 com src/types/studyContent.ts do app.

export interface Performance {
  vezes_revisada: number;
  acertos: number;
  erros: number;
}

export interface Pergunta {
  id: string;
  tipo_cognitivo: z.infer<typeof tipoCognitivoSchema>;
  pergunta: string;
  dica: string;
  alternativas: z.infer<typeof alternativasSchema>;
  resposta: z.infer<typeof respostaOpcaoSchema>;
  explicacao: string;
  dificuldade: number;
  peso_atual: number;
  proxima_revisao: string;
  review_stage: number;
  performance: Performance;
}

export interface Conceito {
  id: string;
  nome: string;
  peso_atual: number;
  status: z.infer<typeof statusDominioSchema>;
  perguntas: Pergunta[];
}

export interface SubTema {
  id: string;
  nome: string;
  status: z.infer<typeof statusDominioSchema>;
  conceitos: Conceito[];
}

export interface MacroTema {
  id: string;
  nome: string;
  emoji: string;
  status: z.infer<typeof statusDominioSchema>;
  subtemas_ativos: number;
  subtemas: SubTema[];
}

export interface StudyContentData {
  macrotemas: MacroTema[];
}
