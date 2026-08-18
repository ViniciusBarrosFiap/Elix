import { YoutubeTranscript } from "youtube-transcript";
import { HttpError } from "../../middlewares/errorHandler";

/**
 * Baixa a transcrição pública de um vídeo do YouTube e junta as linhas num
 * texto corrido — mesmo formato de entrada que extractText() produz para
 * PDF/DOCX, então alimenta generateStudyContent() sem nenhuma mudança lá.
 */
export async function fetchYoutubeTranscript(url: string): Promise<string> {
  let linhas;
  try {
    linhas = await YoutubeTranscript.fetchTranscript(url);
  } catch {
    throw new HttpError(
      422,
      "Não foi possível obter a transcrição desse vídeo. Verifique o link ou tente um vídeo com legendas disponíveis."
    );
  }

  const texto = linhas
    .map((linha) => linha.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!texto) {
    throw new HttpError(422, "Este vídeo não tem transcrição disponível.");
  }

  return texto;
}
