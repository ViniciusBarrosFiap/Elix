import { StudyContentRepository } from "./studyContent.repository";

import { useStudyContentStore } from "@/src/store/studyContentStore";
import { isDevTestModeAtivo } from "@/src/dev/devTestMode";

export const StudyContentService = {
  async initialize() {
    // Modo Teste (ver app/(tabs)/(profile)/testes.tsx) injeta os dados
    // diretamente no store — pular a chamada real evita que ela sobrescreva
    // o mock assim que a tela ganha foco de novo.
    if (isDevTestModeAtivo()) return useStudyContentStore.getState().data ?? { macrotemas: [] };

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