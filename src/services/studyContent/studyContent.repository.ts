import { apiFetch } from "@/src/lib/apiClient";
import { StudyContentData } from "@/src/types/studyContent";

export interface MacroTemaListItem {
  id: string;
  nome: string;
  emoji: string;
  status: string;
}

export const StudyContentRepository = {
  async getAll(): Promise<StudyContentData> {
    return apiFetch<StudyContentData>("/api/study-content");
  },

  /** Lista enxuta de macrotemas (= disciplinas do usuário) para o dropdown de upload. */
  async listMacroTemas(): Promise<MacroTemaListItem[]> {
    return apiFetch<MacroTemaListItem[]>("/api/macro-temas");
  },
};
