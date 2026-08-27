import { supabase } from "../../config/supabase";
import { HttpError } from "../../middlewares/errorHandler";
import { GeneratedStudyContent } from "../../schemas/studyContent.schema";

/**
 * Insere subtemas/conceitos/perguntas gerados dentro do macrotema escolhido,
 * via função Postgres transacional (ver sql/002_functions.sql e
 * sql/007_material_hierarchy.sql) — tudo ou nada. Nenhum macro_tema é criado
 * aqui. Todo subtema nasce vinculado ao material que o gerou (materialId),
 * pra dar pra agrupar/mostrar a origem na tela da disciplina.
 */
export async function persistStudyContent(
  macroTemaId: string,
  materialId: string,
  generated: GeneratedStudyContent
) {
  const { error } = await supabase.rpc("insert_generated_content", {
    p_macro_tema_id: macroTemaId,
    p_material_id: materialId,
    p_subtemas: generated.subtemas,
  });

  if (error) {
    throw new HttpError(500, "Falha ao salvar o conteúdo gerado: " + error.message);
  }
}
