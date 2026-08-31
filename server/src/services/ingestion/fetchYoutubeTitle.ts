/**
 * Busca o título de exibição de um vídeo do YouTube via oEmbed — endpoint
 * público, sem precisar de API key. Retorna null em qualquer falha (vídeo
 * privado/removido, rede fora, resposta inesperada): quem chama decide o
 * fallback (ver processYoutubeLink em materials.service.ts), já que isso é
 * só cosmético — não deve travar o processamento do material.
 */
export async function fetchYoutubeTitle(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;

    const data = (await response.json()) as { title?: unknown };
    return typeof data.title === "string" && data.title.trim() ? data.title.trim() : null;
  } catch {
    return null;
  }
}
