import { notionClient } from "../../config/notion";
import { HttpError } from "../../middlewares/errorHandler";

/**
 * Baixa o conteúdo de uma página do Notion já em markdown (endpoint nativo
 * da API — sem precisar percorrer a árvore de blocos manualmente) e devolve
 * como texto corrido, mesmo formato de entrada que extractText() e
 * fetchYoutubeTranscript() produzem, pra alimentar generateStudyContent()
 * sem nenhuma mudança lá.
 */
export async function fetchNotionPageText(accessToken: string, pageId: string): Promise<string> {
  let resposta;
  try {
    resposta = await notionClient.pages.retrieveMarkdown({
      auth: accessToken,
      page_id: pageId,
    });
  } catch {
    throw new HttpError(
      422,
      "Não foi possível ler essa página do Notion. Verifique se ela ainda está compartilhada com a integração."
    );
  }

  const texto = (resposta.markdown ?? "").trim();

  if (!texto) {
    throw new HttpError(422, "Essa página do Notion está vazia.");
  }

  return texto;
}
