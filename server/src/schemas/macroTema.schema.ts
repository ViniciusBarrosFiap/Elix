import { z } from "zod";

export const updateMacroTemaSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome não pode ficar vazio.").max(120).optional(),
    emoji: z.string().trim().min(1, "Escolha um emoji.").max(8).optional(),
  })
  .refine((data) => data.nome !== undefined || data.emoji !== undefined, {
    message: "Envie nome e/ou emoji pra atualizar.",
  });

export type UpdateMacroTemaInput = z.infer<typeof updateMacroTemaSchema>;
