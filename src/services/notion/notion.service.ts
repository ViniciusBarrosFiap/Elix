import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { NotionRepository, NotionPage, NotionStatus } from "./notion.repository";

export type { NotionPage, NotionStatus };

export const NotionService = {
  async getStatus(): Promise<NotionStatus> {
    return NotionRepository.getStatus();
  },

  async getPages(): Promise<NotionPage[]> {
    return NotionRepository.getPages();
  },

  async getPageContent(pageId: string): Promise<string> {
    return NotionRepository.getPageContent(pageId);
  },

  async disconnect(): Promise<void> {
    return NotionRepository.disconnect();
  },

  /**
   * Abre o consentimento do Notion num browser in-app e espera o usuário
   * concluir (ou cancelar). `redirect_uri` é calculado aqui (Linking.createURL)
   * em vez de fixo no backend, porque no Expo Go esse deep link muda a cada
   * sessão de dev (exp://<ip-da-máquina>:<porta>/...) — o backend recebe e
   * devolve exatamente esse valor no final do fluxo (ver oauthState.ts no
   * server), então funciona tanto no Expo Go quanto num build de verdade.
   */
  async connect(): Promise<{ ok: boolean; reason?: string }> {
    const redirectUri = Linking.createURL("notion-connected");
    const authUrl = await NotionRepository.getAuthUrl(redirectUri);

    // preferEphemeralSession (iOS): pede uma sessão privada, sem reaproveitar
    // cookies do Safari — sem isso, o navegador de autenticação sempre volta
    // logado na mesma conta do Notion, mesmo depois de desconectar por aqui
    // (desconectar só apaga o token salvo no nosso banco, não desloga o
    // usuário do notion.com no navegador do aparelho).
    const resultado = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
      preferEphemeralSession: true,
    });

    if (resultado.type !== "success" || !resultado.url) {
      return { ok: false, reason: "cancelado" };
    }

    const { queryParams } = Linking.parse(resultado.url);
    const ok = queryParams?.ok === "true";
    const reason = typeof queryParams?.reason === "string" ? queryParams.reason : undefined;

    return { ok, reason };
  },
};
