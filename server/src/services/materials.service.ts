import { supabase } from "../config/supabase";
import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";
import { detectKind, extractText } from "./ingestion/extractText";
import { generateStudyContent } from "./ingestion/generateStudyContent";
import { persistStudyContent } from "./ingestion/persistStudyContent";
import { assertMacroTemaBelongsToUser } from "./macroTemas.service";
import { uploadOriginalFileBestEffort } from "./storage.service";
import { getStudyContent } from "./studyContent.service";
import { StudyContentData } from "../schemas/studyContent.schema";

interface ProcessUploadInput {
  userId: string;
  macroTemaId: string;
  tags: string[];
  file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
}

interface ProcessUploadResult {
  material_id: string;
  macrotemas: StudyContentData["macrotemas"];
}

async function markMaterialAsErrored(materialId: string, mensagem: string) {
  await supabase
    .from("materials")
    .update({ status: "erro", erro_mensagem: mensagem, processed_at: new Date().toISOString() })
    .eq("id", materialId);
}

export async function processUpload({
  userId,
  macroTemaId,
  tags,
  file,
}: ProcessUploadInput): Promise<ProcessUploadResult> {
  await assertMacroTemaBelongsToUser(macroTemaId, userId);

  const { data: macroTema, error: macroTemaError } = await supabase
    .from("macro_temas")
    .select("nome")
    .eq("id", macroTemaId)
    .single();

  if (macroTemaError || !macroTema) {
    throw new HttpError(404, "Macrotema não encontrado.");
  }

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: userId,
      macro_tema_id: macroTemaId,
      nome_arquivo: file.originalname,
      mime_type: file.mimetype,
      tamanho_bytes: file.size,
      tags,
      status: "processando",
    })
    .select("id")
    .single();

  if (insertError || !material) {
    throw new HttpError(500, "Falha ao registrar o material enviado.");
  }

  const materialId = material.id as string;

  try {
    const storagePath = await uploadOriginalFileBestEffort({
      userId,
      materialId,
      filename: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    if (storagePath) {
      await supabase.from("materials").update({ storage_path: storagePath }).eq("id", materialId);
    }

    const kind = detectKind(file.originalname, file.mimetype);
    const fullText = await extractText(file.buffer, kind);
    const texto = fullText.slice(0, env.MAX_INPUT_CHARS);

    const generated = await generateStudyContent({
      disciplinaNome: macroTema.nome,
      tags,
      texto,
    });

    await persistStudyContent(macroTemaId, generated);

    await supabase
      .from("materials")
      .update({ status: "concluido", processed_at: new Date().toISOString() })
      .eq("id", materialId);

    await supabase.from("users").update({ fez_upload: true }).eq("id", userId);

    const studyContent = await getStudyContent(userId);

    return { material_id: materialId, macrotemas: studyContent.macrotemas };
  } catch (err) {
    const mensagem = err instanceof HttpError ? err.message : "Falha inesperada ao processar o material.";
    await markMaterialAsErrored(materialId, mensagem);
    throw err instanceof HttpError ? err : new HttpError(500, mensagem);
  }
}
