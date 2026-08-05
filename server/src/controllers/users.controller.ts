import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { AuthedUserRow } from "../middlewares/deviceAuth";
import { updateUserSchema } from "../schemas/userData.schema";
import { syncMacroTemasFromDisciplinas } from "../services/macroTemas.service";
import { HttpError } from "../middlewares/errorHandler";

function toUserData(row: AuthedUserRow) {
  return {
    user_id: row.id,
    nome: row.nome,
    primeiroAcesso: row.primeiro_acesso,
    curso: row.curso ?? "",
    disciplinas: row.disciplinas ?? [],
    semestre: row.semestre ?? 0,
    fezUpload: row.fez_upload,
    pontuacao: row.pontuacao,
    streak: row.streak,
  };
}

// POST /api/users/identify — deviceAuth já resolveu/criou o usuário; só devolve.
export async function identify(req: Request, res: Response) {
  return res.status(200).json(toUserData(req.user!));
}

// GET /api/users/me
export async function getMe(req: Request, res: Response) {
  return res.status(200).json(toUserData(req.user!));
}

// PATCH /api/users/me
export async function updateMe(req: Request, res: Response) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Payload inválido: " + parsed.error.message);
  }

  const updates = parsed.data;
  const userId = req.user!.id;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
  if (updates.curso !== undefined) dbUpdates.curso = updates.curso;
  if (updates.semestre !== undefined) dbUpdates.semestre = updates.semestre;
  if (updates.disciplinas !== undefined) dbUpdates.disciplinas = updates.disciplinas;
  if (updates.primeiroAcesso !== undefined) dbUpdates.primeiro_acesso = updates.primeiroAcesso;
  if (updates.fezUpload !== undefined) dbUpdates.fez_upload = updates.fezUpload;

  if (Object.keys(dbUpdates).length > 0) {
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("users").update(dbUpdates).eq("id", userId);
    if (error) {
      throw new HttpError(500, "Falha ao atualizar usuário.");
    }
  }

  if (updates.disciplinas !== undefined) {
    await syncMacroTemasFromDisciplinas(userId, updates.disciplinas);
  }

  const { data: fresh, error: refetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (refetchError || !fresh) {
    throw new HttpError(500, "Falha ao carregar usuário atualizado.");
  }

  return res.status(200).json(toUserData(fresh as AuthedUserRow));
}
