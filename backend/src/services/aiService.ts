import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createLeadTools } from '../utils/agentTools.js';

const LEAD_PROCESSING_PROMPT = `You are a lead processing assistant that extracts contact information and creates leads in Zoho CRM.

Your job is to:
1. Extract contact information (name, email, phone, company) from the user's message
2. Validate and format the extracted data
3. Create a lead in Zoho CRM with the processed information

Follow these steps in order:
1. Use formatName to extract first and last name from the message
2. If you find an email, use validateEmail to check if it's valid
3. If you find a phone number, use cleanPhoneNumber to format it
4. Use extractCompanyName to identify the company, or use "Individual" as default
5. Finally, use createZohoLead with the collected information

IMPORTANT: Always include the original message in the Description field when creating the lead.

Be thorough in extracting information but use reasonable defaults for missing data:
- If no first name is found, use empty string
- If no last name is found, use "Unknown"
- If no email/phone is found, use empty string
- If no company is found, use "Individual"

The lead must have at least one form of contact (name, email, or phone) to be valid.`;

export async function parseLeadWithLangChain(message: string, userId: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    throw new Error('Missing GOOGLE_API_KEY in environment variables');
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      maxOutputTokens: 4096,
      temperature: 0,
      apiKey: GOOGLE_API_KEY,
    });

    const tools = createLeadTools(userId);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', LEAD_PROCESSING_PROMPT],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = createToolCallingAgent({
      llm: model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: false,
      maxIterations: 10,
      returnIntermediateSteps: true,
    });

    const result = await agentExecutor.invoke({
      input: message,
    });

    if (result.output) {
      let finalResult;
      try {
        finalResult = JSON.parse(result.output);
      } catch {
        finalResult = {
          status: 'SUCCESS',
          message: result.output,
        };
      }

      return {
        status: 'SUCCESS',
        ...finalResult,
        intermediateSteps: result.intermediateSteps,
      };
    } else {
      throw new Error('No output received from agent');
    }
  } catch (error: any) {
    throw new Error(`Failed to process lead with LangChain: ${error.message}`);
  }
}

export async function parseLead(message: string, userId: string): Promise<any> {
  try {
    return await parseLeadWithLangChain(message, userId);
  } catch (agentError: any) {
    throw new Error(`Failed to process lead: ${agentError.message}`);
  }
}
