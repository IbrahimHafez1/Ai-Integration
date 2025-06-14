import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createLeadTools } from '../utils/agentTools.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

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
  if (!config.google.apiKey) {
    logger.error('Missing GOOGLE_API_KEY in environment variables');
    throw new Error('Missing GOOGLE_API_KEY in environment variables');
  }

  // Input validation
  if (!message?.trim()) {
    logger.warn(`Empty message provided for user ${userId}`);
    throw new Error('Message cannot be empty');
  }

  if (!userId?.trim()) {
    logger.warn('Empty userId provided');
    throw new Error('User ID is required');
  }

  logger.info(`Processing lead for user ${userId}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      maxOutputTokens: 4096,
      temperature: 0.1,
      apiKey: config.google.apiKey,
    });

    const tools = createLeadTools(userId);
    logger.info(`Created ${tools.length} tools for user ${userId}`);

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
      verbose: config.nodeEnv === 'development',
      maxIterations: 15,
      returnIntermediateSteps: true,
      earlyStoppingMethod: 'generate',
    });

    const startTime = Date.now();
    const result = await agentExecutor.invoke({
      input: message,
    });
    const processingTime = Date.now() - startTime;

    logger.info(`Agent processing completed in ${processingTime}ms for user ${userId}`);

    if (!result?.output) {
      logger.error(`No output received from agent for user ${userId}`);
      throw new Error('No output received from agent');
    }

    let finalResult;
    try {
      finalResult = JSON.parse(result.output);
      logger.info(`Successfully parsed JSON output for user ${userId}`);
    } catch (parseError) {
      logger.warn(`Failed to parse JSON output for user ${userId}, attempting text analysis`, { error: parseError });
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

    const response = {
      status: finalResult.status || 'SUCCESS',
      ...finalResult,
      intermediateSteps: result.intermediateSteps,
      toolsUsed: extractToolsUsed(result.intermediateSteps),
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Lead processing completed successfully for user ${userId}`, {
      status: response.status,
      toolsUsed: response.toolsUsed,
      processingTime: processingTime
    });

    return response;

  } catch (error: any) {
    logger.error(`Dynamic agent processing error for user ${userId}:`, {
      error: error.message,
      stack: error.stack,
      message: message.substring(0, 100)
    });
    
    throw new Error(`Failed to process lead with dynamic agent: ${error.message}`);
  }
}

function extractToolsUsed(intermediateSteps: any[]): string[] {
  if (!Array.isArray(intermediateSteps)) {
    return [];
  }

  const toolsUsed = new Set<string>();

  intermediateSteps.forEach((step) => {
    try {
      if (step && typeof step === 'object' && step.action && step.action.tool) {
        toolsUsed.add(step.action.tool);
      }
    } catch (error) {
      logger.warn('Error extracting tool name from step:', error);
    }
  });

  return Array.from(toolsUsed);
}

export async function parseLead(message: string, userId: string): Promise<any> {
  try {
    return await parseLeadWithDynamicAgent(message, userId);
  } catch (agentError: any) {
    logger.error(`Lead processing failed for user ${userId}:`, {
      error: agentError.message,
      stack: agentError.stack
    });
    throw new Error(`Failed to process lead: ${agentError.message}`);
  }
}
