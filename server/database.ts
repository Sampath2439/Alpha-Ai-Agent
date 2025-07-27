import {
  Campaign,
  Company,
  Person,
  ContextSnippet,
  SearchLog,
} from "@shared/api";
import { v4 as uuidv4 } from "uuid";

// In-memory database storage
export class Database {
  private campaigns: Map<string, Campaign> = new Map();
  private companies: Map<string, Company> = new Map();
  private people: Map<string, Person> = new Map();
  private contextSnippets: Map<string, ContextSnippet> = new Map();
  private searchLogs: Map<string, SearchLog> = new Map();

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // Create 1 Campaign
    const campaign: Campaign = {
      id: uuidv4(),
      name: "Q1 2024 Outreach Campaign",
      status: "active",
      created_at: new Date().toISOString(),
    };
    this.campaigns.set(campaign.id, campaign);

    // Create 1 Company
    const company: Company = {
      id: uuidv4(),
      campaign_id: campaign.id,
      name: "TechCorp Solutions",
      domain: "techcorp.com",
      created_at: new Date().toISOString(),
    };
    this.companies.set(company.id, company);

    // Create 2 People
    const person1: Person = {
      id: uuidv4(),
      company_id: company.id,
      full_name: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      title: "Chief Technology Officer",
      created_at: new Date().toISOString(),
    };

    const person2: Person = {
      id: uuidv4(),
      company_id: company.id,
      full_name: "Michael Chen",
      email: "michael.chen@techcorp.com",
      title: "VP of Engineering",
      created_at: new Date().toISOString(),
    };

    this.people.set(person1.id, person1);
    this.people.set(person2.id, person2);
  }

  // Campaign methods
  getCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  // Company methods
  getCompanies(): Company[] {
    return Array.from(this.companies.values());
  }

  getCompany(id: string): Company | undefined {
    return this.companies.get(id);
  }

  getCompaniesByCampaign(campaignId: string): Company[] {
    return Array.from(this.companies.values()).filter(
      (c) => c.campaign_id === campaignId,
    );
  }

  // People methods
  getPeople(): Person[] {
    return Array.from(this.people.values());
  }

  getPerson(id: string): Person | undefined {
    return this.people.get(id);
  }

  getPeopleByCompany(companyId: string): Person[] {
    return Array.from(this.people.values()).filter(
      (p) => p.company_id === companyId,
    );
  }

  getPeopleWithCompanies(): (Person & { company: Company })[] {
    const result: (Person & { company: Company })[] = [];
    for (const person of this.people.values()) {
      const company = this.companies.get(person.company_id);
      if (company) {
        result.push({ ...person, company });
      }
    }
    return result;
  }

  // Context Snippets methods
  getContextSnippets(): ContextSnippet[] {
    return Array.from(this.contextSnippets.values());
  }

  getContextSnippet(id: string): ContextSnippet | undefined {
    return this.contextSnippets.get(id);
  }

  getContextSnippetsByEntity(
    entityType: "company" | "person",
    entityId: string,
  ): ContextSnippet[] {
    return Array.from(this.contextSnippets.values()).filter(
      (cs) => cs.entity_type === entityType && cs.entity_id === entityId,
    );
  }

  createContextSnippet(
    snippet: Omit<ContextSnippet, "id" | "created_at">,
  ): ContextSnippet {
    const newSnippet: ContextSnippet = {
      id: uuidv4(),
      ...snippet,
      created_at: new Date().toISOString(),
    };
    this.contextSnippets.set(newSnippet.id, newSnippet);
    return newSnippet;
  }

  // Search Logs methods
  getSearchLogs(): SearchLog[] {
    return Array.from(this.searchLogs.values());
  }

  getSearchLogsBySnippet(snippetId: string): SearchLog[] {
    return Array.from(this.searchLogs.values()).filter(
      (sl) => sl.context_snippet_id === snippetId,
    );
  }

  createSearchLog(log: Omit<SearchLog, "id" | "created_at">): SearchLog {
    const newLog: SearchLog = {
      id: uuidv4(),
      ...log,
      created_at: new Date().toISOString(),
    };
    this.searchLogs.set(newLog.id, newLog);
    return newLog;
  }
}

// Singleton database instance
export const db = new Database();
