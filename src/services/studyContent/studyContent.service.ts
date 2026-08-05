import { StudyContentRepository } from "./studyContent.repository";

import { useStudyContentStore } from "@/src/store/studyContentStore";

export const StudyContentService = {
  async initialize() {
    const data =
      await StudyContentRepository.getAll();

    useStudyContentStore
      .getState()
      .setData(data);
  },
};