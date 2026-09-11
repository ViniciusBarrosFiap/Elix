import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getMacroTemas, patchMacroTema, reorderMacroTemasHandler } from "../controllers/macroTemas.controller";

export const macroTemasRouter = Router();

macroTemasRouter.get("/", deviceAuth, getMacroTemas);
// Precisa vir antes de "/:id" — senão "/reorder" casaria com esse parâmetro.
macroTemasRouter.patch("/reorder", deviceAuth, reorderMacroTemasHandler);
macroTemasRouter.patch("/:id", deviceAuth, patchMacroTema);
