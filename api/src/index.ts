import "dotenv/config";
import cors from "cors";
import express from "express";
import { recordsRouter } from "./routes/records";
import { verifyRouter } from "./routes/verify";
import { importRouter } from "./routes/import";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());

// Write endpoints restricted to same-origin/configured origin; verify stays open (spec §17).
app.use(
  ["/api/records", "/api/import"],
  cors({ origin: process.env.CORS_ORIGIN ?? false })
);
app.use("/api/verify", cors());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/records", recordsRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/import", importRouter);

app.listen(port, () => {
  console.log(`MaintNotary API listening on http://localhost:${port}`);
});
