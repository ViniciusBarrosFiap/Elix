import { Request, Response } from "express";
import { listMacroTemas, updateMacroTema } from "../services/macroTemas.service";
import { updateMacroTemaSchema } from "../schemas/macroTema.schema";
import { HttpError } from "../middlewares/errorHandler";

// GET /api/macro-temas — lista enxuta para popular o dropdown de disciplina no upload.
export async function getMacroTemas(req: Request, res: Response) {
  const macroTemas = await listMacroTemas(req.user!.id);
  return res.status(200).json(macroTemas);
}

// PATCH /api/macro-temas/:id — renomear e/ou trocar o emoji da disciplina.
export async function patchMacroTema(req: Request, res: Response) {
  const parsed = updateMacroTemaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Payload inválido: " + parsed.error.message);
  }

  const macroTema = await updateMacroTema(req.params.id, req.user!.id, parsed.data);
  return res.status(200).json(macroTema);
}
