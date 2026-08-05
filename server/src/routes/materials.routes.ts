import { Router } from "express";
import multer from "multer";
import { deviceAuth } from "../middlewares/deviceAuth";
import { uploadMaterial } from "../controllers/materials.controller";
import { env } from "../config/env";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

export const materialsRouter = Router();

materialsRouter.post("/", deviceAuth, upload.single("file"), uploadMaterial);
