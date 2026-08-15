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