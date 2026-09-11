import { apiFetch } from "@/src/lib/apiClient";

export interface UpdateMacroTemaInput {
  nome?: string;
  emoji?: string;
}

export interface MacroTemaSummary {
  id: string;
  nome: string;
  emoji: string;
  status: string;
}

export const MacroTemasRepository = {
  async update(id: string, updates: UpdateMacroTemaInput): Promise<MacroTemaSummary> {
    return apiFetch<MacroTemaSummary>(`/api/macro-temas/${id}`, {
      method: "PATCH",
      body: updates,
    });
  },

  async reorder(orderedIds: string[]): Promise<MacroTemaSummary[]> {
    return apiFetch<MacroTemaSummary[]>(`/api/macro-temas/reorder`, {
      method: "PATCH",
      body: { ordered_ids: orderedIds },
    });
  },
};
