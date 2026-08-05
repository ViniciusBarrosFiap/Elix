import { create } from "zustand";

import {
  QuizQuestion,
  QuizQuestionsData,
} from "@/src/types/quizQuestions";

interface QuizQuestionsStore {
  data: QuizQuestionsData | null;

  setData: (
    data: QuizQuestionsData
  ) => void;

  addQuestion: (
    question: QuizQuestion
  ) => void;
}

export const useQuizQuestionsStore =
  create<QuizQuestionsStore>((set) => ({
    data: null,

    setData: (data) =>
      set((state) => {
        if (state.data === data) {
          return state;
        }

        return { data };
    }),

    addQuestion: (question) =>
      set((state) => ({
        data: state.data
          ? {
              ...state.data,
              questoes: [
                ...state.data.questoes,
                question,
              ],
            }
          : null,
      })),
  }));