import {
  CircleDot,
  Crown,
  Flame,
  FileText,
  NotebookText,
  CirclePlay,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import { Conceito, MaterialTipo, StatusConceito, SubTema } from "@/src/types/studyContent";

// Tokens do design system "The Cognitive Sanctuary" — compartilhados entre a
// tela da disciplina e a tela de material, pra manter as duas com a mesma
// linguagem visual.
export const PRIMARY = "#8a2be2";
export const PRIMARY_LIGHT = "#dcb8ff";
export const ON_PRIMARY_CONTAINER = "#eed9ff";
export const SURFACE_DIM = "#080510";
export const SURFACE_SUBTEMA = "#120e1c"; // fundo do container de cada subtema/material
export const SURFACE_CONCEITO = "#1a1528"; // fundo do card de conceito, um tom acima
export const MUTED = "#a09ba8";

// Quantos subtemas ficam sempre visíveis (sem precisar tocar em nada).
export const MAX_SUBTEMAS_VISIVEIS = 4;

// Cores de status por conceito. Carregam significado próprio (nível de
// domínio), então ficam fora da paleta roxa do tema.
export const STATUS_CONCEITO_COLOR: Record<StatusConceito, string> = {
  novo: "#a09ba8",
  em_reforco: "#f0a030",
  consolidando: "#60a5fa",
  dominado: "#22c55e",
};

// Ícone por status — reforça a leitura de "conquista" (crown pro dominado,
// chama pro que precisa de reforço) em vez de só uma bolinha de cor.
export const STATUS_CONCEITO_ICON: Record<StatusConceito, typeof CircleDot> = {
  novo: CircleDot,
  em_reforco: Flame,
  consolidando: TrendingUp,
  dominado: Crown,
};

// Status "de verdade" do subtema — derivado dos conceitos que ele tem
// (subtema.status vindo da API é estático, nunca muda). Três estados por
// precedência: 100% dominado > ninguém tocou ainda > todo o resto (misto/em
// progresso).
export type SubtemaProgressStatus = "dominado" | "em_reforco" | "iniciando";

export const SUBTEMA_STATUS_LABEL: Record<SubtemaProgressStatus, string> = {
  dominado: "Dominado",
  em_reforco: "Em reforço",
  iniciando: "Iniciando",
};

export const SUBTEMA_STATUS_COLOR: Record<SubtemaProgressStatus, string> = {
  dominado: "#22c55e",
  em_reforco: "#f0a030",
  iniciando: "#60a5fa",
};

export const SUBTEMA_STATUS_ICON: Record<SubtemaProgressStatus, typeof CircleDot> = {
  dominado: Crown,
  em_reforco: Flame,
  iniciando: Sparkles,
};

// Ícone/rótulo por tipo de material.
export const MATERIAL_TIPO_ICON: Record<MaterialTipo, typeof FileText> = {
  documento: FileText,
  youtube: CirclePlay,
  notion: NotebookText,
};

export const MATERIAL_TIPO_LABEL: Record<MaterialTipo, string> = {
  documento: "Documento",
  youtube: "YouTube",
  notion: "Notion",
};

// Quantos conceitos de um subtema têm pelo menos 1 erro registrado.
export function contarConceitosComErro(subtema: SubTema): number {
  return subtema.conceitos.filter((c) => c.performance.erros > 0).length;
}

// Classifica o subtema com base nos conceitos: dominado (100% dominados),
// iniciando (nenhum conceito foi revisado ainda) ou em reforço (o meio-termo
// — já tem prática rolando mas ainda não terminou).
export function classificarSubtema(subtema: SubTema): SubtemaProgressStatus {
  const conceitos = subtema.conceitos;
  const total = conceitos.length;

  if (total === 0) return "iniciando";

  const dominados = conceitos.filter((c) => c.status === "dominado").length;
  const nuncaRevisados = conceitos.filter((c) => c.performance.vezes_revisado === 0).length;

  return dominados === total ? "dominado" : nuncaRevisados === total ? "iniciando" : "em_reforco";
}

// ── Atraso e domínio, calculados no cliente ─────────────────────────────
// Tudo aqui deriva de campos que a API já manda (proxima_revisao, status,
// nivel_atual) — sem precisar de nenhum endpoint novo. Mesma fórmula de data
// usada no backend (ver selectTodayQuestions.ts), pra não divergir.

// Diferença em dias de calendário (UTC) entre hoje e proxima_revisao.
// Positivo = já venceu há N dias; 0 = vence hoje; negativo = ainda faltam N dias.
export function diasParaRevisao(proximaRevisaoISO: string): number {
  const [ano, mes, dia] = proximaRevisaoISO.split("-").map(Number);
  const proximaRevisaoUTC = Date.UTC(ano, mes - 1, dia);
  const hoje = new Date();
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  return Math.round((hojeUTC - proximaRevisaoUTC) / (1000 * 60 * 60 * 24));
}

// Urgência de revisão de um conceito, distinguindo "vence hoje" (ainda dentro
// do prazo) de "atrasado" (o prazo já passou) — antes os dois caíam juntos
// em "vencido", sem diferenciar quem só está pronto pra revisar hoje de quem
// já ficou pra trás. null = nem chegou a data ainda, ou não se aplica (novo
// nunca revisado / já dominado).
export type RevisaoUrgencia = "atrasado" | "hoje" | null;

// Cores únicas de urgência — usadas em toda a tela de disciplina (banner do
// topo, badge do material, tag do subtema, tag do conceito) pra "vencido"
// significar sempre a mesma coisa em vez de cada lugar inventar seu próprio
// laranja/vermelho.
export const COR_ATRASADO = "#ff6b6b";
export const COR_REVISA_HOJE = "#60a5fa";

export function revisaoUrgencia(conceito: Pick<Conceito, "status" | "proxima_revisao">): RevisaoUrgencia {
  if (conceito.status === "dominado" || conceito.status === "novo") return null;

  const dias = diasParaRevisao(conceito.proxima_revisao);
  if (dias > 0) return "atrasado";
  if (dias === 0) return "hoje";
  return null;
}

// Um conceito conta como "vencido" (apareceria na dose de hoje) se já foi
// tocado ao menos uma vez (não é mais "novo"), ainda não foi dominado e a
// data de próxima revisão já chegou (hoje ou antes). Usado nos agregados
// (tamanho da dose, ordenação de materiais) — pra essas contagens, "vence
// hoje" e "atrasado" contam igual, porque os dois entram na mesma dose.
export function conceitoVencido(conceito: Pick<Conceito, "status" | "proxima_revisao">): boolean {
  return revisaoUrgencia(conceito) !== null;
}

// Legenda curta pro estado de revisão de um conceito — usada nos cards.
export function legendaRevisao(conceito: Pick<Conceito, "proxima_revisao">): string {
  const dias = diasParaRevisao(conceito.proxima_revisao);
  if (dias > 0) return `atrasado há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "revisa hoje";
  const faltam = -dias;
  return `revisa em ${faltam} ${faltam === 1 ? "dia" : "dias"}`;
}

// Mesma escala de domínio por nível usada no backend (studyContent.service.ts)
// pra derivar o % de domínio sem esperar o servidor recalcular.
const NIVEL_MASTERY: Record<number, number> = { 1: 0, 2: 33, 3: 67 };

export function conceitoMastery(conceito: Pick<Conceito, "status" | "nivel_atual">): number {
  if (conceito.status === "dominado") return 100;
  return NIVEL_MASTERY[conceito.nivel_atual] ?? 0;
}

export function averageMastery(conceitos: Pick<Conceito, "status" | "nivel_atual">[]): number {
  if (conceitos.length === 0) return 0;
  const soma = conceitos.reduce((acc, c) => acc + conceitoMastery(c), 0);
  return Math.round(soma / conceitos.length);
}

// Mesma fórmula de prioridade da dose diária (selectTodayQuestions.ts no
// backend): erro > atraso > foco > novidade, nessa ordem de peso. Usada tanto
// no carrossel de Insights da Home quanto nos insights por disciplina.
export function calcularPrioridade(
  conceito: Pick<Conceito, "status" | "proxima_revisao" | "tag_foco" | "performance">
): number {
  const diasAtraso = Math.max(0, diasParaRevisao(conceito.proxima_revisao));
  const bonusErro = conceito.performance.erros * 5;
  const bonusAtraso = diasAtraso * 2;
  const bonusFoco = conceito.tag_foco ? 3 : 0;
  const bonusNovo = conceito.performance.vezes_revisado === 0 ? 1 : 0;
  return bonusErro + bonusAtraso + bonusFoco + bonusNovo;
}
