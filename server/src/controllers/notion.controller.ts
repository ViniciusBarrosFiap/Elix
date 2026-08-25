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
export async function getAuthUrl(req: Request, res: Response) {
  const url = buildAuthorizationUrl(req.user!.id);
  return res.status(200).json({ url });
}

// GET /api/notion/callback — o Notion redireciona pra cá depois que o
// usuário autoriza (ou cancela) no navegador. É uma rota PÚBLICA (sem
// deviceAuth): o Notion faz um GET puro, sem headers customizados — o
// `state` é o único jeito de saber qual usuário estava conectando.
// Termina redirecionando pro deep link do app (elix://notion-connected),
// que o expo-web-browser detecta e fecha a sessão automaticamente.
export async function oauthCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const erroNotion = req.query.error as string | undefined;

  const redirecionarComErro = (motivo: string) =>
    res.redirect(`${env.APP_DEEP_LINK_URL}?ok=false&reason=${encodeURIComponent(motivo)}`);

  if (erroNotion) {
    return redirecionarComErro(erroNotion);
  }

  if (!code || !state) {
    return redirecionarComErro("parametros_invalidos");
  }

  const userId = consumirState(state);
  if (!userId) {
    return redirecionarComErro("state_invalido_ou_expirado");
  }

  try {
    await completeOAuth(code, userId);
  } catch {
    return redirecionarComErro("falha_ao_conectar");
  }

  return res.redirect(`${env.APP_DEEP_LINK_URL}?ok=true`);
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
