/**
 * Paleta única do app — antes cada tela copiava seu próprio objeto de cores
 * (o mesmo `const C = {...}` estava duplicado em quiz/index.tsx e
 * quiz/select.tsx, e studyContent/subtemaVisuals.ts reimplementava os mesmos
 * valores com outros nomes). Import daqui em vez de redeclarar localmente —
 * evita o tipo de drift que já aconteceu (uma tela ganhando uma cor diferente
 * das outras por engano ao ajustar só uma cópia).
 */

// Tokens nomeados em estilo Material 3, usados no fluxo do quiz.
export const colors = {
  surface: "#16111b",
  surfaceContainerLowest: "#110e1b",
  surfaceContainerLow: "#1f1924",
  surfaceContainer: "#231d28",
  surfaceContainerHigh: "#2e2832",
  surfaceContainerHighest: "#39323d",
  primaryContainer: "#8a2be2",
  onPrimaryContainer: "#eed9ff",
  primary: "#dcb8ff",
  onSurface: "#eadfee",
  onSurfaceVariant: "#cfc2d7",
  outlineVariant: "#4c4354",
  secondaryContainer: "#5d3587",
  onSecondaryContainer: "#d2a6ff",
  correct: "#00c896",
} as const;

// Escala de superfície mais escura usada nas telas de disciplina/material
// (studyContent) — propositalmente mais escura que `colors.surface`, não é
// um valor esquecido.
export const surfaceDim = {
  base: "#080510",
  subtema: "#120e1c",
  conceito: "#1a1528",
} as const;

// Cores semânticas usadas fora do fluxo do quiz (status de domínio, urgência
// de revisão). Mantidas separadas de `colors.correct` porque representam um
// significado diferente (nível de domínio de um conceito, não "resposta
// certa nesta pergunta").
export const semantic = {
  danger: "#ff6b6b",
  warning: "#f0a030",
  info: "#60a5fa",
  success: "#22c55e",
  muted: "#a09ba8",
} as const;
