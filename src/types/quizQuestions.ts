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
  // Nível 4 (dissertativa): opcoes vazio, id_gabarito null — o aluno escreve a
  // resposta com as próprias palavras e se autoavalia contra resposta_modelo.
  opcoes: QuizOption[];
  id_gabarito: string | null;
  resposta_modelo: string | null;
  justificativa: string;
}

export interface QuizQuestionsData {
  questoes: QuizQuestion[];
}