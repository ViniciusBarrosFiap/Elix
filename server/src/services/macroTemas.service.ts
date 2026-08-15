import { supabase } from "../config/supabase";
import { HttpError } from "../middlewares/errorHandler";

export interface MacroTemaListItem {
  id: string;
  nome: string;
  emoji: string;
  status: string;
}

/**
 * Sincroniza macro_temas a partir da lista de disciplinas do usuário (documento de
 * MVP §10, etapa "editar disciplinas"). A lista recebida é tratada como o conjunto
 * ATIVO completo:
 *   - nome novo -> cria macro_tema (ativo=true).
 *   - nome existente mas inativo -> reativa.
 *   - macro_tema ativo cujo nome saiu da lista -> desativa (nunca deleta — preserva
 *     subtemas/conceitos/perguntas já gerados).
 */
export async function syncMacroTemasFromDisciplinas(userId: string, disciplinas: string[]) {
  const { data: existentes, error: selectError } = await supabase
    .from("macro_temas")
    .select("id, nome, ativo")
    .eq("user_id", userId);

  if (selectError) {
    throw new HttpError(500, "Falha ao consultar macrotemas existentes.");
  }

  const nomesDesejados = disciplinas
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0)
    // dedupe dentro do próprio payload recebido
    .filter((nome, index, arr) => arr.findIndex((n) => n.toLowerCase() === nome.toLowerCase()) === index);

  const desejadosLower = new Set(nomesDesejados.map((nome) => nome.toLowerCase()));
  const existentesPorNomeLower = new Map(
    (existentes ?? []).map((row) => [row.nome.trim().toLowerCase(), row])
  );

  const novos = nomesDesejados.filter((nome) => !existentesPorNomeLower.has(nome.toLowerCase()));
  if (novos.length > 0) {
    const { error } = await supabase
      .from("macro_temas")
      .insert(novos.map((nome) => ({ user_id: userId, nome })));
    if (error) {
      throw new HttpError(500, "Falha ao criar macrotemas a partir das disciplinas.");
    }
  }

  const paraReativar = (existentes ?? [])
    .filter((row) => !row.ativo && desejadosLower.has(row.nome.trim().toLowerCase()))
    .map((row) => row.id);
  if (paraReativar.length > 0) {
    const { error } = await supabase.from("macro_temas").update({ ativo: true }).in("id", paraReativar);
    if (error) {
      throw new HttpError(500, "Falha ao reativar disciplinas.");
    }
  }

  const paraDesativar = (existentes ?? [])
    .filter((row) => row.ativo && !desejadosLower.has(row.nome.trim().toLowerCase()))
    .map((row) => row.id);
  if (paraDesativar.length > 0) {
    const { error } = await supabase.from("macro_temas").update({ ativo: false }).in("id", paraDesativar);
    if (error) {
      throw new HttpError(500, "Falha ao remover disciplinas.");
    }
  }
}

export async function listMacroTemas(userId: string): Promise<MacroTemaListItem[]> {
  const { data, error } = await supabase
    .from("macro_temas")
    .select("id, nome, emoji, status")
    .eq("user_id", userId)
    .eq("ativo", true)
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
