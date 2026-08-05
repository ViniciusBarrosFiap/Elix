export interface QuizOption {
  id: string;
  rotulo: string;
}

export interface QuizQuestion {
  categoria: string;
  titulo: string;
  dica: string;
  opcoes: QuizOption[];
  id_gabarito: string;
}

export interface QuizQuestionsData {
  questoes: QuizQuestion[];
}