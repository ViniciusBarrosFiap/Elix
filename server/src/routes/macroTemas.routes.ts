import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getMacroTemas, patchMacroTema, reorderMacroTemasHandler } from "../controllers/macroTemas.controller";

export const macroTemasRouter = Router();

macroTemasRouter.get("/", authMiddleware, getMacroTemas);
// Precisa vir antes de "/:id" — senão "/reorder" casaria com esse parâmetro.
macroTemasRouter.patch("/reorder", authMiddleware, reorderMacroTemasHandler);
macroTemasRouter.patch("/:id", authMiddleware, patchMacroTema);
