import { supabase } from "../config/supabase";
import { HttpError } from "../middlewares/errorHandler";

export interface MacroTemaListItem {
  id: string;
  nome: string;
  emoji: string;
  status: string;
}

/**
 * Sincroniza macro_temas a partir da lista de disciplinas do usuário.
 * Regra (ver documentação, seção "disciplinas → macro_temas"): insere um macro_tema
 * para cada disciplina ainda não existente (case-insensitive); nunca deleta um
 * macro_tema existente, mesmo que a disciplina correspondente saia da lista depois.
 */
export async function syncMacroTemasFromDisciplinas(userId: string, disciplinas: string[]) {
  if (disciplinas.length === 0) return;

  const { data: existentes, error: selectError } = await supabase
    .from("macro_temas")
    .select("nome")
    .eq("user_id", userId);

  if (selectError) {
    throw new HttpError(500, "Falha ao consultar macrotemas existentes.");
  }

  const nomesExistentes = new Set(
    (existentes ?? []).map((row) => row.nome.trim().toLowerCase())
  );

  const novos = disciplinas
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0)
    .filter((nome) => !nomesExistentes.has(nome.toLowerCase()))
    // dedupe dentro do próprio payload recebido
    .filter((nome, index, arr) => arr.findIndex((n) => n.toLowerCase() === nome.toLowerCase()) === index);

  if (novos.length === 0) return;

  const { error: insertError } = await supabase
    .from("macro_temas")
    .insert(novos.map((nome) => ({ user_id: userId, nome })));

  if (insertError) {
    throw new HttpError(500, "Falha ao criar macrotemas a partir das disciplinas.");
  }
}

export async function listMacroTemas(userId: string): Promise<MacroTemaListItem[]> {
  const { data, error } = await supabase
    .from("macro_temas")
    .select("id, nome, emoji, status")
    .eq("user_id", userId)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, "Falha ao listar macrotemas.");
  }

  return data ?? [];
}

export async function assertMacroTemaBelongsToUser(macroTemaId: string, userId: string) {
  const { data, error } = await supabase
    .from("macro_temas")
    .select("id")
    .eq("id", macroTemaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Falha ao validar macrotema.");
  }

  if (!data) {
    throw new HttpError(404, "Macrotema não encontrado para este usuário.");
  }
}
