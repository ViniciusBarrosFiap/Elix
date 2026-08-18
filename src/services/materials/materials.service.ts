import { MaterialsRepository, UploadableFile } from "./materials.repository";
import { useStudyContentStore } from "@/src/store/studyContentStore";

export const MaterialsService = {
  async uploadFile(file: UploadableFile, macroTemaId: string, tags: string[]) {
    const result = await MaterialsRepository.uploadFile(file, macroTemaId, tags);

    useStudyContentStore
      .getState()
      .setData({ macrotemas: result.macrotemas });

    return result;
  },

  async uploadYoutubeLink(url: string, macroTemaId: string, tags: string[]) {
    const result = await MaterialsRepository.uploadYoutubeLink(url, macroTemaId, tags);

    useStudyContentStore
      .getState()
      .setData({ macrotemas: result.macrotemas });

    return result;
  },
};
