import { ResearchAgent } from './research-agent';
import { ResearchProgress } from '@shared/api';
import { EventEmitter } from 'events';

interface Job {
  id: string;
  personId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
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
      status: 'queued',
      createdAt: new Date(),
      progress: {
        job_id: jobId,
        person_id: personId,
        status: 'queued',
        current_iteration: 0,
        max_iterations: 3,
        found_fields: [],
        missing_fields: ['company_value_prop', 'product_names', 'pricing_model', 'key_competitors', 'company_domain']
      }
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    
    this.emit('job_queued', job.progress);
    
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      
      job.status = 'in_progress';
      job.startedAt = new Date();
      job.progress.status = 'in_progress';
      job.progress.current_iteration = 1;
      
      this.emit('job_progress', job.progress);

      try {
        // Simulate progress updates during research
        for (let i = 1; i <= 3; i++) {
          job.progress.current_iteration = i;
          job.progress.current_query = `Researching iteration ${i}...`;
          this.emit('job_progress', job.progress);
          
          // Add delay to simulate real work
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Run the actual research
        const result = await this.researchAgent.enrichPerson(job.personId);
        
        job.status = 'completed';
        job.completedAt = new Date();
        job.progress.status = 'completed';
        job.progress.found_fields = Object.keys(result).filter(key => result[key as keyof typeof result]);
        job.progress.missing_fields = ['company_value_prop', 'product_names', 'pricing_model', 'key_competitors', 'company_domain']
          .filter(field => !result[field as keyof typeof result]);

        this.emit('job_completed', job.progress);
        console.log(`Job ${jobId} completed successfully`);

      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.progress.status = 'failed';
        job.progress.error = job.error;
        
        this.emit('job_failed', job.progress);
      }

    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton job queue instance
export const jobQueue = new JobQueue();
