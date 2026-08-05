import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface AuthedUserRow {
  id: string;
  device_id: string;
  nome: string;
  curso: string | null;
  semestre: number | null;
  disciplinas: string[];
  primeiro_acesso: boolean;
  fez_upload: boolean;
  pontuacao: number;
  streak: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUserRow;
    }
  }
}

/**
 * Resolve o usuário pelo header X-Device-Id, criando-o automaticamente se for a
 * primeira vez que esse device aparece — assim o app funciona mesmo que esqueça
 * de chamar POST /api/users/identify antes de outra rota.
 */
export async function deviceAuth(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("X-Device-Id");

  if (!deviceId || deviceId.trim().length === 0) {
    return res.status(401).json({ erro_mensagem: "Header X-Device-Id é obrigatório." });
  }

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ erro_mensagem: "Falha ao resolver usuário." });
  }

  if (existing) {
    req.user = existing as AuthedUserRow;
    return next();
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({ device_id: deviceId })
    .select("*")
    .single();

  if (insertError || !created) {
    return res.status(500).json({ erro_mensagem: "Falha ao criar usuário." });
  }

  req.user = created as AuthedUserRow;
  return next();
}
