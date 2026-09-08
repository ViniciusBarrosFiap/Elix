import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getMacroTemas, patchMacroTema } from "../controllers/macroTemas.controller";

export const macroTemasRouter = Router();

macroTemasRouter.get("/", deviceAuth, getMacroTemas);
macroTemasRouter.patch("/:id", deviceAuth, patchMacroTema);
