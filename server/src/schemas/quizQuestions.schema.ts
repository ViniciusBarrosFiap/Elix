// Espelha src/types/quizQuestions.ts do app (com o campo `id` adicional, ver documentação).

export interface QuizOption {
  id: string;
  rotulo: string;
}

export interface QuizQuestion {
  id: string;
  categoria: string;
  titulo: string;
  dica: string;
  opcoes: QuizOption[];
  id_gabarito: string;
  justificativa: string;
}

export interface QuizQuestionsData {
  questoes: QuizQuestion[];
}
