import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor, createStructuredChatAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createLeadTools, LEAD_AGENT_PROMPT } from '../utils/agentTools.js';
import logger from '../utils/logger.js';

// Create a helper function to safely format JSON examples
function createStrictOutputInstructions() {
  const toolExample = JSON.stringify({ action: 'tool_name', action_input: { key: 'value' } });
  const finalExample = JSON.stringify({
    action: 'Final Answer',
    action_input: { result: 'value' },
  });

  return `
STRICT OUTPUT FORMAT RULES:
1. For tool calls, output ONLY the JSON structure: ${toolExample}
2. For final answers, output ONLY: ${finalExample}
3. Always use double quotes for JSON properties
4. Never add any explanations or markdown code blocks`;
}

function sanitizeForTemplate(text: string): string {
  return text
    .replace(/\{/g, '(') // Replace { with (
    .replace(/\}/g, ')') // Replace } with )
    .replace(/\$/g, 'USD') // Replace $ with USD to prevent template variable issues
    .replace(/`/g, "'") // Replace backticks
    .trim();
}

// Optimized JSON extraction function
function extractJsonFromText(text: string): any {
  logger.info('Extracting JSON from text:', text);

  // Strategy 1: Find first complete JSON object
  try {
    const match = text.match(/\{[^{}]*\}/);
    if (match) {
      const candidate = match[0];
      logger.info('Found JSON candidate:', candidate);
      const parsed = JSON.parse(candidate);
      logger.info('Successfully parsed JSON:', parsed);
      return parsed;
    }
  } catch (error) {
    logger.warn('Strategy 1 failed, trying fallback:', error);
  }

  // Strategy 2: Try balanced brace counting for nested objects
  try {
    let braceCount = 0;
    let startIndex = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (braceCount === 0) startIndex = i;
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          const candidate = text.substring(startIndex, i + 1);
          const parsed = JSON.parse(candidate);
          logger.info('Fallback strategy extracted JSON:', parsed);
          return parsed;
        }
      }
    }
  } catch (error) {
    logger.warn('Fallback strategy failed:', error);
  }

  return null;
}

// Improved name extraction function
function extractNameFromText(text: string): { firstName: string; lastName: string } {
  // Common patterns to identify names in lead messages
  const namePatterns = [
    /my name is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
    /i am ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
    /i'm ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
    /this is ([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
    /^([A-Za-z]+(?:\s+[A-Za-z]+)*)/i, // Name at the beginning
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const fullName = match[1].trim();
      const parts = fullName.split(/\s+/);

      if (parts.length >= 2) {
        return {
          firstName: parts[0],
          lastName: parts.slice(1).join(' '),
        };
      } else if (parts.length === 1) {
        return {
          firstName: parts[0],
          lastName: 'Unknown',
        };
      }
    }
  }

  // Fallback: no clear name pattern found
  return {
    firstName: '',
    lastName: 'Unknown',
  };
}

async function processLeadDirectly(message: string, userId: string): Promise<any> {
  const tools = createLeadTools(userId);

  try {
    const nameData = extractNameFromText(message);

    const emailMatch = message.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    let validEmail = '';
    if (emailMatch) {
      const isValid = await tools
        .find((t) => t.name === 'validateEmail')
        ?.func({ input: emailMatch[0] });
      if (isValid === 'true') {
        validEmail = emailMatch[0];
      }
    }

    const phoneMatch = message.match(/[\+]?[\d\s\-\(\)]{10,}/);
    let cleanPhone = '';
    if (phoneMatch) {
      cleanPhone =
        (await tools.find((t) => t.name === 'cleanPhoneNumber')?.func({ input: phoneMatch[0] })) ||
        '';
    }

    const company =
      (await tools.find((t) => t.name === 'extractCompanyName')?.func({ input: message })) ||
      'Individual';

    const leadData = {
      First_Name: nameData.firstName || '',
      Last_Name: nameData.lastName || 'Unknown',
      Email: validEmail,
      Phone: cleanPhone,
      Company: company,
      Description: message,
    };

    if (!leadData.First_Name && !leadData.Email && !leadData.Phone) {
      throw new Error('No valid contact information found in message');
    }

    logger.info('Creating lead with data:', leadData);

    const createResult = await tools
      .find((t) => t.name === 'createZohoLead')
      ?.func({
        input: JSON.stringify(leadData),
      });

    if (createResult) {
      const result = JSON.parse(createResult);
      logger.info('Lead created successfully:', result);
      return {
        status: 'SUCCESS',
        id: result.id,
        message: result.message || 'Lead created successfully',
      };
    } else {
      throw new Error('Failed to create lead in Zoho');
    }
  } catch (error: any) {
    logger.error('Direct processing failed:', error);
    throw error;
  }
}

export async function parseLead(message: string, userId: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_API_KEY in .env');

  try {
    logger.info('Processing lead directly without LangChain agent framework');
    return await processLeadDirectly(message, userId);
  } catch (directError: any) {
    logger.warn('Direct processing failed, trying LangChain agent:', directError);

    try {
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash',
        maxOutputTokens: 2048,
        temperature: 0.1,
        apiKey: GOOGLE_API_KEY,
      });

      const tools = createLeadTools(userId);
      const sanitizedMessage = sanitizeForTemplate(message);

      const systemPrompt = `${LEAD_AGENT_PROMPT}

${createStrictOutputInstructions()}

TOOLS: ${tools.map((t) => `${t.name} - ${t.description}`).join(', ')}

LEAD MESSAGE: ${sanitizedMessage}`;

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('agent_scratchpad'),
      ]);

      const agent = await createStructuredChatAgent({
        llm: model,
        tools,
        prompt,
      });

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: true,
      });

      const result = await agentExecutor.invoke({
        input: '',
        agent_scratchpad: [],
      });

      if (!result.output) {
        throw new Error('No output from agent');
      }

      let parsedOutput;
      const outputStr = String(result.output);

      try {
        parsedOutput = JSON.parse(outputStr);
      } catch {
        parsedOutput = extractJsonFromText(outputStr);
        if (!parsedOutput) {
          throw new Error(`No valid JSON found in agent output: ${outputStr}`);
        }
      }

      return {
        status: 'SUCCESS',
        ...parsedOutput,
      };
    } catch (agentError: any) {
      logger.error('Both direct and agent processing failed:', agentError);
      throw new Error(`Failed to process lead: ${agentError.message}`);
    }
  }
}
