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
  nivel: 1 | 2 | 3;
  opcoes: QuizOption[];
  id_gabarito: string;
  justificativa: string;
}

export interface QuizQuestionsData {
  questoes: QuizQuestion[];
}