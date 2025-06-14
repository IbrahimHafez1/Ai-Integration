import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ensureValidToken } from '../utils/tokenRefresher.js';
import logger from './logger.js';

export function createLeadTools(userId: string) {
  return [
    new DynamicStructuredTool({
      name: 'validateEmail',
      description: 'Validates if an email address has correct format. Returns true/false.',
      schema: z.object({
        input: z.string().describe('Email address to validate'),
      }),
      func: async ({ input }) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input).toString();
      },
    }),

    new DynamicStructuredTool({
      name: 'formatName',
      description:
        'Formats a full name or extracts name from text into first and last name. Returns JSON with firstName and lastName.',
      schema: z.object({
        input: z.string().describe('Full name or text containing a name to format'),
      }),
      func: async ({ input }) => {
        // Improved name extraction patterns
        const namePatterns = [
          /my name is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
          /i am ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
          /i'm ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
          /this is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
          /^([A-Za-z]+(?:\s+[A-Za-z]+)*)/i, // Name at the beginning
        ];

        let fullName = '';

        // Try to extract name using patterns
        for (const pattern of namePatterns) {
          const match = input.match(pattern);
          if (match && match[1]) {
            fullName = match[1].trim();
            break;
          }
        }

        // If no pattern matched, check if input looks like a simple name
        if (!fullName) {
          const words = input.trim().split(/\s+/);
          // Only treat as name if it's 1-3 words and all are alphabetic
          if (words.length <= 3 && words.every((word) => /^[A-Za-z]+$/.test(word))) {
            fullName = input.trim();
          }
        }

        if (fullName) {
          const parts = fullName.split(/\s+/);
          return JSON.stringify({
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || 'Unknown',
          });
        }

        // No valid name found
        return JSON.stringify({
          firstName: '',
          lastName: 'Unknown',
        });
      },
    }),

    new DynamicStructuredTool({
      name: 'cleanPhoneNumber',
      description: 'Cleans and formats a phone number. Returns cleaned number.',
      schema: z.object({
        input: z.string().describe('Phone number to clean'),
      }),
      func: async ({ input }) => {
        return input.replace(/[^0-9+]/g, '');
      },
    }),

    new DynamicStructuredTool({
      name: 'extractCompanyName',
      description: 'Extracts company name from text. Returns extracted company or "Individual".',
      schema: z.object({
        input: z.string().describe('Text to extract company name from'),
      }),
      func: async ({ input }) => {
        const companyIndicators = [
          /(?:work\s+(?:at|for|with)|employed\s+(?:at|by)|company\s+is)\s+([A-Z][A-Za-z0-9\s&.,'-]+)/i,
          /(?:at|for|with|from)\s+([A-Z][A-Za-z0-9\s&.,'-]+)(?:\s+(?:company|corp|inc|ltd|llc))/i,
          /([A-Z][A-Za-z0-9\s&.,'-]+)(?:\s+(?:company|corp|inc|ltd|llc))/i,
        ];

        for (const pattern of companyIndicators) {
          const match = input.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Simple fallback for "at CompanyName" patterns
        const simpleMatch = input.match(/(?:at|for|with)\s+([A-Z][A-Za-z0-9\s]+)/i);
        if (simpleMatch && simpleMatch[1]) {
          const company = simpleMatch[1].trim();
          // Only return if it looks like a company name (not too long, proper case)
          if (company.length <= 50 && /^[A-Z]/.test(company)) {
            return company;
          }
        }

        return 'Individual';
      },
    }),

    new DynamicStructuredTool({
      name: 'createZohoLead',
      description: 'Creates a new lead in Zoho CRM. Returns success/failure response.',
      schema: z.object({
        input: z
          .string()
          .describe(
            'JSON string containing lead data with First_Name, Last_Name, Email, Phone, Company, and Description fields',
          ),
      }),
      func: async ({ input }) => {
        try {
          const leadData = JSON.parse(input);

          // Validate required fields
          if (!leadData.First_Name && !leadData.Email && !leadData.Phone) {
            throw new Error('Lead must have at least a name, email, or phone number');
          }

          // Ensure Last_Name is not too long (Zoho has field limits)
          if (leadData.Last_Name && leadData.Last_Name.length > 100) {
            leadData.Last_Name = leadData.Last_Name.substring(0, 100);
          }

          const accessToken = await ensureValidToken(userId, 'zoho');
          const url = `https://www.zohoapis.com/crm/v2/Leads`;
          const headers = {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          };

          const body = { data: [leadData] };
          const resp = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          });

          if (!resp.ok) {
            const errorText = await resp.text();
            logger.error('Zoho API error response:', errorText);
            throw new Error(`Zoho API error: ${resp.statusText} - ${errorText}`);
          }

          const data = await resp.json();
          logger.info('Zoho API response:', data);

          if (data?.data?.[0]) {
            const record = data.data[0];
            if (record.code === 'SUCCESS') {
              return JSON.stringify({
                id: record.details.id,
                status: record.code,
                message: record.message || 'Lead created successfully',
              });
            } else {
              throw new Error(`Zoho CRM error: ${record.message || 'Unknown error'}`);
            }
          }
          throw new Error('Invalid response from Zoho CRM');
        } catch (error) {
          logger.error('Error creating Zoho lead:', error);
          throw error;
        }
      },
    }),
  ];
}

export const LEAD_AGENT_PROMPT = `You are a smart AI agent that processes leads by extracting information and creating them in Zoho CRM.

Your tools:
- validateEmail: Check if an email is valid
- formatName: Extract and split name from text into first/last
- cleanPhoneNumber: Format phone numbers
- extractCompanyName: Get company name from text
- createZohoLead: Create the lead in Zoho CRM

IMPORTANT: Follow these steps in order for any input message:

1. First, use formatName to extract and split any name from the message
2. If an email is found, use validateEmail to ensure it's valid
3. If a phone number is found, use cleanPhoneNumber to format it
4. Use extractCompanyName to get company info, or default to "Individual"
5. Finally, create a Zoho lead using the format below:
   - First_Name: first name (if found, else empty string)
   - Last_Name: last name (if found, else "Unknown")
   - Email: validated email (if found, else empty string)
   - Phone: cleaned phone number (if found, else empty string)
   - Company: extracted company name (or "Individual")
   - Description: always include the original message here

When creating the lead, make sure to structure the data exactly as required by the createZohoLead function and convert it to a proper JSON string.

The agent should process any incoming message and attempt to extract as much information as possible, using reasonable defaults for missing fields.`;
