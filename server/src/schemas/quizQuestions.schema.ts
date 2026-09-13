// Espelha src/types/quizQuestions.ts do app (com o campo `id` adicional, ver documentação).

export interface QuizOption {
  id: string;
  rotulo: string;
}

export interface QuizQuestion {
  id: string;
  categoria: string;
  disciplina: string;
  titulo: string;
  dica: string;
  ja_errou: boolean;
  nivel: 1 | 2 | 3 | 4;
  // Níveis 1-3 (múltipla escolha): opcoes/id_gabarito preenchidos, resposta_modelo null.
  // Nível 4 (dissertativa): opcoes vazio, id_gabarito null, resposta_modelo preenchido —
  // o aluno se autoavalia contra ela em vez de escolher uma alternativa.
  opcoes: QuizOption[];
  id_gabarito: string | null;
  resposta_modelo: string | null;
  justificativa: string;
}

export interface QuizQuestionsData {
  questoes: QuizQuestion[];
}
