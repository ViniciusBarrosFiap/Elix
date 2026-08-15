import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";

interface SubmitAnswerInput {
  userId: string;
  perguntaId: string;
  respostaEscolhida: "A" | "B" | "C" | "D";
}

interface SubmitAnswerResult {
  acertou: boolean;
  conceito: {
    id: string;
    nivel_atual: 1 | 2 | 3;
    status: string;
    proxima_revisao: string;
  };
}

function addDaysISO(base: Date, dias: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * updateConceptAfterAnswer (documento de MVP §7): o estado vive no conceito, não
 * na pergunta. Acertou -> sobe nível e agenda +3d (ou vira "dominado" com +7d se
 * já estava no nível 3). Errou -> mantém nível e agenda +1d.
 */
export async function submitAnswer({
  userId,
  perguntaId,
  respostaEscolhida,
}: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const { data: pergunta, error: perguntaError } = await supabase
    .from("perguntas")
    .select(
      `
      id, resposta,
      conceitos!inner (
        id, nivel_atual, status, performance,
        sub_temas!inner ( macro_temas!inner ( user_id ) )
      )
    `
    )
    .eq("id", perguntaId)
    .single();

  if (perguntaError || !pergunta) {
    throw new HttpError(404, "Pergunta não encontrada.");
  }

  const conceito = (pergunta as any).conceitos;
  const donoUserId = conceito?.sub_temas?.macro_temas?.user_id;
  if (!conceito || donoUserId !== userId) {
    throw new HttpError(404, "Pergunta não encontrada.");
  }

  const acertou = respostaEscolhida === pergunta.resposta;
  const performanceAtual = conceito.performance ?? { vezes_revisado: 0, acertos: 0, erros: 0 };
  const novaPerformance = {
    vezes_revisado: performanceAtual.vezes_revisado + 1,
    acertos: performanceAtual.acertos + (acertou ? 1 : 0),
    erros: performanceAtual.erros + (acertou ? 0 : 1),
  };

  const hoje = new Date();
  let novoNivel: 1 | 2 | 3 = conceito.nivel_atual;
  let novoStatus: string;
  let proximaRevisao: string;

  if (acertou) {
    if (conceito.nivel_atual >= 3) {
      novoStatus = "dominado";
      proximaRevisao = addDaysISO(hoje, 7);
    } else {
      novoNivel = (conceito.nivel_atual + 1) as 1 | 2 | 3;
      novoStatus = "em_reforco";
      proximaRevisao = addDaysISO(hoje, 3);
    }
  } else {
    novoStatus = conceito.status === "dominado" ? "dominado" : "em_reforco";
    proximaRevisao = addDaysISO(hoje, 1);
  }

  const { error: updateError } = await supabase
    .from("conceitos")
    .update({
      nivel_atual: novoNivel,
      status: novoStatus,
      proxima_revisao: proximaRevisao,
      performance: novaPerformance,
    })
    .eq("id", conceito.id);

  if (updateError) {
    throw new HttpError(500, "Falha ao atualizar o progresso do conceito.");
  }

  // Elixir (+1 por acerto) e streak (dias consecutivos com pelo menos 1 resposta,
  // acertando ou errando — mede hábito de revisar, não desempenho).
  const { data: userRow } = await supabase
    .from("users")
    .select("pontuacao, streak, last_review_date")
    .eq("id", userId)
    .single();

  if (userRow) {
    const hojeISO = hoje.toISOString().slice(0, 10);
    const ontemISO = addDaysISO(hoje, -1);

    let novoStreak = userRow.streak ?? 0;
    if (userRow.last_review_date === hojeISO) {
      // já registrou revisão hoje — streak não muda de novo.
    } else if (userRow.last_review_date === ontemISO) {
      novoStreak += 1;
    } else {
      novoStreak = 1; // primeira revisão, ou quebrou a sequência (gap > 1 dia)
    }

    await supabase
      .from("users")
      .update({
        pontuacao: (userRow.pontuacao ?? 0) + (acertou ? 1 : 0),
        streak: novoStreak,
        last_review_date: hojeISO,
      })
      .eq("id", userId);
  }

  return {
    acertou,
    conceito: {
      id: conceito.id,
      nivel_atual: novoNivel,
      status: novoStatus,
      proxima_revisao: proximaRevisao,
    },
  };
}
