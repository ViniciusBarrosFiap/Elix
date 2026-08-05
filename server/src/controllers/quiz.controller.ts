import { Request, Response } from "express";
import { selectTodayQuestions } from "../services/quiz/selectTodayQuestions";

// GET /api/quiz/today
export async function getTodayQuiz(req: Request, res: Response) {
  const limitParam = req.query.limit;
  const limit = limitParam ? Number(limitParam) : undefined;
  const data = await selectTodayQuestions(req.user!.id, limit && limit > 0 ? limit : undefined);
  return res.status(200).json(data);
}
