import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import {
  deleteConnection,
  getAuthUrl,
  getPages,
  getStatus,
  oauthCallback,
} from "../controllers/notion.controller";

export const notionRouter = Router();

// Callback é público — o Notion redireciona pra cá sem nenhum header de
// autenticação, o `state` é quem identifica o usuário (ver notion.controller.ts).
notionRouter.get("/callback", oauthCallback);

notionRouter.get("/auth-url", deviceAuth, getAuthUrl);
notionRouter.get("/status", deviceAuth, getStatus);
notionRouter.delete("/connection", deviceAuth, deleteConnection);
notionRouter.get("/pages", deviceAuth, getPages);
