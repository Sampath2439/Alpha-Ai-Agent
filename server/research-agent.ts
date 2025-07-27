import { ResearchPayload, SearchResult, Person, Company } from "@shared/api";
import { db } from "./database";

// Mock search service that returns deterministic results
class MockSearchService {
  private mockResults: Record<string, SearchResult[]> = {
    "TechCorp Solutions": [
      {
        url: "https://techcorp.com",
        title: "TechCorp Solutions - Cloud Infrastructure Platform",
        snippet:
          "TechCorp Solutions provides enterprise-grade cloud infrastructure and DevOps automation tools. Our platform helps companies scale their applications with 99.9% uptime guarantee.",
      },
      {
        url: "https://techcorp.com/pricing",
        title: "TechCorp Pricing - Flexible Plans",
        snippet:
          "Choose from our Starter ($99/month), Professional ($299/month), or Enterprise (custom pricing) plans. All plans include 24/7 support and advanced monitoring.",
      },
      {
        url: "https://techcrunch.com/techcorp-funding",
        title: "TechCorp Raises $50M Series B",
        snippet:
          "TechCorp competes with AWS, Google Cloud, and Azure in the cloud infrastructure space. Key differentiators include simplified DevOps workflows and cost optimization.",
      },
    ],
    "TechCorp products": [
      {
        url: "https://techcorp.com/products",
        title: "TechCorp Products - CloudDeploy & MonitorPro",
        snippet:
          "Our flagship products include CloudDeploy for automated deployments, MonitorPro for application monitoring, and ScaleMaster for auto-scaling infrastructure.",
      },
      {
        url: "https://docs.techcorp.com",
        title: "TechCorp Documentation",
        snippet:
          "Complete documentation for CloudDeploy, MonitorPro, and ScaleMaster products with API references and integration guides.",
      },
    ],
    "TechCorp competitors": [
      {
        url: "https://industry-report.com/cloud-platforms",
        title: "Cloud Platform Market Analysis 2024",
        snippet:
          "Major competitors in the cloud infrastructure space include AWS, Google Cloud Platform, Microsoft Azure, DigitalOcean, and Heroku.",
      },
      {
        url: "https://techcorp.com/vs-competition",
        title: "TechCorp vs Competition",
        snippet:
          "TechCorp differentiates from AWS and Azure through simplified deployment processes and 40% lower costs for mid-market companies.",
      },
    ],
  };

  async search(query: string): Promise<SearchResult[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find matching results based on query keywords
    for (const [key, results] of Object.entries(this.mockResults)) {
      if (query.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
        return results;
      }
    }

    // Default fallback results
    return [
      {
        url: "https://example.com",
        title: "Search Result for: " + query,
        snippet: "This is a mock search result for the query: " + query,
      },
    ];
  }
}

export class ResearchAgent {
  private searchService = new MockSearchService();
  private maxIterations = 3;

  async enrichPerson(personId: string): Promise<ResearchPayload> {
    const person = db.getPerson(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    const company = db.getCompany(person.company_id);
    if (!company) {
      throw new Error("Company not found");
    }

    const payload: ResearchPayload = {};
    const allSourceUrls: string[] = [];

    // Create context snippet to track this research session
    const contextSnippet = db.createContextSnippet({
      entity_type: "company",
      entity_id: company.id,
      snippet_type: "research",
      payload,
      source_urls: [],
    });

    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      const missingFields = this.getMissingFields(payload);

      if (missingFields.length === 0) {
        console.log(
          `Research completed for ${person.full_name} after ${iteration - 1} iterations`,
        );
        break;
      }

      const query = this.generateQuery(
        company,
        person,
        missingFields,
        iteration,
      );
      console.log(`Iteration ${iteration}: Searching for "${query}"`);

      try {
        const searchResults = await this.searchService.search(query);

        // Log the search
        db.createSearchLog({
          context_snippet_id: contextSnippet.id,
          iteration,
          query,
          top_results: searchResults.slice(0, 3),
        });

        // Extract information from search results
        this.extractInformation(searchResults, payload);

        // Collect source URLs
        allSourceUrls.push(...searchResults.slice(0, 3).map((r) => r.url));
      } catch (error) {
        console.error(`Search failed in iteration ${iteration}:`, error);
      }
    }

    // Update the context snippet with final results
    const finalSnippet = db.getContextSnippet(contextSnippet.id);
    if (finalSnippet) {
      finalSnippet.payload = payload;
      finalSnippet.source_urls = [...new Set(allSourceUrls)]; // Remove duplicates
    }

    return payload;
  }

