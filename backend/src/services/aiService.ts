import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createLeadTools } from '../utils/agentTools.js';

const DYNAMIC_LEAD_PROCESSING_PROMPT = `You are an intelligent lead processing assistant that can dynamically analyze messages and create leads in Zoho CRM.

You have access to these tools:
- validateEmail: Check if an email address is valid
- formatName: Extract and format names from text
- cleanPhoneNumber: Clean and format phone numbers  
- extractCompanyName: Extract company information from text
- createZohoLead: Create a lead record in Zoho CRM

Your goal is to extract contact information from user messages and create a lead in Zoho CRM. 

IMPORTANT GUIDELINES:
- Analyze the message and decide which tools you need to use based on what information is present
- You don't need to use every tool - only use the ones that are relevant to the data you find
- Extract as much relevant information as possible from the message
- Always include the original message in the Description field when creating the lead
- A lead must have at least one form of contact information (name, email, or phone number)
- Use reasonable defaults for missing information:
  * First_Name: extracted first name or empty string if not found
  * Last_Name: extracted last name or "Unknown" if no last name found
  * Email: validated email or empty string if none found
  * Phone: cleaned phone number or empty string if none found  
  * Company: extracted company name or "Individual" if none found
  * Description: always include the original user message

Be smart about your approach - if you see an email, validate it. If you see a phone number, clean it. If you see company information, extract it. Then create the lead with all the processed information.

Focus on creating a successful lead record rather than following a rigid process.`;

export async function parseLeadWithDynamicAgent(message: string, userId: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    throw new Error('Missing GOOGLE_API_KEY in environment variables');
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      maxOutputTokens: 4096,
      temperature: 0.1,
      apiKey: GOOGLE_API_KEY,
    });

    const tools = createLeadTools(userId);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', DYNAMIC_LEAD_PROCESSING_PROMPT],
      ['human', 'Process this message and create a lead: {input}'],
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
      maxIterations: 15,
      returnIntermediateSteps: true,
      earlyStoppingMethod: 'generate',
    });

    const result = await agentExecutor.invoke({
      input: message,
    });

    if (result.output) {
      let finalResult;

      try {
        finalResult = JSON.parse(result.output);
      } catch {
        const outputLower = result.output.toLowerCase();
        if (outputLower.includes('success') || outputLower.includes('created')) {
          finalResult = {
            status: 'SUCCESS',
            message: result.output,
          };
        } else {
          finalResult = {
            status: 'ERROR',
            message: result.output,
          };
        }
      }

      return {
        status: finalResult.status || 'SUCCESS',
        ...finalResult,
        intermediateSteps: result.intermediateSteps,
        toolsUsed: extractToolsUsed(result.intermediateSteps),
      };
    } else {
      throw new Error('No output received from agent');
    }
  } catch (error: any) {
    console.error('Dynamic agent processing error:', error);
    throw new Error(`Failed to process lead with dynamic agent: ${error.message}`);
  }
}

function extractToolsUsed(intermediateSteps: any[]): string[] {
  const toolsUsed = new Set<string>();

  if (Array.isArray(intermediateSteps)) {
    intermediateSteps.forEach((step) => {
      if (step && typeof step === 'object' && step.action && step.action.tool) {
        toolsUsed.add(step.action.tool);
      }
    });
  }

  return Array.from(toolsUsed);
}

export async function parseLead(message: string, userId: string): Promise<any> {
  try {
    return await parseLeadWithDynamicAgent(message, userId);
  } catch (agentError: any) {
    console.error('Lead processing failed:', agentError);
    throw new Error(`Failed to process lead: ${agentError.message}`);
  }
}
