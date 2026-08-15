import mammoth from "mammoth";
// pdf-parse não tem types ESM-friendly padrão; import direto da entrada CJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");
import { HttpError } from "../../middlewares/errorHandler";

export type SupportedKind = "pdf" | "docx";

export function detectKind(filename: string, mimeType?: string): SupportedKind {
  const lower = filename.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "docx";
  }

  throw new HttpError(400, "Formato de arquivo não suportado. Envie um PDF ou DOCX.");
}

export async function extractText(buffer: Buffer, kind: SupportedKind): Promise<string> {
  if (kind === "pdf") {
    let result;
    try {
      result = await pdfParse(buffer);
    } catch {
      throw new HttpError(422, "Não foi possível ler este PDF — verifique se o arquivo não está corrompido.");
    }

    const text = (result.text ?? "").trim();
    if (!text) {
      throw new HttpError(422, "Não foi possível extrair texto deste PDF (arquivo vazio ou digitalizado sem OCR).");
    }
    return text;
  }

  let result;
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch {
    throw new HttpError(422, "Não foi possível ler este DOCX — verifique se o arquivo não está corrompido.");
  }

  const text = (result.value ?? "").trim();
  if (!text) {
    throw new HttpError(422, "Não foi possível extrair texto deste DOCX (documento vazio).");
  }
  return text;
}
