import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  uploadMaterial,
  uploadYoutubeMaterial,
  uploadNotionMaterial,
  getMaterialViewUrlHandler,
  getMaterialNotionContentHandler,
  deleteMaterialHandler,
} from "../controllers/materials.controller";
import { env } from "../config/env";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

export const materialsRouter = Router();

materialsRouter.post("/", authMiddleware, upload.single("file"), uploadMaterial);
materialsRouter.post("/youtube", authMiddleware, uploadYoutubeMaterial);
materialsRouter.post("/notion", authMiddleware, uploadNotionMaterial);
materialsRouter.get("/:id/view-url", authMiddleware, getMaterialViewUrlHandler);
materialsRouter.get("/:id/notion-content", authMiddleware, getMaterialNotionContentHandler);
materialsRouter.delete("/:id", authMiddleware, deleteMaterialHandler);
