import { Request, Response } from "express";
import { getStudyContent } from "../services/studyContent.service";

// GET /api/study-content
export async function getStudyContentHandler(req: Request, res: Response) {
  const data = await getStudyContent(req.user!.id);
  return res.status(200).json(data);
}
