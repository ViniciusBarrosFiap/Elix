import { Request, Response } from "express";
import { HttpError } from "../middlewares/errorHandler";
import { processUpload, processYoutubeLink, processNotionPage } from "../services/materials.service";

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

const YOUTUBE_URL_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i;

// POST /api/materials/youtube — transcrição do vídeo + geração síncrona.
export async function uploadYoutubeMaterial(req: Request, res: Response) {
  const url = (req.body.url as string | undefined)?.trim();
  if (!url || !YOUTUBE_URL_RE.test(url)) {
    throw new HttpError(400, "Informe um link válido do YouTube.");
  }

  const macroTemaId = req.body.macro_tema_id as string | undefined;
  if (!macroTemaId) {
    throw new HttpError(400, "Selecione uma disciplina (macro_tema_id) antes de enviar o vídeo.");
  }

  const tags = parseTags(req.body.tags);

  const result = await processYoutubeLink({
    userId: req.user!.id,
    macroTemaId,
    tags,
    url,
  });

  return res.status(200).json(result);
}

// POST /api/materials/notion — importa uma página do Notion (já conectado
// via OAuth, ver notion.controller.ts) + geração síncrona.
export async function uploadNotionMaterial(req: Request, res: Response) {
  const pageId = (req.body.page_id as string | undefined)?.trim();
  if (!pageId) {
    throw new HttpError(400, "Informe a página do Notion (page_id).");
  }

  const macroTemaId = req.body.macro_tema_id as string | undefined;
  if (!macroTemaId) {
    throw new HttpError(400, "Selecione uma disciplina (macro_tema_id) antes de importar a página.");
  }

  const tags = parseTags(req.body.tags);
  const pageTitle = (req.body.page_title as string | undefined)?.trim() ?? "";

  const result = await processNotionPage({
    userId: req.user!.id,
    macroTemaId,
    tags,
    pageId,
    pageTitle,
  });

  return res.status(200).json(result);
}
