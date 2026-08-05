import { create } from "zustand";

import {
  StudyContentData,
  MacroTema,
} from "@/src/types/studyContent";

interface StudyContentStore {
  data: StudyContentData | null;

  setData: (data: StudyContentData) => void;

  addMacroTema: (
    macroTema: MacroTema
  ) => void;
}

export const useStudyContentStore =
  create<StudyContentStore>((set) => ({
    data: null,

    setData: (data) => set({ data }),

    addMacroTema: (macroTema) =>
      set((state) => ({
        data: state.data
          ? {
              ...state.data,
              macrotemas: [
                ...state.data.macrotemas,
                macroTema,
              ],
            }
          : null,
      })),
  }));