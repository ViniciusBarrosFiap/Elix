import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getMe, identify, updateMe, deleteMe } from "../controllers/users.controller";

export const usersRouter = Router();

usersRouter.post("/identify", authMiddleware, identify);
usersRouter.get("/me", authMiddleware, getMe);
usersRouter.patch("/me", authMiddleware, updateMe);
usersRouter.delete("/me", authMiddleware, deleteMe);
