import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getTodayQuiz, postQuizAnswer } from "../controllers/quiz.controller";

export const quizRouter = Router();

quizRouter.get("/today", deviceAuth, getTodayQuiz);
quizRouter.post("/answer", deviceAuth, postQuizAnswer);
