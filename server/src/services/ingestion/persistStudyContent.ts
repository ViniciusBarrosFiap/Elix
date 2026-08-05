import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";
import { GeneratedStudyContent } from "../../schemas/studyContent.schema";

/**
 * Insere subtemas/conceitos/perguntas gerados dentro do macrotema escolhido,
 * via função Postgres transacional (ver sql/002_functions.sql) — tudo ou nada.
 * Nenhum macro_tema é criado aqui.
 */
export async function persistStudyContent(macroTemaId: string, generated: GeneratedStudyContent) {
  const { error } = await supabase.rpc("insert_generated_content", {
    p_macro_tema_id: macroTemaId,
    p_subtemas: generated.subtemas,
  });

  if (error) {
    throw new HttpError(500, "Falha ao salvar o conteúdo gerado: " + error.message);
  }
}
