import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface AuthedUserRow {
  id: string;
  auth_user_id: string;
  device_id: string | null;
  nome: string;
  curso: string | null;
  semestre: number | null;
  disciplinas: string[];
  primeiro_acesso: boolean;
  fez_upload: boolean;
  pontuacao: number;
  streak: number;
  last_review_date: string | null;
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
 * Resolve o usuário a partir do access token do Supabase Auth (header
 * Authorization: Bearer <token>), criando a linha em `users` automaticamente
 * na primeira vez que esse auth_user_id aparece — o app nunca chama o
 * backend para signup/login (fala direto com a Auth API do Supabase via
 * supabase-js), então esse é o único lugar onde a linha nasce.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return res.status(401).json({ erro_mensagem: "Header Authorization (Bearer <token>) é obrigatório." });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData?.user) {
    return res.status(401).json({ erro_mensagem: "Sessão inválida ou expirada." });
  }

  const authUserId = authData.user.id;

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ erro_mensagem: "Falha ao resolver usuário." });
  }

  if (existing) {
    req.user = existing as AuthedUserRow;
    return next();
  }

  const nomePadrao = authData.user.email?.split("@")[0] ?? "usuário";

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({ auth_user_id: authUserId, nome: nomePadrao })
    .select("*")
    .single();

  if (insertError || !created) {
    return res.status(500).json({ erro_mensagem: "Falha ao criar usuário." });
  }

  req.user = created as AuthedUserRow;
  return next();
}
