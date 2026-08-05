import { z } from "zod";

// Espelha src/types/userData.ts do app.

export const userDataSchema = z.object({
  user_id: z.string(),
  nome: z.string(),
  primeiroAcesso: z.boolean(),
  curso: z.string(),
  disciplinas: z.array(z.string()),
  semestre: z.number(),
  fezUpload: z.boolean(),
  pontuacao: z.number(),
  streak: z.number(),
});

export type UserData = z.infer<typeof userDataSchema>;

// Payload aceito por PATCH /api/users/me — todos os campos opcionais.
export const updateUserSchema = z.object({
  nome: z.string().min(1).optional(),
  curso: z.string().optional(),
  semestre: z.number().int().min(0).max(20).optional(),
  disciplinas: z.array(z.string().min(1)).optional(),
  primeiroAcesso: z.boolean().optional(),
  fezUpload: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
