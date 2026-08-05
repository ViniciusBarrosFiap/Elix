import studyContentMock from "@/src/mocks/studyContents.json";
import { StudyContentData } from "@/src/types/studyContent";

export const StudyContentRepository = {
  async getAll(): Promise<StudyContentData> {
    return studyContentMock as StudyContentData;
  },
};