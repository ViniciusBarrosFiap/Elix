import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";

interface SubmitAnswerInput {
  userId: string;
  perguntaId: string;
  // Níveis 1-3 (múltipla escolha): respostaEscolhida. Nível 4 (dissertativa,
  // sem gabarito A-D pra comparar): autoavaliacao, o próprio aluno reportando
  // se acertou depois de comparar sua resposta com a resposta_modelo.
  respostaEscolhida?: "A" | "B" | "C" | "D";
  autoavaliacao?: "acertou" | "errou";
}

interface SubmitAnswerResult {
  acertou: boolean;
  elixir_ganho: number;
  conceito: {
    id: string;
    nivel_atual: 1 | 2 | 3 | 4;
    status: string;
    proxima_revisao: string;
  };
}

function addDaysISO(base: Date, dias: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

const ELIXIR_POR_NIVEL: Record<1 | 2 | 3 | 4, number> = { 1: 30, 2: 50, 3: 100, 4: 150 };
const ELIXIR_ERRO = 10;

// Intervalo de revisão pós-domínio: começa em 7 dias e DOBRA a cada acerto
// seguinte (7 -> 14 -> 28 -> 56 -> 90, onde trava) — é o que faz "dominado"
// significar "revisado com intervalo cada vez maior", não "nunca mais
// testado". Ver conceitos.intervalo_dominado (011_dominado_revisao_continua.sql).
const INTERVALO_DOMINADO_INICIAL = 7;
const INTERVALO_DOMINADO_TETO = 90;

/** Recompensa em elixir: acerto escala com o nível da pergunta (mais difícil, mais
 *  elixir); erro sempre rende um consolo fixo, pra manter o engajamento mesmo
 *  quando o aluno erra. */
function calcularElixir(nivel: 1 | 2 | 3 | 4, acertou: boolean): number {
  return acertou ? ELIXIR_POR_NIVEL[nivel] : ELIXIR_ERRO;
}

/**
 * updateConceptAfterAnswer (documento de MVP §7): o estado vive no conceito, não
 * na pergunta.
 * - Acertou, ainda não dominado -> sobe nível e agenda +3d (ou vira "dominado"
 *   com +7d se acabou de acertar o nível 4, a dissertativa).
 * - Acertou, já dominado -> continua dominado e o intervalo DOBRA (até um teto
 *   de 90d) — revisão de verdade em intervalo crescente, não "some para sempre".
 * - Errou, não estava dominado -> mantém nível e agenda +1d.
 * - Errou, estava dominado -> "lapso": volta pra em_reforco com +1d e reseta
 *   o intervalo, igual o Anki trata esquecer algo que já tinha sido aprendido.
 */
export async function submitAnswer({
  userId,
  perguntaId,
  respostaEscolhida,
  autoavaliacao,
}: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const { data: pergunta, error: perguntaError } = await supabase
    .from("perguntas")
    .select(
      `
      id, resposta, nivel,
      conceitos!inner (
        id, nivel_atual, status, performance, intervalo_dominado,
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

  // Nível 4 não tem `resposta` (gabarito A-D) pra comparar — confia na
  // autoavaliação do aluno em vez de comparar contra o banco.
  if (pergunta.nivel === 4) {
    if (!autoavaliacao) {
      throw new HttpError(400, "Envie autoavaliacao (acertou ou errou) para perguntas dissertativas.");
    }
  } else if (!respostaEscolhida) {
    throw new HttpError(400, "Envie respostaEscolhida (A, B, C ou D).");
  }

  const acertou = pergunta.nivel === 4 ? autoavaliacao === "acertou" : respostaEscolhida === pergunta.resposta;
  const elixirGanho = calcularElixir(pergunta.nivel, acertou);
  const performanceAtual = conceito.performance ?? { vezes_revisado: 0, acertos: 0, erros: 0 };
  const novaPerformance = {
    vezes_revisado: performanceAtual.vezes_revisado + 1,
    acertos: performanceAtual.acertos + (acertou ? 1 : 0),
    erros: performanceAtual.erros + (acertou ? 0 : 1),
  };

  const hoje = new Date();
  let novoNivel: 1 | 2 | 3 | 4 = conceito.nivel_atual;
  let novoStatus: string;
  let proximaRevisao: string;
  let novoIntervaloDominado: number | null = conceito.intervalo_dominado ?? null;

  if (acertou) {
    if (conceito.status === "dominado") {
      // Já estava dominado e acertou de novo: dobra o intervalo em vez de
      // repetir sempre os mesmos 7 dias — é o que faz virar "espaçado" de
      // verdade em vez de "testa uma vez e some para sempre".
      novoIntervaloDominado = Math.min(
        (conceito.intervalo_dominado ?? INTERVALO_DOMINADO_INICIAL) * 2,
        INTERVALO_DOMINADO_TETO
      );
      novoStatus = "dominado";
      proximaRevisao = addDaysISO(hoje, novoIntervaloDominado);
    } else if (conceito.nivel_atual >= 4) {
      // Primeira vez acertando o nível 4 — passa a "dominado" agora.
      novoIntervaloDominado = INTERVALO_DOMINADO_INICIAL;
      novoStatus = "dominado";
      proximaRevisao = addDaysISO(hoje, novoIntervaloDominado);
    } else {
      novoNivel = (conceito.nivel_atual + 1) as 1 | 2 | 3 | 4;
      novoStatus = "em_reforco";
      proximaRevisao = addDaysISO(hoje, 3);
    }
  } else if (conceito.status === "dominado") {
    // Esqueceu um conceito que já tinha dominado — "lapso" (mesmo termo do
    // Anki): volta pra reforço com intervalo curto, em vez de continuar
    // marcado como dominado sem ninguém perceber que ele já não sabe mais.
    novoStatus = "em_reforco";
    novoIntervaloDominado = null;
    proximaRevisao = addDaysISO(hoje, 1);
  } else {
    novoStatus = "em_reforco";
    proximaRevisao = addDaysISO(hoje, 1);
  }

  const { error: updateError } = await supabase
    .from("conceitos")
    .update({
      nivel_atual: novoNivel,
      status: novoStatus,
      proxima_revisao: proximaRevisao,
      performance: novaPerformance,
      intervalo_dominado: novoIntervaloDominado,
    })
    .eq("id", conceito.id);

  if (updateError) {
    throw new HttpError(500, "Falha ao atualizar o progresso do conceito.");
  }

  // Elixir (ver calcularElixir) e streak (dias consecutivos com pelo menos 1
  // resposta, acertando ou errando — mede hábito de revisar, não desempenho).
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
        pontuacao: (userRow.pontuacao ?? 0) + elixirGanho,
        streak: novoStreak,
        last_review_date: hojeISO,
      })
      .eq("id", userId);
  }

  return {
    acertou,
    elixir_ganho: elixirGanho,
    conceito: {
      id: conceito.id,
      nivel_atual: novoNivel,
      status: novoStatus,
      proxima_revisao: proximaRevisao,
    },
  };
}
