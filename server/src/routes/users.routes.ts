import { Router } from "express";
import { deviceAuth } from "../middlewares/deviceAuth";
import { getMe, identify, updateMe } from "../controllers/users.controller";

export const usersRouter = Router();

usersRouter.post("/identify", deviceAuth, identify);
usersRouter.get("/me", deviceAuth, getMe);
usersRouter.patch("/me", deviceAuth, updateMe);
