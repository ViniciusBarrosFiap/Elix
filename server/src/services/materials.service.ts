import { supabase } from "../config/supabase";
import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";
import { detectKind, extractText } from "./ingestion/extractText";
import { fetchYoutubeTranscript } from "./ingestion/fetchYoutubeTranscript";
import { fetchYoutubeTitle } from "./ingestion/fetchYoutubeTitle";
import { fetchNotionPageText } from "./ingestion/fetchNotionPageText";
import { getAccessToken as getNotionAccessToken } from "./notion/notion.service";
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

interface ProcessYoutubeLinkInput {
  userId: string;
  macroTemaId: string;
  tags: string[];
  url: string;
}

interface ProcessNotionPageInput {
  userId: string;
  macroTemaId: string;
  tags: string[];
  pageId: string;
  pageTitle: string;
}

interface ProcessMaterialResult {
  material_id: string;
  macrotemas: StudyContentData["macrotemas"];
}

async function markMaterialAsErrored(materialId: string, mensagem: string) {
  await supabase
    .from("materials")
    .update({ status: "erro", erro_mensagem: mensagem, processed_at: new Date().toISOString() })
    .eq("id", materialId);
}

async function getMacroTemaNome(macroTemaId: string): Promise<string> {
  const { data: macroTema, error } = await supabase
    .from("macro_temas")
    .select("nome")
    .eq("id", macroTemaId)
    .single();

  if (error || !macroTema) {
    throw new HttpError(404, "Macrotema não encontrado.");
  }

  return macroTema.nome as string;
}

/**
 * Núcleo compartilhado: dado um texto já extraído (de PDF/DOCX ou de uma
 * transcrição do YouTube) e o material já registrado como "processando",
 * gera o conteúdo via Gemini, persiste e devolve a árvore atualizada.
 * Em caso de erro, marca o material como "erro" antes de repropagar.
 */
async function processExtractedText({
  userId,
  macroTemaId,
  materialId,
  disciplinaNome,
  tags,
  texto,
}: {
  userId: string;
  macroTemaId: string;
  materialId: string;
  disciplinaNome: string;
  tags: string[];
  texto: string;
}): Promise<ProcessMaterialResult> {
  const generated = await generateStudyContent({
    disciplinaNome,
    tags,
    texto: texto.slice(0, env.MAX_INPUT_CHARS),
  });

  await persistStudyContent(macroTemaId, materialId, generated);

  await supabase
    .from("materials")
    .update({ status: "concluido", processed_at: new Date().toISOString() })
    .eq("id", materialId);

  await supabase.from("users").update({ fez_upload: true }).eq("id", userId);

  const studyContent = await getStudyContent(userId);

  return { material_id: materialId, macrotemas: studyContent.macrotemas };
}

export async function processUpload({
  userId,
  macroTemaId,
  tags,
  file,
}: ProcessUploadInput): Promise<ProcessMaterialResult> {
  await assertMacroTemaBelongsToUser(macroTemaId, userId);
  const disciplinaNome = await getMacroTemaNome(macroTemaId);

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

    return await processExtractedText({ userId, macroTemaId, materialId, disciplinaNome, tags, texto: fullText });
  } catch (err) {
    const mensagem = err instanceof HttpError ? err.message : "Falha inesperada ao processar o material.";
    await markMaterialAsErrored(materialId, mensagem);
    throw err instanceof HttpError ? err : new HttpError(500, mensagem);
  }
}

export async function processNotionPage({
  userId,
  macroTemaId,
  tags,
  pageId,
  pageTitle,
}: ProcessNotionPageInput): Promise<ProcessMaterialResult> {
  await assertMacroTemaBelongsToUser(macroTemaId, userId);
  const disciplinaNome = await getMacroTemaNome(macroTemaId);

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: userId,
      macro_tema_id: macroTemaId,
      nome_arquivo: pageTitle || "Página do Notion",
      mime_type: "application/vnd.notion.page",
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
    const accessToken = await getNotionAccessToken(userId);
    const texto = await fetchNotionPageText(accessToken, pageId);
    return await processExtractedText({ userId, macroTemaId, materialId, disciplinaNome, tags, texto });
  } catch (err) {
    const mensagem = err instanceof HttpError ? err.message : "Falha inesperada ao processar a página do Notion.";
    await markMaterialAsErrored(materialId, mensagem);
    throw err instanceof HttpError ? err : new HttpError(500, mensagem);
  }
}

export interface MaterialViewUrl {
  tipo: "documento" | "youtube" | "notion";
  url: string | null;
}

/**
 * Resolve como o usuário pode ver o material original a partir da tela da
 * disciplina: link direto pro YouTube, uma URL assinada e temporária do
 * Supabase Storage pro documento enviado, ou nada pro Notion (a página só é
 * acessível através da própria integração OAuth, não por um link direto).
 */
export async function getMaterialViewUrl(materialId: string, userId: string): Promise<MaterialViewUrl> {
  const { data: material, error } = await supabase
    .from("materials")
    .select("nome_arquivo, mime_type, storage_path, url")
    .eq("id", materialId)
    .eq("user_id", userId)
    .single();

  if (error || !material) {
    throw new HttpError(404, "Material não encontrado.");
  }

  if (material.mime_type === "video/youtube") {
    // Materiais criados antes da coluna `url` existir guardavam o link em
    // nome_arquivo — mantém funcionando pros dois casos.
    return { tipo: "youtube", url: (material.url as string | null) ?? (material.nome_arquivo as string) };
  }

  if (material.mime_type === "application/vnd.notion.page") {
    return { tipo: "notion", url: null };
  }

  if (!material.storage_path) {
    return { tipo: "documento", url: null };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(material.storage_path as string, 60 * 10);

  if (signError || !signed) {
    throw new HttpError(500, "Falha ao gerar o link de visualização do material.");
  }

  return { tipo: "documento", url: signed.signedUrl };
}

export async function processYoutubeLink({
  userId,
  macroTemaId,
  tags,
  url,
}: ProcessYoutubeLinkInput): Promise<ProcessMaterialResult> {
  await assertMacroTemaBelongsToUser(macroTemaId, userId);
  const disciplinaNome = await getMacroTemaNome(macroTemaId);

  // Título de exibição buscado via oEmbed (best-effort) — se falhar, cai de
  // volta pro link, que é sempre válido como nome (só menos legível).
  const tituloVideo = await fetchYoutubeTitle(url);

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: userId,
      macro_tema_id: macroTemaId,
      nome_arquivo: tituloVideo ?? url,
      url,
      mime_type: "video/youtube",
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
    const texto = await fetchYoutubeTranscript(url);
    return await processExtractedText({ userId, macroTemaId, materialId, disciplinaNome, tags, texto });
  } catch (err) {
    const mensagem = err instanceof HttpError ? err.message : "Falha inesperada ao processar o vídeo.";
    await markMaterialAsErrored(materialId, mensagem);
    throw err instanceof HttpError ? err : new HttpError(500, mensagem);
  }
}
