import { Request, Response } from "express";
import { HttpError } from "../middlewares/errorHandler";
import { DAILY_REVIEW_LIMIT, selectTodayQuestions } from "../services/quiz/selectTodayQuestions";
import { submitAnswer } from "../services/quiz/submitAnswer";

// GET /api/quiz/today
export async function getTodayQuiz(req: Request, res: Response) {
  const limitParam = req.query.limit;
  const limitSolicitado = limitParam ? Number(limitParam) : DAILY_REVIEW_LIMIT;
  // A dose diária nunca passa de 5 perguntas (documento de MVP §8), mesmo se pedirem mais.
  const limit = limitSolicitado > 0 ? Math.min(limitSolicitado, DAILY_REVIEW_LIMIT) : DAILY_REVIEW_LIMIT;
  const macroTemaId = req.query.macro_tema_id as string | undefined;
  const data = await selectTodayQuestions(req.user!.id, limit, macroTemaId);
  return res.status(200).json(data);
}

// POST /api/quiz/answer
export async function postQuizAnswer(req: Request, res: Response) {
  const perguntaId = req.body.pergunta_id as string | undefined;
  const resposta = req.body.resposta as string | undefined;

  if (!perguntaId || !resposta) {
    throw new HttpError(400, "Envie pergunta_id e resposta.");
  }

  const respostaNormalizada = resposta.toUpperCase();
  if (!["A", "B", "C", "D"].includes(respostaNormalizada)) {
    throw new HttpError(400, "resposta deve ser A, B, C ou D.");
  }

  const result = await submitAnswer({
    userId: req.user!.id,
    perguntaId,
    respostaEscolhida: respostaNormalizada as "A" | "B" | "C" | "D",
  });

  return res.status(200).json(result);
}
