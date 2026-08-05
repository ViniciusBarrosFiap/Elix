import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getStudyContentHandler } from "../controllers/studyContent.controller";

export const studyContentRouter = Router();

studyContentRouter.get("/", deviceAuth, getStudyContentHandler);
