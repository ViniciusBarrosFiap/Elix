import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";
import { QuizQuestionsData } from "../../schemas/quizQuestions.schema";

// Dose diária: no máximo 5 perguntas (documento de MVP §8).
export const DAILY_REVIEW_LIMIT = 5;

interface ConceitoRow {
  id: string;
  nome: string;
  nivel_atual: 1 | 2 | 3;
  tag_foco: boolean;
  proxima_revisao: string;
  performance: { vezes_revisado: number; acertos: number; erros: number };
  perguntas: {
    id: string;
    nivel: 1 | 2 | 3;
    pergunta: string;
    dica: string;
    alternativas: Record<"A" | "B" | "C" | "D", string>;
    resposta: "A" | "B" | "C" | "D";
    explicacao: string;
  }[];
  sub_temas: {
    macro_temas: { nome: string };
  };
}

/**
 * prioridade = erros*5 + dias_atrasado*2 + (tag_foco ? 3 : 0) + (nunca revisado ? 1 : 0)
 * Documento de MVP §9 — prioriza erro, atraso, foco do aluno e novidade, nessa ordem de peso.
 */
function diasDeAtraso(proximaRevisaoISO: string, hoje: Date): number {
  // Comparação por DATA de calendário (UTC), não por timestamp exato — proxima_revisao
  // não tem hora, então "atrasado" não pode depender de que horas são agora.
  const [ano, mes, dia] = proximaRevisaoISO.split("-").map(Number);
  const proximaRevisaoUTC = Date.UTC(ano, mes - 1, dia);
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());

  return Math.max(0, Math.round((hojeUTC - proximaRevisaoUTC) / (1000 * 60 * 60 * 24)));
}

function calculateConceptPriority(conceito: ConceitoRow, hoje: Date): number {
  const diasAtraso = diasDeAtraso(conceito.proxima_revisao, hoje);

  const bonusErro = conceito.performance.erros * 5;
  const bonusAtraso = diasAtraso * 2;
  const bonusFoco = conceito.tag_foco ? 3 : 0;
  const bonusNovo = conceito.performance.vezes_revisado === 0 ? 1 : 0;

  return bonusErro + bonusAtraso + bonusFoco + bonusNovo;
}

/**
 * Monta a dose diária: busca conceitos com revisão vencida (e ainda não dominados),
 * calcula a prioridade de cada um e retorna a pergunta do nível atual dos mais
 * prioritários. Não escolhe perguntas soltas — escolhe conceitos (ver documentação).
 */
export async function selectTodayQuestions(
  userId: string,
  limit = DAILY_REVIEW_LIMIT,
  macroTemaId?: string
): Promise<QuizQuestionsData> {
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);

  let query = supabase
    .from("conceitos")
    .select(
      `
      id, nome, nivel_atual, tag_foco, proxima_revisao, performance,
      perguntas ( id, nivel, pergunta, dica, alternativas, resposta, explicacao ),
      sub_temas!inner (
        macro_temas!inner ( id, nome, user_id, ativo )
      )
    `
    )
    .eq("sub_temas.macro_temas.user_id", userId)
    .eq("sub_temas.macro_temas.ativo", true)
    .neq("status", "dominado")
    .lte("proxima_revisao", hojeISO);

  // Revisão sob demanda de uma disciplina específica (tela de detalhe) — mesma
  // fórmula de prioridade e mesmo teto de 5, só que restrito a essa disciplina.
  if (macroTemaId) {
    query = query.eq("sub_temas.macro_temas.id", macroTemaId);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, "Falha ao carregar o quiz de hoje.");
  }

  const conceitos = (data ?? []) as unknown as ConceitoRow[];

  const priorizados = conceitos
    .map((conceito) => ({
      conceito,
      pergunta: conceito.perguntas.find((p) => p.nivel === conceito.nivel_atual),
    }))
    .filter((item): item is { conceito: ConceitoRow; pergunta: NonNullable<typeof item.pergunta> } =>
      Boolean(item.pergunta)
    )
    .map(({ conceito, pergunta }) => ({
      conceito,
      pergunta,
      prioridade: calculateConceptPriority(conceito, hoje),
    }))
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, limit);

  const questoes = priorizados.map(({ conceito, pergunta }) => {
    const alternativas = pergunta.alternativas;

    return {
      id: pergunta.id,
      categoria: conceito.nome,
      disciplina: conceito.sub_temas.macro_temas.nome,
      titulo: pergunta.pergunta,
      dica: pergunta.dica,
      ja_errou: conceito.performance.erros > 0,
      nivel: pergunta.nivel,
      opcoes: (["A", "B", "C", "D"] as const).map((letra) => ({
        id: letra.toLowerCase(),
        rotulo: alternativas[letra],
      })),
      id_gabarito: pergunta.resposta.toLowerCase(),
      justificativa: pergunta.explicacao,
    };
  });

  return { questoes };
}
