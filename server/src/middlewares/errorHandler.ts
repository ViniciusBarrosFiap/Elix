import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro_mensagem: err.message });
  }

  console.error("Erro não tratado:", err);
  return res.status(500).json({ erro_mensagem: "Erro interno do servidor." });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({ erro_mensagem: "Rota não encontrada." });
}
