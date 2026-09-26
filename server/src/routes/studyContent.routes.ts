import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getStudyContentHandler } from "../controllers/studyContent.controller";

export const studyContentRouter = Router();

studyContentRouter.get("/", authMiddleware, getStudyContentHandler);
