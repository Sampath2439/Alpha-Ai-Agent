import { ResearchPayload, SearchResult, Person, Company } from "@shared/api";
import { db } from "./database";
import { validateResearchPayload, cleanAndDeduplicateText, extractDomainFromEmail } from "./schema-validator";

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
  private requiredFields = [
    "company_value_prop",
    "product_names",
    "pricing_model",
    "key_competitors",
    "company_domain"
  ];

  async enrichPerson(personId: string): Promise<ResearchPayload> {
    return this.enrichPersonWithProgress(personId);
  }

  async enrichPersonWithProgress(
    personId: string,
    progressCallback?: (iteration: number, query: string, foundFields: string[], missingFields: string[]) => void
  ): Promise<ResearchPayload> {
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

    console.log(`Starting research for person: ${person.full_name} at company: ${company.name}`);

    // Pre-populate company domain if we can extract it from email
    if (person.email && !payload.company_domain) {
      const emailDomain = extractDomainFromEmail(person.email);
      if (emailDomain) {
        payload.company_domain = emailDomain;
        console.log(`Pre-populated company domain from email: ${emailDomain}`);
      }
    }

    // Use existing company domain if available
    if (company.domain && !payload.company_domain) {
      payload.company_domain = company.domain;
      console.log(`Using existing company domain: ${company.domain}`);
    }

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
      const foundFields = this.getFoundFields(payload);

      console.log(`Iteration ${iteration}: Found fields: [${foundFields.join(', ')}], Missing fields: [${missingFields.join(', ')}]`);

      if (missingFields.length === 0) {
        console.log(
          `✅ Research completed for ${person.full_name} after ${iteration - 1} iterations. All required fields found.`,
        );
        break;
      }

      const query = this.generateQuery(
        company,
        person,
        missingFields,
        iteration,
      );
      console.log(`🔍 Iteration ${iteration}: Query: "${query}" (targeting: ${missingFields[0] || 'general'})`);

      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(iteration, query, foundFields, missingFields);
      }

      try {
        const searchResults = await this.searchService.search(query);

        // Log the search
        db.createSearchLog({
          context_snippet_id: contextSnippet.id,
          iteration,
          query,
          top_results: searchResults.slice(0, 3),
        });

        // Extract and clean information from search results
        const extractedData = this.extractInformation(searchResults, payload, missingFields);
        console.log(`📊 Iteration ${iteration}: Extracted data for fields: [${Object.keys(extractedData).join(', ')}]`);

        // Collect source URLs
        allSourceUrls.push(...searchResults.slice(0, 3).map((r) => r.url));
      } catch (error) {
        console.error(`Search failed in iteration ${iteration}:`, error);
      }
    }

    // Validate final payload before persisting
    const validation = validateResearchPayload(payload);
    if (!validation.valid) {
      console.warn(`⚠️  Validation warnings for ${person.full_name}:`, validation.errors);
      // Log validation issues but don't fail - this is research data
    }

    // Update the context snippet with final results
    const finalSnippet = db.getContextSnippet(contextSnippet.id);
    if (finalSnippet) {
      finalSnippet.payload = payload;
      finalSnippet.source_urls = [...new Set(allSourceUrls)]; // Remove duplicates
    }

    const finalMissingFields = this.getMissingFields(payload);
    const finalFoundFields = this.getFoundFields(payload);

    console.log(`🎯 Final results for ${person.full_name}:`);
    console.log(`   Found: [${finalFoundFields.join(', ')}]`);
    if (finalMissingFields.length > 0) {
      console.log(`   Missing: [${finalMissingFields.join(', ')}]`);
    }
    console.log(`   Sources: ${allSourceUrls.length} unique URLs`);

    return payload;
  }

  private getMissingFields(payload: ResearchPayload): string[] {
    return this.requiredFields.filter(
      (field) => {
        const value = payload[field as keyof ResearchPayload];
        if (Array.isArray(value)) {
          return !value || value.length === 0;
        }
        return !value || (typeof value === 'string' && value.trim().length === 0);
      }
    );
  }

  private getFoundFields(payload: ResearchPayload): string[] {
    return this.requiredFields.filter(
      (field) => {
        const value = payload[field as keyof ResearchPayload];
        if (Array.isArray(value)) {
          return value && value.length > 0;
        }
        return value && typeof value === 'string' && value.trim().length > 0;
      }
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

    // Focus on the first missing field for targeted search
    const primaryTarget = missingFields[0];

    if (iteration === 1 && missingFields.length === this.requiredFields.length) {
      // First iteration - broad company overview
      return `${companyName} company overview products services value proposition`;
    } else if (primaryTarget === "company_value_prop") {
      return `${companyName} value proposition mission what we do company overview`;
    } else if (primaryTarget === "product_names") {
      return `${companyName} products software platforms services features`;
    } else if (primaryTarget === "pricing_model") {
      return `${companyName} pricing plans costs subscription billing model`;
    } else if (primaryTarget === "key_competitors") {
      return `${companyName} competitors alternatives market analysis comparison industry`;
    } else if (primaryTarget === "company_domain") {
      return `${companyName} official website domain URL homepage`;
    } else {
      // Fallback for specific missing fields
      return `${companyName} ${primaryTarget.replace('_', ' ')}`;
    }
  }

  private extractInformation(
    searchResults: SearchResult[],
    payload: ResearchPayload,
    targetFields: string[]
  ): { [key: string]: any } {
    const allText = searchResults
      .map((r) => `${r.title} ${r.snippet}`)
      .join(" ")
      .toLowerCase();

    const extractedData: { [key: string]: any } = {};

    // Extract value proposition
    if (!payload.company_value_prop && targetFields.includes("company_value_prop")) {
      const valueKeywords = ["platform", "solution", "helps", "provides", "offers", "enables", "delivers", "specializes"];

      for (const result of searchResults) {
        const snippet = result.snippet.toLowerCase();
        const title = result.title.toLowerCase();

        if (valueKeywords.some(keyword => snippet.includes(keyword) || title.includes(keyword))) {
          // Extract the sentence containing the value proposition
          const sentences = result.snippet.split(/[.!?]/);
          const valueSentence = sentences.find(s =>
            valueKeywords.some(keyword => s.toLowerCase().includes(keyword))
          );

          if (valueSentence && valueSentence.trim().length > 10) {
            payload.company_value_prop = cleanAndDeduplicateText(valueSentence.trim() + ".");
            extractedData.company_value_prop = payload.company_value_prop;
            break;
          }
        }
      }
    }

    // Extract product names
    if ((!payload.product_names || payload.product_names.length === 0) && targetFields.includes("product_names")) {
      const products: string[] = [];
      const productPatterns = [
        /\b[A-Z][a-z]+[A-Z][a-z]+\b/g, // CamelCase products like "CloudDeploy", "MonitorPro"
        /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Title Case products like "Cloud Deploy"
        /"([^"]+)"/g, // Quoted product names
      ];

      const productKeywords = ["product", "platform", "software", "service", "tool", "solution", "app", "api"];

      for (const result of searchResults) {
        const text = result.snippet;
        const lowerText = text.toLowerCase();

        // Check if this result contains product-related content
        if (productKeywords.some(keyword => lowerText.includes(keyword))) {
          // Try different patterns to extract product names
          productPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // Clean the match and validate it looks like a product name
                let productName = match.replace(/[",\s]+$/g, '').trim();
                if (productName.length > 2 && productName.length < 50 &&
                    /^[A-Za-z0-9\s\-]+$/.test(productName)) {
                  products.push(productName);
                }
              });
            }
          });

          // Also look for explicit product mentions
          const productMentions = text.match(/(?:products?|platforms?)\s+(?:include|are|:)\s*([^.!?]+)/gi);
          if (productMentions) {
            productMentions.forEach(mention => {
              const items = mention.split(/,|and|&/).map(item => item.trim().replace(/^(?:products?|platforms?|include|are|:)\s*/i, ''));
              products.push(...items.filter(item => item.length > 2 && item.length < 50));
            });
          }
        }
      }

      if (products.length > 0) {
        payload.product_names = [...new Set(products)].slice(0, 5);
        extractedData.product_names = payload.product_names;
      }
    }

    // Extract pricing model
    if (!payload.pricing_model && targetFields.includes("pricing_model")) {
      const pricingKeywords = ["$", "pricing", "plan", "subscription", "cost", "price", "tier", "billing", "free", "premium"];

      for (const result of searchResults) {
        const snippet = result.snippet.toLowerCase();
        const title = result.title.toLowerCase();

        if (pricingKeywords.some(keyword => snippet.includes(keyword) || title.includes(keyword))) {
          // Try to extract specific pricing information
          if (snippet.includes("$") || snippet.includes("price")) {
            // Look for price patterns
            const pricePatterns = [
              /\$\d+(?:\.\d{2})?(?:\s*(?:per|\/)\s*\w+)?/gi,
              /\d+(?:\.\d{2})?\s*(?:per|\/)\s*\w+/gi,
              /free.*tier|freemium|free.*plan/gi,
              /subscription.*based|monthly.*plan|annual.*plan/gi,
            ];

            let pricingInfo = "";
            pricePatterns.forEach(pattern => {
              const matches = result.snippet.match(pattern);
              if (matches) {
                pricingInfo += matches.join(", ") + ". ";
              }
            });

            if (pricingInfo) {
              payload.pricing_model = cleanAndDeduplicateText(pricingInfo);
              extractedData.pricing_model = payload.pricing_model;
              break;
            }
          }

          // Fallback to general pricing model extraction
          if (!payload.pricing_model) {
            const sentences = result.snippet.split(/[.!?]/);
            const pricingSentence = sentences.find(s =>
              pricingKeywords.some(keyword => s.toLowerCase().includes(keyword))
            );

            if (pricingSentence && pricingSentence.trim().length > 5) {
              payload.pricing_model = cleanAndDeduplicateText(pricingSentence.trim());
              extractedData.pricing_model = payload.pricing_model;
              break;
            }
          }
        }
      }
    }

    // Extract competitors
    if ((!payload.key_competitors || payload.key_competitors.length === 0) && targetFields.includes("key_competitors")) {
      const competitors: string[] = [];
      const competitorKeywords = ["competitor", "alternative", "vs", "compared to", "similar to", "rival"];
      const knownCompetitors = [
        "aws", "amazon web services", "google cloud", "azure", "microsoft azure",
        "digitalocean", "heroku", "salesforce", "hubspot", "mailchimp", "shopify",
        "slack", "zoom", "asana", "jira", "confluence", "notion", "airtable"
      ];

      for (const result of searchResults) {
        const text = result.snippet.toLowerCase();
        const title = result.title.toLowerCase();

        // Look for explicit competitor mentions
        if (competitorKeywords.some(keyword => text.includes(keyword) || title.includes(keyword))) {
          // Extract company names that appear near competitor keywords
          const sentences = result.snippet.split(/[.!?;]/);

          sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            if (competitorKeywords.some(keyword => lowerSentence.includes(keyword))) {
              // Look for capitalized company names in this sentence
              const companyMatches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
              if (companyMatches) {
                companyMatches.forEach(match => {
                  if (match.length > 2 && match.length < 50 &&
                      !match.toLowerCase().includes('techcorp') && // Exclude the company itself
                      /^[A-Za-z\s]+$/.test(match)) {
                    competitors.push(match.trim());
                  }
                });
              }
            }
          });
        }

        // Also check for known competitors mentioned directly
        knownCompetitors.forEach(competitor => {
          if (text.includes(competitor)) {
            const formattedName = competitor.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            competitors.push(formattedName);
          }
        });
      }

      if (competitors.length > 0) {
        payload.key_competitors = [...new Set(competitors)].slice(0, 8);
        extractedData.key_competitors = payload.key_competitors;
      }
    }

    // Extract domain (if not already known)
    if (!payload.company_domain && targetFields.includes("company_domain")) {
      const domainPatterns = [
        /https?:\/\/([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})/g,
        /(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})/g,
      ];

      for (const result of searchResults) {
        const text = `${result.title} ${result.snippet} ${result.url}`;

        domainPatterns.forEach(pattern => {
          const matches = text.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Clean and validate domain
              let domain = match.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
              if (domain && /^[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$/.test(domain) &&
                  domain.length < 100 && !domain.includes(' ')) {
                payload.company_domain = domain;
                extractedData.company_domain = domain;
                return;
              }
            });
          }
        });

        if (payload.company_domain) break;
      }
    }

    return extractedData;
  }
}
