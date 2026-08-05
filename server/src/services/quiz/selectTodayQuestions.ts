import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";
import { QuizQuestionsData } from "../../schemas/quizQuestions.schema";

const DEFAULT_LIMIT = 10;

/**
 * "Quiz de hoje" não tem tabela própria — Pergunta é a única fonte da verdade.
 * Aqui só selecionamos um subconjunto (mais próximas da revisão) e transformamos
 * o shape na leitura. Ver documentação para o motivo do mapeamento dica/explicacao.
 */
export async function selectTodayQuestions(userId: string, limit = DEFAULT_LIMIT): Promise<QuizQuestionsData> {
  const { data, error } = await supabase
    .from("perguntas")
    .select(
      `
      id, pergunta, dica, alternativas, resposta,
      conceitos!inner (
        nome,
        sub_temas!inner (
          macro_temas!inner ( user_id )
        )
      )
    `
    )
    .eq("conceitos.sub_temas.macro_temas.user_id", userId)
    .order("proxima_revisao", { ascending: true })
    .limit(limit);

  if (error) {
    throw new HttpError(500, "Falha ao carregar o quiz de hoje.");
  }

  const questoes = (data ?? []).map((row: any) => {
    const alternativas = row.alternativas as Record<"A" | "B" | "C" | "D", string>;

    return {
      id: row.id as string,
      categoria: row.conceitos?.nome ?? "Revisão",
      titulo: row.pergunta as string,
      dica: row.dica as string,
      opcoes: (["A", "B", "C", "D"] as const).map((letra) => ({
        id: letra.toLowerCase(),
        rotulo: alternativas[letra],
      })),
      id_gabarito: (row.resposta as string).toLowerCase(),
    };
  });

  return { questoes };
}
