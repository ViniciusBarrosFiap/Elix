import { supabase } from "../config/supabase";
import { HttpError } from "../middlewares/errorHandler";
import { Conceito, MacroTema, StudyContentData } from "../schemas/studyContent.schema";

const NESTED_SELECT = `
  id, nome, emoji,
  sub_temas (
    id, nome,
    conceitos (
      id, nome, status, nivel_atual, tag_foco, proxima_revisao, performance,
      perguntas (
        id, nivel, tipo, pergunta, dica, alternativas, resposta, explicacao
      )
    )
  )
`;

// status_dominio (comecando/em_reforco/consolidando) de macro_tema e sub_tema
// não é mais uma coluna confiável — nada escreve nela depois da criação, então
// ficaria travada em "comecando" pra sempre. Em vez disso, é derivada aqui a
// partir do domínio real dos conceitos (mesma lógica de "subtemas_ativos": nunca
// armazenada, sempre recalculada na leitura).
const NIVEL_MASTERY: Record<number, number> = { 1: 0, 2: 33, 3: 67 };

function conceitoMastery(conceito: Pick<Conceito, "status" | "nivel_atual">): number {
  if (conceito.status === "dominado") return 100;
  return NIVEL_MASTERY[conceito.nivel_atual] ?? 0;
}

function averageMastery(conceitos: Pick<Conceito, "status" | "nivel_atual">[]): number {
  if (conceitos.length === 0) return 0;
  const soma = conceitos.reduce((acc, c) => acc + conceitoMastery(c), 0);
  return Math.round(soma / conceitos.length);
}

function statusFromMastery(mastery: number): "comecando" | "em_reforco" | "consolidando" {
  if (mastery >= 80) return "consolidando";
  if (mastery >= 34) return "em_reforco";
  return "comecando";
}

export async function getStudyContent(userId: string): Promise<StudyContentData> {
  const { data, error } = await supabase
    .from("macro_temas")
    .select(NESTED_SELECT)
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("nome", { referencedTable: "sub_temas", ascending: true })
    .order("nome", { referencedTable: "sub_temas.conceitos", ascending: true });

  if (error) {
    throw new HttpError(500, "Falha ao carregar conteúdo de estudo.");
  }

  const macrotemas: MacroTema[] = (data ?? []).map((macro: any) => {
    const subtemas = (macro.sub_temas ?? []).map((sub: any) => {
      const conceitos: Conceito[] = (sub.conceitos ?? []).map((conceito: any) => ({
        id: conceito.id,
        nome: conceito.nome,
        status: conceito.status,
        nivel_atual: conceito.nivel_atual,
        tag_foco: conceito.tag_foco,
        proxima_revisao: conceito.proxima_revisao,
        performance: conceito.performance,
        perguntas: (conceito.perguntas ?? []).map((pergunta: any) => ({
          id: pergunta.id,
          nivel: pergunta.nivel,
          tipo: pergunta.tipo,
          pergunta: pergunta.pergunta,
          dica: pergunta.dica,
          alternativas: pergunta.alternativas,
          resposta: pergunta.resposta,
          explicacao: pergunta.explicacao,
        })),
      }));

      return {
        id: sub.id,
        nome: sub.nome,
        status: statusFromMastery(averageMastery(conceitos)),
        conceitos,
      };
    });

    const todosConceitos = subtemas.flatMap((sub: { conceitos: Conceito[] }) => sub.conceitos);
    const progresso = averageMastery(todosConceitos);

    return {
      id: macro.id,
      nome: macro.nome,
      emoji: macro.emoji,
      status: statusFromMastery(progresso),
      progresso,
      subtemas_ativos: subtemas.length, // derivado, nunca armazenado (ver documentação)
      subtemas,
    };
  });

  return { macrotemas };
}
