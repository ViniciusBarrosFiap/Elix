import { Request, Response } from "express";
import { listMacroTemas } from "../services/macroTemas.service";

// GET /api/macro-temas — lista enxuta para popular o dropdown de disciplina no upload.
export async function getMacroTemas(req: Request, res: Response) {
  const macroTemas = await listMacroTemas(req.user!.id);
  return res.status(200).json(macroTemas);
}
