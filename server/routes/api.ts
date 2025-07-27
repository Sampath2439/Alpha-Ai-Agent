import { RequestHandler } from "express";
import { db } from "../database";
import { jobQueue } from "../job-queue";
import {
  PeopleListResponse,
  CompanySnippetsResponse,
  HealthResponse,
  EnrichPersonResponse
} from "@shared/api";

// Health check
export const handleHealth: RequestHandler = (req, res) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
  res.json(response);
};

// Get all people with their companies
export const handleGetPeople: RequestHandler = (req, res) => {
  const people = db.getPeopleWithCompanies();
  const response: PeopleListResponse = { people };
  res.json(response);
};

// Get all campaigns
export const handleGetCampaigns: RequestHandler = (req, res) => {
  const campaigns = db.getCampaigns();
  res.json(campaigns);
};

// Get all companies
export const handleGetCompanies: RequestHandler = (req, res) => {
  const companies = db.getCompanies();
  res.json(companies);
};

// Get context snippets for a company
export const handleGetCompanySnippets: RequestHandler = (req, res) => {
  const { company_id } = req.params;
  
  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  const snippets = db.getContextSnippetsByEntity('company', company_id);
  const response: CompanySnippetsResponse = { snippets };
  res.json(response);
};

// Get context snippets for a person
export const handleGetPersonSnippets: RequestHandler = (req, res) => {
  const { person_id } = req.params;
  
  if (!person_id) {
    return res.status(400).json({ error: 'Person ID is required' });
  }

  const snippets = db.getContextSnippetsByEntity('person', person_id);
  const response: CompanySnippetsResponse = { snippets };
  res.json(response);
};

// Get a specific person
export const handleGetPerson: RequestHandler = (req, res) => {
  const { person_id } = req.params;
  
  if (!person_id) {
    return res.status(400).json({ error: 'Person ID is required' });
  }

  const person = db.getPerson(person_id);
  if (!person) {
    return res.status(404).json({ error: 'Person not found' });
  }

  const company = db.getCompany(person.company_id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  res.json({ ...person, company });
};

// Enrich person endpoint with async job processing
export const handleEnrichPerson: RequestHandler = (req, res) => {
  const { person_id } = req.params;

  if (!person_id) {
    return res.status(400).json({ error: 'Person ID is required' });
  }

  const person = db.getPerson(person_id);
  if (!person) {
    return res.status(404).json({ error: 'Person not found' });
  }

  try {
    const jobId = jobQueue.enqueueJob(person_id);

    const response: EnrichPersonResponse = {
      job_id: jobId,
      status: 'queued',
      message: 'Research job queued successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to enqueue job:', error);
    res.status(500).json({ error: 'Failed to queue research job' });
  }
};

// Get job status
export const handleGetJobStatus: RequestHandler = (req, res) => {
  const { job_id } = req.params;

  if (!job_id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  const job = jobQueue.getJob(job_id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job.progress);
};

// Get all jobs
export const handleGetJobs: RequestHandler = (req, res) => {
  const jobs = jobQueue.getAllJobs();
  res.json(jobs);
};
