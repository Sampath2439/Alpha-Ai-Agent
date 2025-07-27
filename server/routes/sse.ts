import { RequestHandler } from "express";
import { jobQueue } from "../job-queue";

// SSE endpoint for real-time job progress updates
export const handleProgressStream: RequestHandler = (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
  );

  // Listen for job progress events
  const handleJobProgress = (progress: any) => {
    res.write(
      `data: ${JSON.stringify({ type: "progress", data: progress })}\n\n`,
    );
  };

  const handleJobCompleted = (progress: any) => {
    res.write(
      `data: ${JSON.stringify({ type: "completed", data: progress })}\n\n`,
    );
  };

  const handleJobFailed = (progress: any) => {
    res.write(
      `data: ${JSON.stringify({ type: "failed", data: progress })}\n\n`,
    );
  };

  const handleJobQueued = (progress: any) => {
    res.write(
      `data: ${JSON.stringify({ type: "queued", data: progress })}\n\n`,
    );
  };

  // Subscribe to job queue events
  jobQueue.on("job_progress", handleJobProgress);
  jobQueue.on("job_completed", handleJobCompleted);
  jobQueue.on("job_failed", handleJobFailed);
  jobQueue.on("job_queued", handleJobQueued);

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`,
    );
  }, 30000);

  // Clean up on client disconnect
  req.on("close", () => {
    jobQueue.off("job_progress", handleJobProgress);
    jobQueue.off("job_completed", handleJobCompleted);
    jobQueue.off("job_failed", handleJobFailed);
    jobQueue.off("job_queued", handleJobQueued);
    clearInterval(heartbeat);
    res.end();
  });

  req.on("error", () => {
    jobQueue.off("job_progress", handleJobProgress);
    jobQueue.off("job_completed", handleJobCompleted);
    jobQueue.off("job_failed", handleJobFailed);
    jobQueue.off("job_queued", handleJobQueued);
    clearInterval(heartbeat);
    res.end();
  });
};
