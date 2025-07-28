import { ResearchAgent } from "./research-agent";
import { ResearchProgress } from "@shared/api";
import { EventEmitter } from "events";
import { db } from "./database";

interface Job {
  id: string;
  personId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  progress: ResearchProgress;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private queue: string[] = [];
  private isProcessing = false;
  private researchAgent = new ResearchAgent();

  constructor() {
    super();
    this.startProcessing();
  }

  enqueueJob(personId: string): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: Job = {
      id: jobId,
      personId,
      status: "queued",
      createdAt: new Date(),
      progress: {
        job_id: jobId,
        person_id: personId,
        status: "queued",
        current_iteration: 0,
        max_iterations: 3,
        found_fields: [],
        missing_fields: [
          "company_value_prop",
          "product_names",
          "pricing_model",
          "key_competitors",
          "company_domain",
        ],
      },
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    this.emit("job_queued", job.progress);

    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private async startProcessing() {
    setInterval(() => {
      if (!this.isProcessing && this.queue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const jobId = this.queue.shift();
      if (!jobId) return;

      const job = this.jobs.get(jobId);
      if (!job) return;

      console.log(`Starting job ${jobId} for person ${job.personId}`);

      job.status = "in_progress";
      job.startedAt = new Date();
      job.progress.status = "in_progress";
      job.progress.current_iteration = 1;

      this.emit("job_progress", job.progress);

      try {
        // Create a custom research agent with progress callbacks
        const progressCallback = (iteration: number, query: string, foundFields: string[], missingFields: string[]) => {
          job.progress.current_iteration = iteration;
          job.progress.current_query = query;
          job.progress.found_fields = foundFields;
          job.progress.missing_fields = missingFields;
          this.emit("job_progress", job.progress);
        };

        // Run the actual research with progress tracking
        const result = await this.researchAgent.enrichPersonWithProgress(job.personId, progressCallback);

        job.status = "completed";
        job.completedAt = new Date();
        job.progress.status = "completed";
        // Update final progress
        const requiredFields = ["company_value_prop", "product_names", "pricing_model", "key_competitors", "company_domain"];
        job.progress.found_fields = requiredFields.filter((field) => {
          const value = result[field as keyof typeof result];
          return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0);
        });
        job.progress.missing_fields = requiredFields.filter(field => !job.progress.found_fields.includes(field));
        job.progress.current_query = undefined;

        this.emit("job_completed", job.progress);
        console.log(`Job ${jobId} completed successfully`);
      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        job.status = "failed";
        job.completedAt = new Date();
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.progress.status = "failed";
        job.progress.error = job.error;

        this.emit("job_failed", job.progress);
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton job queue instance
export const jobQueue = new JobQueue();
