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

  // `resposta` (A-D) é pra perguntas de múltipla escolha (nível 1-3);
  // `autoavaliacao` é pra dissertativas (nível 4, sem gabarito A-D) — o
  // aluno reporta se acertou depois de comparar com a resposta_modelo.
  async submitAnswer(perguntaId: string, resposta?: string, autoavaliacao?: "acertou" | "errou") {
    return QuizQuestionsRepository.submitAnswer(perguntaId, resposta, autoavaliacao);
  },
};
