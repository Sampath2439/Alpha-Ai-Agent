// Database Models
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
}

export interface Company {
  id: string;
  campaign_id: string;
  name: string | null;
  domain: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  company_id: string;
  full_name: string | null;
  email: string | null;
  title: string | null;
  created_at: string;
}

export interface ContextSnippet {
  id: string;
  entity_type: 'company' | 'person';
  entity_id: string;
  snippet_type: string;
  payload: ResearchPayload;
  source_urls: string[];
  created_at: string;
}

export interface SearchLog {
  id: string;
  context_snippet_id: string;
  iteration: number;
  query: string;
  top_results: SearchResult[];
  created_at: string;
}

// Research Agent Types
export interface ResearchPayload {
  company_value_prop?: string;
  product_names?: string[];
  pricing_model?: string;
  key_competitors?: string[];
  company_domain?: string;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

// API Request/Response Types
export interface DemoResponse {
  message: string;
}

export interface EnrichPersonRequest {
  person_id: string;
}

export interface EnrichPersonResponse {
  job_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  message: string;
}

export interface ResearchProgress {
  job_id: string;
  person_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  current_iteration: number;
  max_iterations: number;
  current_query?: string;
  found_fields: string[];
  missing_fields: string[];
  error?: string;
}

// API Response Types
export interface PeopleListResponse {
  people: (Person & { company: Company })[];
}

export interface CompanySnippetsResponse {
  snippets: ContextSnippet[];
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}
