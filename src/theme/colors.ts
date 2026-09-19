/**
 * Paleta única do app — os valores de verdade estão em ./colors.json (fonte
 * única lida tanto por aqui quanto por tailwind.config.js na raiz do
 * projeto, via `require` direto, já que o Tailwind config roda em Node puro
 * e não importa .ts). Mudou uma cor? Só precisa editar o .json — os dois
 * lugares pegam o valor novo (o `className="bg-primaryContainer"` do
 * NativeWind pode precisar de `npx expo start -c` pra recompilar; o
 * `style={{ color: colors.primaryContainer }}` direto em JS recarrega na hora).
 *
 * Antes disso, cada tela copiava seu próprio objeto de cores (o mesmo
 * `const C = {...}` estava duplicado em quiz/index.tsx e quiz/select.tsx, e
 * studyContent/subtemaVisuals.ts reimplementava os mesmos valores com outros
 * nomes) — import daqui em vez de redeclarar localmente.
 */
import paleta from "./colors.json";

// Tokens nomeados em estilo Material 3, usados no fluxo do quiz.
export const colors: Record<keyof typeof paleta.colors, string> = paleta.colors;

// Escala de superfície mais escura usada nas telas de disciplina/material
// (studyContent) — propositalmente mais escura que `colors.surface`, não é
// um valor esquecido.
export const surfaceDim: Record<keyof typeof paleta.surfaceDim, string> = paleta.surfaceDim;

// Cores semânticas usadas fora do fluxo do quiz (status de domínio, urgência
// de revisão). Mantidas separadas de `colors.correct` porque representam um
// significado diferente (nível de domínio de um conceito, não "resposta
// certa nesta pergunta").
export const semantic: Record<keyof typeof paleta.semantic, string> = paleta.semantic;
