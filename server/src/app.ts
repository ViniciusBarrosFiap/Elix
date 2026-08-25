import "express-async-errors";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { usersRouter } from "./routes/users.routes";
import { macroTemasRouter } from "./routes/macroTemas.routes";
import { materialsRouter } from "./routes/materials.routes";
import { studyContentRouter } from "./routes/studyContent.routes";
import { quizRouter } from "./routes/quiz.routes";
import { notionRouter } from "./routes/notion.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

app.use("/api/users", usersRouter);
app.use("/api/macro-temas", macroTemasRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/study-content", studyContentRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/notion", notionRouter);

app.use(notFoundHandler);
app.use(errorHandler);
