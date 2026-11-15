import fs from "node:fs/promises";
import express from "express";
import { EPISODES_DIR } from "./lib/pathGuard";
import { assetsRouter } from "./routes/assets";
import { projectsRouter } from "./routes/projects";
import { renderRouter } from "./routes/render";
import { settingsRouter } from "./routes/settings";

const PORT = Number(process.env.PORT || 3100);

const app = express();
app.use(express.json({ limit: "4mb" }));

await fs.mkdir(EPISODES_DIR, { recursive: true });

app.use("/episodes-media", express.static(EPISODES_DIR));
app.use("/api/projects", projectsRouter);
app.use("/api/projects", assetsRouter);
app.use("/api/projects", renderRouter);
app.use("/api/settings", settingsRouter);

app.listen(PORT, () => {
  console.log(`Kapsul Fakta Studio API listening on http://localhost:${PORT}`);
});
