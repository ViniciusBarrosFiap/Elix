import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";
import { QuizQuestionsRepository } from "./quiz.repository";


export const QuizQuestionsService = {
  async initialize() {
    const data =
      await QuizQuestionsRepository.getAll();

    useQuizQuestionsStore
      .getState()
      .setData(data);
  },
};