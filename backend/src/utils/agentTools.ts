import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ensureValidToken } from '../utils/tokenRefresher.js';
import logger from './logger.js';

export function createLeadTools(userId: string) {
  if (!userId?.trim()) {
    throw new Error('User ID is required to create lead tools');
  }

  return [
    new DynamicStructuredTool({
      name: 'validateEmail',
      description: 'Validates if an email address has correct format. Returns true/false.',
      schema: z.object({
        input: z.string().min(1, 'Email input cannot be empty').describe('Email address to validate'),
      }),
      func: async ({ input }) => {
        try {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(input.trim());
          logger.debug(`Email validation for "${input}": ${isValid}`);
          return isValid.toString();
        } catch (error) {
          logger.error('Error validating email:', error);
          return 'false';
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'formatName',
      description: 'Formats a full name or extracts name from text into first and last name. Returns JSON with firstName and lastName.',
      schema: z.object({
        input: z.string().min(1, 'Name input cannot be empty').describe('Full name or text containing a name to format'),
      }),
      func: async ({ input }) => {
        try {
          const namePatterns = [
            /my name is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
            /i am ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
            /i'm ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
            /this is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
            /^([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
          ];

          let fullName = '';
          const trimmedInput = input.trim();

          for (const pattern of namePatterns) {
            const match = trimmedInput.match(pattern);
            if (match && match[1]) {
              fullName = match[1].trim();
              break;
            }
          }

          if (!fullName) {
            const words = trimmedInput.split(/\s+/);
            if (words.length <= 3 && words.every((word) => /^[A-Za-z]+$/.test(word))) {
              fullName = trimmedInput;
            }
          }

          if (fullName) {
            const parts = fullName.split(/\s+/);
            const result = {
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' ') || 'Unknown',
            };
            logger.debug(`Name formatting result:`, result);
            return JSON.stringify(result);
          }

          const fallbackResult = {
            firstName: '',
            lastName: 'Unknown',
          };
          logger.debug(`Name formatting fallback result:`, fallbackResult);
          return JSON.stringify(fallbackResult);
        } catch (error) {
          logger.error('Error formatting name:', error);
          return JSON.stringify({ firstName: '', lastName: 'Unknown' });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'cleanPhoneNumber',
      description: 'Cleans and formats a phone number. Returns cleaned number.',
      schema: z.object({
        input: z.string().min(1, 'Phone input cannot be empty').describe('Phone number to clean'),
      }),
      func: async ({ input }) => {
        try {
          const cleaned = input.replace(/[^0-9+]/g, '');
          logger.debug(`Phone cleaning: "${input}" -> "${cleaned}"`);
          return cleaned;
        } catch (error) {
          logger.error('Error cleaning phone number:', error);
          return '';
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'extractCompanyName',
      description: 'Extracts company name from text. Returns extracted company or "Individual".',
      schema: z.object({
        input: z.string().min(1, 'Company input cannot be empty').describe('Text to extract company name from'),
      }),
      func: async ({ input }) => {
        try {
          const companyIndicators = [
            /(?:work\s+(?:at|for|with)|employed\s+(?:at|by)|company\s+is)\s+([A-Z][A-Za-z0-9\s&.,'-]+)/i,
            /(?:at|for|with|from)\s+([A-Z][A-Za-z0-9\s&.,'-]+)(?:\s+(?:company|corp|inc|ltd|llc))/i,
            /([A-Z][A-Za-z0-9\s&.,'-]+)(?:\s+(?:company|corp|inc|ltd|llc))/i,
          ];

          const trimmedInput = input.trim();

          for (const pattern of companyIndicators) {
            const match = trimmedInput.match(pattern);
            if (match && match[1]) {
              const company = match[1].trim();
              logger.debug(`Company extraction: "${company}"`);
              return company;
            }
          }

          const simpleMatch = trimmedInput.match(/(?:at|for|with)\s+([A-Z][A-Za-z0-9\s]+)/i);
          if (simpleMatch && simpleMatch[1]) {
            const company = simpleMatch[1].trim();
            if (company.length <= 50 && /^[A-Z]/.test(company)) {
              logger.debug(`Simple company extraction: "${company}"`);
              return company;
            }
          }

          logger.debug('No company found, returning "Individual"');
          return 'Individual';
        } catch (error) {
          logger.error('Error extracting company name:', error);
          return 'Individual';
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'createZohoLead',
      description: 'Creates a new lead in Zoho CRM. Returns success/failure response.',
      schema: z.object({
        input: z
          .string()
          .min(1, 'Lead data cannot be empty')
          .describe('JSON string containing lead data with First_Name, Last_Name, Email, Phone, Company, and Description fields'),
      }),
      func: async ({ input }) => {
        try {
          let leadData;
          try {
            leadData = JSON.parse(input);
          } catch (parseError) {
            logger.error('Invalid JSON input for createZohoLead:', parseError);
            throw new Error('Invalid JSON format for lead data');
          }

          // Validate required fields
          if (!leadData.First_Name && !leadData.Email && !leadData.Phone) {
            throw new Error('Lead must have at least a name, email, or phone number');
          }

          // Sanitize data
          if (leadData.Last_Name && leadData.Last_Name.length > 100) {
            leadData.Last_Name = leadData.Last_Name.substring(0, 100);
          }

          if (leadData.Description && leadData.Description.length > 1000) {
            leadData.Description = leadData.Description.substring(0, 1000);
          }

          logger.info(`Creating Zoho lead for user ${userId}:`, {
            hasName: !!leadData.First_Name,
            hasEmail: !!leadData.Email,
            hasPhone: !!leadData.Phone,
            company: leadData.Company
          });

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
            logger.error(`Zoho API error: ${resp.status} ${resp.statusText} - ${errorText}`);
            throw new Error(`Zoho API error: ${resp.statusText} - ${errorText}`);
          }

          const data = await resp.json();

          if (data?.data?.[0]) {
            const record = data.data[0];
            if (record.code === 'SUCCESS') {
              const result = {
                id: record.details.id,
                status: record.code,
                message: record.message || 'Lead created successfully',
              };
              logger.info(`Successfully created Zoho lead:`, result);
              return JSON.stringify(result);
            } else {
              logger.error(`Zoho CRM error:`, record);
              throw new Error(`Zoho CRM error: ${record.message || 'Unknown error'}`);
            }
          }
          
          logger.error('Invalid response from Zoho CRM:', data);
          throw new Error('Invalid response from Zoho CRM');
        } catch (error) {
          logger.error(`Error creating Zoho lead for user ${userId}:`, error);
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
