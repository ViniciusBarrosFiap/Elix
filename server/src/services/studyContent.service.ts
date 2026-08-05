import { supabase } from "../config/supabase";
import { HttpError } from "../middlewares/errorHandler";
import { MacroTema, StudyContentData } from "../schemas/studyContent.schema";

const NESTED_SELECT = `
  id, nome, emoji, status,
  sub_temas (
    id, nome, status,
    conceitos (
      id, nome, peso_atual, status,
      perguntas (
        id, tipo_cognitivo, pergunta, dica, alternativas, resposta, explicacao,
        dificuldade, peso_atual, proxima_revisao, review_stage, performance
      )
    )
  )
`;

export async function getStudyContent(userId: string): Promise<StudyContentData> {
  const { data, error } = await supabase
    .from("macro_temas")
    .select(NESTED_SELECT)
    .eq("user_id", userId)
    .order("ordem", { ascending: true })
    .order("nome", { referencedTable: "sub_temas", ascending: true })
    .order("nome", { referencedTable: "sub_temas.conceitos", ascending: true });

  if (error) {
    throw new HttpError(500, "Falha ao carregar conteúdo de estudo.");
  }

  const macrotemas: MacroTema[] = (data ?? []).map((macro: any) => {
    const subtemas = (macro.sub_temas ?? []).map((sub: any) => ({
      id: sub.id,
      nome: sub.nome,
      status: sub.status,
      conceitos: (sub.conceitos ?? []).map((conceito: any) => ({
        id: conceito.id,
        nome: conceito.nome,
        peso_atual: conceito.peso_atual,
        status: conceito.status,
        perguntas: (conceito.perguntas ?? []).map((pergunta: any) => ({
          id: pergunta.id,
          tipo_cognitivo: pergunta.tipo_cognitivo,
          pergunta: pergunta.pergunta,
          dica: pergunta.dica,
          alternativas: pergunta.alternativas,
          resposta: pergunta.resposta,
          explicacao: pergunta.explicacao,
          dificuldade: pergunta.dificuldade,
          peso_atual: pergunta.peso_atual,
          proxima_revisao: pergunta.proxima_revisao,
          review_stage: pergunta.review_stage,
          performance: pergunta.performance,
        })),
      })),
    }));

    return {
      id: macro.id,
      nome: macro.nome,
      emoji: macro.emoji,
      status: macro.status,
      subtemas_ativos: subtemas.length, // derivado, nunca armazenado (ver documentação)
      subtemas,
    };
  });

  return { macrotemas };
}
