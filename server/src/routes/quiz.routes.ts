import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getTodayQuiz } from "../controllers/quiz.controller";

export const quizRouter = Router();

quizRouter.get("/today", deviceAuth, getTodayQuiz);
