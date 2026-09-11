import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { MacroTemasRepository, UpdateMacroTemaInput } from "./macroTemas.repository";

export const MacroTemasService = {
  async update(id: string, updates: UpdateMacroTemaInput) {
    const result = await MacroTemasRepository.update(id, updates);
    // Refaz o fetch da árvore inteira em vez de só corrigir a store local —
    // o mesmo padrão já usado depois de salvar em "Editar disciplinas".
    await StudyContentService.initialize();
    return result;
  },

  async reorder(orderedIds: string[]) {
    const result = await MacroTemasRepository.reorder(orderedIds);
    // Mesmo padrão do update(): a store de "Todos os conteúdos" vem do
    // /api/study-content (com subtemas/progresso), não do /api/macro-temas
    // enxuto que essa chamada usa — refaz o fetch pra refletir a nova ordem.
    await StudyContentService.initialize();
    return result;
  },
};
