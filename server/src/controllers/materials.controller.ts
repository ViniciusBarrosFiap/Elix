import { Request, Response } from "express";
import { HttpError } from "../middlewares/errorHandler";
import { processUpload } from "../services/materials.service";

function parseTags(raw: unknown): string[] {
  if (raw === undefined || raw === null || raw === "") return [];

  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t).trim()).filter(Boolean);
    }
  } catch {
    // não era JSON — trata como uma tag única de texto
  }

  return [String(raw).trim()].filter(Boolean);
}

// POST /api/materials — upload + geração síncrona.
export async function uploadMaterial(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    throw new HttpError(400, "Envie um arquivo no campo 'file'.");
  }

  const macroTemaId = req.body.macro_tema_id as string | undefined;
  if (!macroTemaId) {
    throw new HttpError(400, "Selecione uma disciplina (macro_tema_id) antes de enviar o material.");
  }

  const tags = parseTags(req.body.tags);

  const result = await processUpload({
    userId: req.user!.id,
    macroTemaId,
    tags,
    file: {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    },
  });

  return res.status(200).json(result);
}
