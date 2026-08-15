import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";
import { QuizQuestionsRepository } from "./quiz.repository";


export const QuizQuestionsService = {
  async initialize(macroTemaId?: string) {
    const data =
      await QuizQuestionsRepository.getAll(macroTemaId);

    useQuizQuestionsStore
      .getState()
      .setData(data);
  },

  async submitAnswer(perguntaId: string, resposta: string) {
    return QuizQuestionsRepository.submitAnswer(perguntaId, resposta);
  },
};
