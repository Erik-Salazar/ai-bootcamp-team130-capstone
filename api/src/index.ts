import "dotenv/config";
import cors from "cors";
import express from "express";
import { config } from "./config";
import { recordsRouter } from "./routes/records";
import { verifyRouter } from "./routes/verify";
import { importRouter } from "./routes/import";

const app = express();

app.use(express.json());

// Write endpoints restricted to configured origin; verify stays open (spec §17).
app.use(["/api/records", "/api/import"], cors({ origin: config.corsOrigin }));
app.use("/api/verify", cors());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/records", recordsRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/import", importRouter);

app.listen(config.port, () => {
  console.log(`MaintNotary API listening on http://localhost:${config.port}`);
});
