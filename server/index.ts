import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleHealth,
  handleGetPeople,
  handleGetCampaigns,
  handleGetCompanies,
  handleGetCompanySnippets,
  handleGetPersonSnippets,
  handleGetPerson,
  handleEnrichPerson,
  handleGetJobStatus,
  handleGetJobs,
} from "./routes/api";
import { handleProgressStream } from "./routes/sse";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", handleHealth);

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Main API routes
  app.get("/api/people", handleGetPeople);
  app.get("/api/people/:person_id", handleGetPerson);
  app.get("/api/campaigns", handleGetCampaigns);
  app.get("/api/companies", handleGetCompanies);
  app.get("/api/snippets/company/:company_id", handleGetCompanySnippets);
  app.get("/api/snippets/person/:person_id", handleGetPersonSnippets);
  app.post("/api/enrich/:person_id", handleEnrichPerson);
  app.get("/api/jobs/:job_id", handleGetJobStatus);
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/progress-stream", handleProgressStream);

  return app;
}
