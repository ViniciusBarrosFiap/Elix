import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  deleteConnection,
  getAuthUrl,
  getPageContentHandler,
  getPages,
  getStatus,
  oauthCallback,
} from "../controllers/notion.controller";

export const notionRouter = Router();

// Callback é público — o Notion redireciona pra cá sem nenhum header de
// autenticação, o `state` é quem identifica o usuário (ver notion.controller.ts).
notionRouter.get("/callback", oauthCallback);

notionRouter.get("/auth-url", authMiddleware, getAuthUrl);
notionRouter.get("/status", authMiddleware, getStatus);
notionRouter.delete("/connection", authMiddleware, deleteConnection);
notionRouter.get("/pages", authMiddleware, getPages);
notionRouter.get("/pages/:pageId/content", authMiddleware, getPageContentHandler);
