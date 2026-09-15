import { z } from "zod";

// Espelha src/types/studyContent.ts do app (duplicado de propósito — ver riscos na documentação).

// Status de macro_tema/sub_tema (nunca muda hoje — não há algoritmo que os atualize).
export const statusDominioSchema = z.enum(["comecando", "em_reforco", "consolidando"]);

// Status de conceito é um vocabulário à parte: nasce 'novo' e evolui via
// POST /api/quiz/answer (ver submitAnswer.ts) até 'dominado' ao acertar o
// nível 4 (a pergunta dissertativa).
export const statusConceitoSchema = z.enum(["novo", "em_reforco", "consolidando", "dominado"]);

// nivel 1=identificação, 2=relação entre conceitos, 3=aplicação contextual,
// 4=dissertativa/produção ativa — a que agora define "dominado" (doc MVP §5).
export const nivelPerguntaSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const tipoPerguntaSchema = z.enum(["identificacao", "relacao", "aplicacao", "dissertativa"]);

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
// Cada conceito deve ter exatamente 4 perguntas — uma por nível — e a IA só
// decide o `nivel`; o `tipo` é derivado dele no banco (ver 002_functions.sql).
// Níveis 1-3 são múltipla escolha (alternativas + resposta); o nível 4 é
// dissertativo — sem alternativas/resposta, com `resposta_modelo` no lugar,
// usada pelo aluno pra se autoavaliar (sem gabarito A-D pra comparar).

const perguntaMultiplaEscolhaSchema = z.object({
  nivel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pergunta: z.string().min(1),
  dica: z.string().min(1), // hint pré-resposta, NÃO pode revelar a resposta certa
  alternativas: alternativasSchema,
  resposta: respostaOpcaoSchema,
  explicacao: z.string().min(1), // só aparece pós-resposta
});

const perguntaDissertativaSchema = z.object({
  nivel: z.literal(4),
  pergunta: z.string().min(1),
  dica: z.string().min(1),
  resposta_modelo: z.string().min(1), // gabarito em texto livre, revelado pro aluno se autoavaliar
  explicacao: z.string().min(1),
});

export const generatedPerguntaSchema = z.union([perguntaMultiplaEscolhaSchema, perguntaDissertativaSchema]);

export const generatedConceitoSchema = z.object({
  nome: z.string().min(1),
  tag_foco: z.boolean(),
  perguntas: z
    .array(generatedPerguntaSchema)
    .length(4, "cada conceito precisa de exatamente 4 perguntas (níveis 1, 2, 3 e 4)")
    .refine(
      (perguntas) => new Set(perguntas.map((p) => p.nivel)).size === 4,
      "as 4 perguntas do conceito devem cobrir os níveis 1, 2, 3 e 4 sem repetir"
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
  // Níveis 1-3 (múltipla escolha): preenchidos. Nível 4 (dissertativa): null,
  // com resposta_modelo preenchido no lugar (ver perguntas_gabarito_por_nivel_check).
  alternativas: z.infer<typeof alternativasSchema> | null;
  resposta: z.infer<typeof respostaOpcaoSchema> | null;
  resposta_modelo: string | null;
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
  criado_em: string; // quando o upload foi feito — usado pra ordenar "últimos uploads" (tela de Testes)
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
