import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ensureValidToken } from '../utils/tokenRefresher.js';
import { logger } from './logger.js';

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
        'Formats a full name into first and last name. Returns JSON with firstName and lastName.',
      schema: z.object({
        input: z.string().describe('Full name to format'),
      }),
      func: async ({ input }) => {
        const parts = input.trim().split(' ');
        return JSON.stringify({
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || 'Unknown',
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
        const companyIndicators = ['at', 'for', 'with', 'from'];
        for (const indicator of companyIndicators) {
          const match = input.match(new RegExp(`${indicator} ([A-Z][A-Za-z0-9 ]+)`));
          if (match) return match[1];
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
            throw new Error(`Zoho API error: ${resp.statusText}`);
          }

          const data = await resp.json();
          if (data?.data?.[0]) {
            const record = data.data[0];
            return JSON.stringify({
              id: record.details.id,
              status: record.status.toUpperCase(),
              message: record.message,
            });
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

export const LEAD_AGENT_PROMPT =
  `You are a smart AI agent that processes leads by extracting information and creating them in Zoho CRM.

Your tools:
- validateEmail: Check if an email is valid
- formatName: Split full name into first/last
- cleanPhoneNumber: Format phone numbers
- extractCompanyName: Get company name from text
- createZohoLead: Create the lead in Zoho CRM

IMPORTANT: Follow these steps in order for any input message:

1. First, use formatName to split any full name into first and last name
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

The agent should process any incoming message and attempt to extract as much information as possible, using reasonable defaults for missing fields.`
    .replace(/{/g, '{{')
    .replace(/}/g, '}}');
