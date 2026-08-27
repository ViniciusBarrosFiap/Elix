import { z } from "zod";

// Espelha src/types/studyContent.ts do app (duplicado de propósito — ver riscos na documentação).

// Status de macro_tema/sub_tema (nunca muda hoje — não há algoritmo que os atualize).
export const statusDominioSchema = z.enum(["comecando", "em_reforco", "consolidando"]);

// Status de conceito é um vocabulário à parte: nasce 'novo' e evolui via
// POST /api/quiz/answer (ver submitAnswer.ts) até 'dominado' no nível 3.
export const statusConceitoSchema = z.enum(["novo", "em_reforco", "consolidando", "dominado"]);

// nivel 1=identificação, 2=relação entre conceitos, 3=aplicação contextual (doc MVP §5).
export const nivelPerguntaSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const tipoPerguntaSchema = z.enum(["identificacao", "relacao", "aplicacao"]);

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
// Cada conceito deve ter exatamente 3 perguntas — uma por nível — e a IA só
// decide o `nivel`; o `tipo` é derivado dele no banco (ver 002_functions.sql).

export const generatedPerguntaSchema = z.object({
  nivel: nivelPerguntaSchema,
  pergunta: z.string().min(1),
  dica: z.string().min(1), // hint pré-resposta, NÃO pode revelar a resposta certa
  alternativas: alternativasSchema,
  resposta: respostaOpcaoSchema,
  explicacao: z.string().min(1), // só aparece pós-resposta
});

export const generatedConceitoSchema = z.object({
  nome: z.string().min(1),
  tag_foco: z.boolean(),
  perguntas: z
    .array(generatedPerguntaSchema)
    .length(3, "cada conceito precisa de exatamente 3 perguntas (níveis 1, 2 e 3)")
    .refine(
      (perguntas) => new Set(perguntas.map((p) => p.nivel)).size === 3,
      "as 3 perguntas do conceito devem cobrir os níveis 1, 2 e 3 sem repetir"
    ),
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
  vezes_revisado: number;
  acertos: number;
  erros: number;
}

export interface Pergunta {
  id: string;
  nivel: z.infer<typeof nivelPerguntaSchema>;
  tipo: z.infer<typeof tipoPerguntaSchema>;
  pergunta: string;
  dica: string;
  alternativas: z.infer<typeof alternativasSchema>;
  resposta: z.infer<typeof respostaOpcaoSchema>;
  explicacao: string;
}

export interface Conceito {
  id: string;
  nome: string;
  status: z.infer<typeof statusConceitoSchema>;
  nivel_atual: z.infer<typeof nivelPerguntaSchema>;
  tag_foco: boolean;
  proxima_revisao: string;
  performance: Performance;
  perguntas: Pergunta[];
}

// Tipo do material que originou o subtema — determina como o app oferece a
// visualização (link direto pro YouTube, URL assinada do Storage pro
// documento, ou nenhuma opção pro Notion — ver materials.service.ts).
export type MaterialTipo = "documento" | "youtube" | "notion";

export interface SubTemaMaterial {
  id: string;
  nome: string; // nome do arquivo, URL do vídeo ou título da página
  tipo: MaterialTipo;
}

export interface SubTema {
  id: string;
  nome: string;
  status: z.infer<typeof statusDominioSchema>;
  material: SubTemaMaterial;
  conceitos: Conceito[];
}

export interface MacroTema {
  id: string;
  nome: string;
  emoji: string;
  status: z.infer<typeof statusDominioSchema>;
  progresso: number; // 0-100, média do domínio real dos conceitos (ver studyContent.service.ts)
  subtemas_ativos: number;
  subtemas: SubTema[];
}

export interface StudyContentData {
  macrotemas: MacroTema[];
}
