import { Request, Response } from "express";
import { listMacroTemas, reorderMacroTemas, updateMacroTema } from "../services/macroTemas.service";
import { reorderMacroTemasSchema, updateMacroTemaSchema } from "../schemas/macroTema.schema";
import { HttpError } from "../middlewares/errorHandler";

// GET /api/macro-temas — lista enxuta para popular o dropdown de disciplina no upload.
export async function getMacroTemas(req: Request, res: Response) {
  const macroTemas = await listMacroTemas(req.user!.id);
  return res.status(200).json(macroTemas);
}

// PATCH /api/macro-temas/reorder — nova ordem dos cards em "Todos os
// conteúdos" (arrastar e soltar). Rota registrada ANTES de "/:id" nas routes
// (senão o Express casaria "reorder" como se fosse o :id).
export async function reorderMacroTemasHandler(req: Request, res: Response) {
  const parsed = reorderMacroTemasSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Payload inválido: " + parsed.error.message);
  }

  await reorderMacroTemas(req.user!.id, parsed.data.ordered_ids);
  const macroTemas = await listMacroTemas(req.user!.id);
  return res.status(200).json(macroTemas);
}

// PATCH /api/macro-temas/:id — renomear e/ou trocar o emoji/cor da disciplina.
export async function patchMacroTema(req: Request, res: Response) {
  const parsed = updateMacroTemaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Payload inválido: " + parsed.error.message);
  }

  const macroTema = await updateMacroTema(req.params.id, req.user!.id, parsed.data);
  return res.status(200).json(macroTema);
}
