import { ResearchPayload } from "@shared/api";

// JSON Schema for validating research payload
const researchPayloadSchema = {
  type: "object",
  properties: {
    company_value_prop: {
      type: "string",
      minLength: 10,
      maxLength: 500
    },
    product_names: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
        maxLength: 100
      },
      minItems: 1,
      maxItems: 10
    },
    pricing_model: {
      type: "string",
      minLength: 5,
      maxLength: 200
    },
    key_competitors: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
        maxLength: 100
      },
      minItems: 1,
      maxItems: 20
    },
    company_domain: {
      type: "string",
      pattern: "^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$",
      maxLength: 100
    }
  },
  additionalProperties: false
};

// Simple JSON Schema validator
export function validateResearchPayload(payload: ResearchPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check each field if present
  if (payload.company_value_prop !== undefined) {
    if (typeof payload.company_value_prop !== 'string') {
      errors.push('company_value_prop must be a string');
    } else if (payload.company_value_prop.length < 10 || payload.company_value_prop.length > 500) {
      errors.push('company_value_prop must be between 10 and 500 characters');
    }
  }

  if (payload.product_names !== undefined) {
    if (!Array.isArray(payload.product_names)) {
      errors.push('product_names must be an array');
    } else {
      if (payload.product_names.length === 0 || payload.product_names.length > 10) {
        errors.push('product_names must have between 1 and 10 items');
      }
      payload.product_names.forEach((name, index) => {
        if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
          errors.push(`product_names[${index}] must be a non-empty string with max 100 characters`);
        }
      });
    }
  }

  if (payload.pricing_model !== undefined) {
    if (typeof payload.pricing_model !== 'string') {
      errors.push('pricing_model must be a string');
    } else if (payload.pricing_model.length < 5 || payload.pricing_model.length > 200) {
      errors.push('pricing_model must be between 5 and 200 characters');
    }
  }

  if (payload.key_competitors !== undefined) {
    if (!Array.isArray(payload.key_competitors)) {
      errors.push('key_competitors must be an array');
    } else {
      if (payload.key_competitors.length === 0 || payload.key_competitors.length > 20) {
        errors.push('key_competitors must have between 1 and 20 items');
      }
      payload.key_competitors.forEach((competitor, index) => {
        if (typeof competitor !== 'string' || competitor.length === 0 || competitor.length > 100) {
          errors.push(`key_competitors[${index}] must be a non-empty string with max 100 characters`);
        }
      });
    }
  }

  if (payload.company_domain !== undefined) {
    if (typeof payload.company_domain !== 'string') {
      errors.push('company_domain must be a string');
    } else {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(payload.company_domain) || payload.company_domain.length > 100) {
        errors.push('company_domain must be a valid domain name with max 100 characters');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to clean and deduplicate text
export function cleanAndDeduplicateText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s\-.,;:()]/g, '') // Remove special characters except basic punctuation
    .substring(0, 500); // Limit length
}

// Helper function to extract domain from email
export function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : null;
}
