import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getTodayQuiz, postQuizAnswer } from "../controllers/quiz.controller";

export const quizRouter = Router();

quizRouter.get("/today", authMiddleware, getTodayQuiz);
quizRouter.post("/answer", authMiddleware, postQuizAnswer);
