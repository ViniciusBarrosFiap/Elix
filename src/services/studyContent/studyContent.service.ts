import { StudyContentRepository } from "./studyContent.repository";

import { useStudyContentStore } from "@/src/store/studyContentStore";

export const StudyContentService = {
  async initialize() {
    const data =
      await StudyContentRepository.getAll();

    useStudyContentStore
      .getState()
      .setData(data);

    return data;
  },

  /**
   * Busca sempre fresca (não usa o store) — o dropdown de disciplina em
   * addContent.tsx precisa da lista atual mesmo logo após o onboarding,
   * antes de qualquer refresh do studyContentStore global.
   */
  async listMacroTemas() {
    return StudyContentRepository.listMacroTemas();
  },
};