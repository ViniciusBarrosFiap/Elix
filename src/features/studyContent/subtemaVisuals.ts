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
import { MaterialTipo, StatusConceito, SubTema } from "@/src/types/studyContent";

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
