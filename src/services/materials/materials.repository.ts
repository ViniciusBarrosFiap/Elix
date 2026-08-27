import { apiFetch } from "@/src/lib/apiClient";
import { StudyContentData } from "@/src/types/studyContent";

export interface UploadableFile {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface UploadMaterialResult {
  material_id: string;
  macrotemas: StudyContentData["macrotemas"];
}

export const MaterialsRepository = {
  async uploadFile(
    file: UploadableFile,
    macroTemaId: string,
    tags: string[]
  ): Promise<UploadMaterialResult> {
    const formData = new FormData();

    // RN FormData espera esse formato de objeto (não um Blob real) para arquivos.
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);

    formData.append("macro_tema_id", macroTemaId);
    if (tags.length > 0) {
      formData.append("tags", JSON.stringify(tags));
    }

    return apiFetch<UploadMaterialResult>("/api/materials", {
      method: "POST",
      rawBody: formData,
    });
  },

  async uploadYoutubeLink(
    url: string,
    macroTemaId: string,
    tags: string[]
  ): Promise<UploadMaterialResult> {
    return apiFetch<UploadMaterialResult>("/api/materials/youtube", {
      method: "POST",
      body: { url, macro_tema_id: macroTemaId, tags },
    });
  },

  async uploadNotionPage(
    pageId: string,
    pageTitle: string,
    macroTemaId: string,
    tags: string[]
  ): Promise<UploadMaterialResult> {
    return apiFetch<UploadMaterialResult>("/api/materials/notion", {
      method: "POST",
      body: { page_id: pageId, page_title: pageTitle, macro_tema_id: macroTemaId, tags },
    });
  },
};
