import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { AppError } from "./lib/errors";
import { seedData } from "./lib/inMemoryStore";
import { apiRouter } from "./routes";

seedData();

export const app = express();

app.use(cors({ origin: env.webOrigin }));
app.use(express.json({ limit: "5mb" }));
app.use("/api", apiRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});
