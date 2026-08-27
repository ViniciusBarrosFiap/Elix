import { Request, Response } from "express";
import { env } from "../config/env";
import {
  buildAuthorizationUrl,
  completeOAuth,
  disconnect,
  getConnectionStatus,
  listPages,
} from "../services/notion/notion.service";
import { consumirState } from "../services/notion/oauthState";

// GET /api/notion/auth-url — devolve a URL de autorização do Notion pro app
// abrir num browser in-app (ex: expo-web-browser). Autenticado por
// X-Device-Id: o userId fica amarrado ao state gerado aqui.
//
// `redirect_uri` (query, opcional): deep link específico dessa sessão do app
// pra onde o callback deve voltar no final. Necessário no Expo Go, onde o
// deep link muda a cada sessão (exp://<ip>:<porta>/...) — sem isso, cai no
// APP_DEEP_LINK_URL fixo do .env (só funciona em dev build/standalone).
export async function getAuthUrl(req: Request, res: Response) {
  const returnTo = req.query.redirect_uri as string | undefined;
  const url = buildAuthorizationUrl(req.user!.id, returnTo);
  return res.status(200).json({ url });
}

function montarRedirect(destino: string | undefined, params: Record<string, string>): string {
  const url = new URL(destino || env.APP_DEEP_LINK_URL);
  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }
  return url.toString();
}

// GET /api/notion/callback — o Notion redireciona pra cá depois que o
// usuário autoriza (ou cancela) no navegador. É uma rota PÚBLICA (sem
// deviceAuth): o Notion faz um GET puro, sem headers customizados — o
// `state` é o único jeito de saber qual usuário estava conectando (e pra
// onde voltar, ver `returnTo` em oauthState.ts). O expo-web-browser detecta
// esse redirect final e fecha a sessão automaticamente.
export async function oauthCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const erroNotion = req.query.error as string | undefined;

  // Tenta recuperar o returnTo mesmo em caminhos de erro — o Notion costuma
  // devolver o state de volta mesmo quando o usuário cancela o consentimento.
  const consumido = state ? consumirState(state) : null;
  const returnTo = consumido?.returnTo;

  if (erroNotion) {
    return res.redirect(montarRedirect(returnTo, { ok: "false", reason: erroNotion }));
  }

  if (!code || !state) {
    return res.redirect(montarRedirect(returnTo, { ok: "false", reason: "parametros_invalidos" }));
  }

  if (!consumido) {
    return res.redirect(montarRedirect(returnTo, { ok: "false", reason: "state_invalido_ou_expirado" }));
  }

  try {
    await completeOAuth(code, consumido.userId);
  } catch {
    return res.redirect(montarRedirect(returnTo, { ok: "false", reason: "falha_ao_conectar" }));
  }

  return res.redirect(montarRedirect(returnTo, { ok: "true" }));
}

// GET /api/notion/status
export async function getStatus(req: Request, res: Response) {
  const status = await getConnectionStatus(req.user!.id);
  return res.status(200).json(status);
}

// DELETE /api/notion/connection
export async function deleteConnection(req: Request, res: Response) {
  await disconnect(req.user!.id);
  return res.status(204).send();
}

// GET /api/notion/pages
export async function getPages(req: Request, res: Response) {
  const pages = await listPages(req.user!.id);
  return res.status(200).json({ pages });
}