  private getMissingFields(payload: ResearchPayload): string[] {
    const requiredFields = [
      "company_value_prop",
      "product_names",
      "pricing_model",
      "key_competitors",
      "company_domain",
    ];
    return requiredFields.filter(
      (field) => !payload[field as keyof ResearchPayload],
    );
  }

  private generateQuery(
    company: Company,
    person: Person,
    missingFields: string[],
    iteration: number,
  ): string {
    const companyName = company.name || "unknown company";
    const domain = company.domain || "";

    if (iteration === 1) {
      return `${companyName} company overview products services`;
    } else if (missingFields.includes("pricing_model")) {
      return `${companyName} pricing plans costs subscription`;
    } else if (missingFields.includes("key_competitors")) {
      return `${companyName} competitors alternatives market comparison`;
    } else if (missingFields.includes("product_names")) {
      return `${companyName} products features software platform`;
    } else {
      return `${companyName} ${missingFields[0]}`;
    }
  }

  private extractInformation(
    searchResults: SearchResult[],
    payload: ResearchPayload,
  ): void {
    const allText = searchResults
      .map((r) => `${r.title} ${r.snippet}`)
      .join(" ")
      .toLowerCase();

    // Extract value proposition
    if (!payload.company_value_prop) {
      if (
        allText.includes("platform") ||
        allText.includes("solution") ||
        allText.includes("helps")
      ) {
        const snippet = searchResults.find(
          (r) =>
            r.snippet.toLowerCase().includes("platform") ||
            r.snippet.toLowerCase().includes("solution") ||
            r.snippet.toLowerCase().includes("helps"),
        );
        if (snippet) {
          payload.company_value_prop = snippet.snippet.split(".")[0] + ".";
        }
      }
    }

    // Extract product names
    if (!payload.product_names) {
      const products: string[] = [];
      const productKeywords = [
        "clouddeploy",
        "monitorpro",
        "scalemaster",
        "platform",
        "product",
      ];

      for (const result of searchResults) {
        const text = result.snippet.toLowerCase();
        productKeywords.forEach((keyword) => {
          if (text.includes(keyword)) {
            // Extract capitalized words that might be product names
            const matches = result.snippet.match(/[A-Z][a-z]+[A-Z][a-z]+/g);
            if (matches) {
              products.push(...matches);
            }
          }
        });
      }

      if (products.length > 0) {
        payload.product_names = [...new Set(products)].slice(0, 3);
      }
    }

    // Extract pricing model
    if (!payload.pricing_model) {
      if (
        allText.includes("$") ||
        allText.includes("pricing") ||
        allText.includes("plan")
      ) {
        const pricingSnippet = searchResults.find(
          (r) =>
            r.snippet.includes("$") ||
            r.snippet.toLowerCase().includes("pricing") ||
            r.snippet.toLowerCase().includes("plan"),
        );
        if (pricingSnippet) {
          payload.pricing_model = "Subscription-based with multiple tiers";
        }
      }
    }

    // Extract competitors
    if (!payload.key_competitors) {
      const competitors: string[] = [];
      const competitorKeywords = [
        "aws",
        "google cloud",
        "azure",
        "digitalocean",
        "heroku",
        "competitor",
      ];

      for (const result of searchResults) {
        const text = result.snippet.toLowerCase();
        competitorKeywords.forEach((keyword) => {
          if (text.includes(keyword) && keyword !== "competitor") {
            competitors.push(
              keyword
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
            );
          }
        });
      }

      if (competitors.length > 0) {
        payload.key_competitors = [...new Set(competitors)].slice(0, 5);
      }
    }

    // Extract domain (if not already known)
    if (!payload.company_domain) {
      const domainMatch = allText.match(/https?:\/\/([^\/\s]+)/);
      if (domainMatch) {
        payload.company_domain = domainMatch[1];
      }
    }
  }
}
