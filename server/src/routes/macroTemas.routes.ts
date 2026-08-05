import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getMacroTemas } from "../controllers/macroTemas.controller";

export const macroTemasRouter = Router();

macroTemasRouter.get("/", deviceAuth, getMacroTemas);
