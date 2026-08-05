import { supabase } from "../config/supabase";
import { env } from "../config/env";

/**
 * Upload best-effort do arquivo original ao Supabase Storage. Nunca lança —
 * se falhar, retorna null e o pipeline de geração segue normalmente a partir
 * do buffer em memória (ver documentação, seção de riscos).
 */
export async function uploadOriginalFileBestEffort(params: {
  userId: string;
  materialId: string;
  filename: string;
  buffer: Buffer;
  mimeType?: string;
}): Promise<string | null> {
  const path = `${params.userId}/${params.materialId}/${params.filename}`;

  try {
    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(path, params.buffer, {
        contentType: params.mimeType,
        upsert: true,
      });

    if (error) {
      console.warn("Upload best-effort ao Storage falhou:", error.message);
      return null;
    }

    return path;
  } catch (err) {
    console.warn("Upload best-effort ao Storage falhou (exceção):", err);
    return null;
  }
}
