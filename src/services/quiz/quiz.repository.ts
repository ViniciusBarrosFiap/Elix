import { apiFetch } from "@/src/lib/apiClient";
import { QuizQuestionsData } from "@/src/types/quizQuestions";

export interface SubmitAnswerResult {
  acertou: boolean;
  elixir_ganho: number;
  conceito: {
    id: string;
    nivel_atual: 1 | 2 | 3;
    status: string;
    proxima_revisao: string;
  };
}

export const QuizQuestionsRepository = {
  async getAll(macroTemaId?: string): Promise<QuizQuestionsData> {
    const query = macroTemaId ? `?macro_tema_id=${encodeURIComponent(macroTemaId)}` : "";
    return apiFetch<QuizQuestionsData>(`/api/quiz/today${query}`);
  },

  async submitAnswer(perguntaId: string, resposta: string): Promise<SubmitAnswerResult> {
    return apiFetch<SubmitAnswerResult>("/api/quiz/answer", {
      method: "POST",
      body: { pergunta_id: perguntaId, resposta },
    });
  },
};
