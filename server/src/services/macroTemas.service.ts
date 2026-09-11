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

/**
 * Renomeia e/ou troca o emoji de uma disciplina (segurar o card na tela
 * "Todos os conteúdos" abre o modal que chama isso). Quando o nome muda,
 * também troca a entrada correspondente em `users.disciplinas` — essa lista
 * é quem `syncMacroTemasFromDisciplinas` usa pra decidir criar/reativar/
 * desativar macrotemas (ver função acima); sem essa troca, a próxima vez que
 * o aluno salvasse "Editar disciplinas" recriaria um macrotema com o nome
 * antigo, duplicando a disciplina.
 */
export async function updateMacroTema(
  macroTemaId: string,
  userId: string,
  updates: { nome?: string; emoji?: string }
): Promise<MacroTemaListItem> {
  const dbUpdates: Record<string, string> = {};
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;

  if (updates.nome !== undefined) {
    const { data: atual, error: atualError } = await supabase
      .from("macro_temas")
      .select("nome")
      .eq("id", macroTemaId)
      .single();

    if (atualError || !atual) {
      throw new HttpError(404, "Macrotema não encontrado.");
    }

    dbUpdates.nome = updates.nome;

    if (atual.nome.trim().toLowerCase() !== updates.nome.trim().toLowerCase()) {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("disciplinas")
        .eq("id", userId)
        .single();

      if (!userError && userRow) {
        const disciplinas: string[] = userRow.disciplinas ?? [];
        const idx = disciplinas.findIndex((d) => d.trim().toLowerCase() === atual.nome.trim().toLowerCase());
        if (idx !== -1) {
          const novasDisciplinas = [...disciplinas];
          novasDisciplinas[idx] = updates.nome;
          await supabase.from("users").update({ disciplinas: novasDisciplinas }).eq("id", userId);
        }
      }
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("macro_temas")
    .update(dbUpdates)
    .eq("id", macroTemaId)
    .eq("user_id", userId)
    .select("id, nome, emoji, status")
    .single();

  if (updateError) {
    // unique_violation (user_id, nome) — já existe outra disciplina com esse nome.
    if (updateError.code === "23505") {
      throw new HttpError(409, "Você já tem uma disciplina com esse nome.");
    }
    throw new HttpError(500, "Falha ao atualizar a disciplina.");
  }

  if (!updated) {
    throw new HttpError(404, "Macrotema não encontrado para este usuário.");
  }

  return updated;
}

/**
 * Persiste a nova ordem dos cards em "Todos os conteúdos" (arrastar e
 * soltar) — a posição de cada id no array recebido vira o novo valor da
 * coluna `ordem`, a mesma usada em listMacroTemas/getStudyContent pra
 * ordenar. `.eq("user_id", userId)` em cada update garante que um id de
 * outro usuário simplesmente não casa com nenhuma linha (0 rows afetadas),
 * em vez de reordenar dado de terceiro.
 */
export async function reorderMacroTemas(userId: string, orderedIds: string[]): Promise<void> {
  const resultados = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("macro_temas").update({ ordem: index }).eq("id", id).eq("user_id", userId)
    )
  );

  const erro = resultados.find((r) => r.error);
  if (erro?.error) {
    throw new HttpError(500, "Falha ao salvar a nova ordem das disciplinas.");
  }
}
