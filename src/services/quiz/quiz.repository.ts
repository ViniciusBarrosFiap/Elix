import quizQuestionsMock from "@/src/mocks/quizQuestions.json";

import { QuizQuestionsData } from "@/src/types/quizQuestions";

export const QuizQuestionsRepository = {
  async getAll(): Promise<QuizQuestionsData> {
    return quizQuestionsMock as QuizQuestionsData;
  },
};