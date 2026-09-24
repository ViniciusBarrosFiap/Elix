import { z } from "zod";

export const updateMacroTemaSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome não pode ficar vazio.").max(120).optional(),
    emoji: z.string().trim().min(1, "Escolha um emoji.").max(8).optional(),
    // null = voltar pra cor padrão (roxo).
    cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.").nullable().optional(),
  })
  .refine((data) => data.nome !== undefined || data.emoji !== undefined || data.cor !== undefined, {
    message: "Envie nome, emoji e/ou cor pra atualizar.",
  });

export type UpdateMacroTemaInput = z.infer<typeof updateMacroTemaSchema>;

// Reordenar (arrastar card em "Todos os conteúdos"): a lista completa de ids
// na nova ordem desejada — cada posição no array vira o novo valor de `ordem`.
export const reorderMacroTemasSchema = z.object({
  ordered_ids: z.array(z.string().min(1)).min(1),
});

export type ReorderMacroTemasInput = z.infer<typeof reorderMacroTemasSchema>;
