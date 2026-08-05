import { apiFetch } from "@/src/lib/apiClient";
import { QuizQuestionsData } from "@/src/types/quizQuestions";

export const QuizQuestionsRepository = {
  async getAll(): Promise<QuizQuestionsData> {
    return apiFetch<QuizQuestionsData>("/api/quiz/today");
  },
};
