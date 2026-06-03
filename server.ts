import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { z } from "zod";
import * as jobDb from "./src/backend/jobDb.js";
import { addJobToQueue } from "./src/backend/queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Make sure public directories exist
  const publicDir = path.join(__dirname, "public");
  const clipsDir = path.join(publicDir, "clips");
  const tempDir = path.join(__dirname, "temp");
  
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // Serve static assets from public explicitly
  app.use(express.static(publicDir));

  const jobSchema = z.object({
    url: z.string().url(),
  });

  // API Routes
  app.post("/api/jobs", async (req, res) => {
    try {
      const { url } = jobSchema.parse(req.body);
      const jobId = uuidv4();
      
      const job = jobDb.createJob(jobId, url);
      
      // Enqueue job asynchronously
      await addJobToQueue(jobId, url);

      res.status(202).json({ jobId, status: job.status, message: "Job created" });
    } catch (error) {
      res.status(400).json({ error: "Invalid URL provided" });
    }
  });

  app.get("/api/jobs/:id", (req, res) => {
    const job = jobDb.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });
  
  app.get("/api/jobs", (req, res) => {
    res.json(jobDb.getAllJobs());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
