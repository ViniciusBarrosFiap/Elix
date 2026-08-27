import { supabase } from "../../config/supabase";
import { notionClient } from "../../config/notion";
import { env } from "../../config/env";
import { HttpError } from "../../middlewares/errorHandler";
import { criarState } from "./oauthState";

const NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize";

function assertConfigurado() {
  if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET || !env.NOTION_REDIRECT_URI) {
    throw new HttpError(
      501,
      "Integração com o Notion não está configurada neste server (faltam NOTION_CLIENT_ID/SECRET/REDIRECT_URI)."
    );
  }
}

export interface NotionConnectionStatus {
  connected: boolean;
  workspace_name?: string | null;
  workspace_icon?: string | null;
}

export interface NotionPageSummary {
  id: string;
  title: string;
  icon: string | null;
  url: string;
  last_edited_time: string;
}

/**
 * Monta a URL de autorização do Notion, já com o state amarrado a esse
 * usuário. `returnTo`, se informado, é o deep link específico da sessão do
 * app pra onde o callback deve mandar o navegador no final — necessário no
 * Expo Go, onde o deep link muda a cada sessão de dev (exp://<ip>:<porta>/...)
 * e não dá pra fixar um único valor no .env do server.
 */
export function buildAuthorizationUrl(userId: string, returnTo?: string): string {
  assertConfigurado();

  const state = criarState(userId, returnTo);
  const url = new URL(NOTION_AUTHORIZE_URL);
  url.searchParams.set("client_id", env.NOTION_CLIENT_ID!);
  url.searchParams.set("redirect_uri", env.NOTION_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("state", state);

  return url.toString();
}

/**
 * Troca o `code` do callback por um access token e salva a conexão do
 * usuário (identificado via o `state`, ver oauthState.ts). Lança HttpError
 * em qualquer falha — quem chama decide como redirecionar o navegador.
 */
export async function completeOAuth(code: string, userId: string): Promise<void> {
  assertConfigurado();

  const tokenResponse = await notionClient.oauth.token({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.NOTION_REDIRECT_URI!,
    client_id: env.NOTION_CLIENT_ID!,
    client_secret: env.NOTION_CLIENT_SECRET!,
  });

  const { error } = await supabase.from("notion_connections").upsert(
    {
      user_id: userId,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      bot_id: tokenResponse.bot_id,
      workspace_id: tokenResponse.workspace_id,
      workspace_name: tokenResponse.workspace_name,
      workspace_icon: tokenResponse.workspace_icon,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new HttpError(500, "Falha ao salvar a conexão com o Notion.");
  }
}

async function getConnectionRow(userId: string) {
  const { data, error } = await supabase
    .from("notion_connections")
    .select("access_token, workspace_name, workspace_icon")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Falha ao consultar a conexão com o Notion.");
  }

  return data;
}

export async function getConnectionStatus(userId: string): Promise<NotionConnectionStatus> {
  const row = await getConnectionRow(userId);

  if (!row) return { connected: false };

  return {
    connected: true,
    workspace_name: row.workspace_name,
    workspace_icon: row.workspace_icon,
  };
}

export async function disconnect(userId: string): Promise<void> {
  const { error } = await supabase.from("notion_connections").delete().eq("user_id", userId);

  if (error) {
    throw new HttpError(500, "Falha ao desconectar o Notion.");
  }
}

/** Token de acesso do usuário — lança 404 se ele nunca conectou o Notion. */
export async function getAccessToken(userId: string): Promise<string> {
  const row = await getConnectionRow(userId);

  if (!row) {
    throw new HttpError(404, "Conecte sua conta do Notion antes de importar uma página.");
  }

  return row.access_token;
}

function extrairTitulo(page: any): string {
  const propriedades = page.properties ?? {};
  const propriedadeTitulo = Object.values<any>(propriedades).find((p) => p?.type === "title");
  const partes: any[] = propriedadeTitulo?.title ?? [];

  const titulo = partes.map((p) => p.plain_text ?? "").join("").trim();
  return titulo || "Sem título";
}

function extrairIcone(page: any): string | null {
  const icon = page.icon;
  if (!icon) return null;
  if (icon.type === "emoji") return icon.emoji;
  return null; // ícones de arquivo/externo não valem a pena exibir como emoji simples
}

/** Lista as páginas do workspace que o usuário compartilhou com a integração. */
export async function listPages(userId: string): Promise<NotionPageSummary[]> {
  const accessToken = await getAccessToken(userId);

  let resultado;
  try {
    resultado = await notionClient.search({
      auth: accessToken,
      filter: { property: "object", value: "page" },
      sort: { timestamp: "last_edited_time", direction: "descending" },
      page_size: 50,
    });
  } catch {
    throw new HttpError(502, "Não foi possível listar suas páginas do Notion agora.");
  }

  return resultado.results
    .filter((item: any) => item.object === "page")
    .map((page: any) => ({
      id: page.id,
      title: extrairTitulo(page),
      icon: extrairIcone(page),
      url: page.url,
      last_edited_time: page.last_edited_time,
    }));
}
