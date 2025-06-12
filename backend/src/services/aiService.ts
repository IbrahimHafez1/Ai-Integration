import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor, createStructuredChatAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createLeadTools, LEAD_AGENT_PROMPT } from '../utils/agentTools.js';
import { logger } from '../utils/logger.js';

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

// Function to properly escape curly braces for LangChain templates
function escapeCurlyBraces(text: string): string {
  // Double all curly braces to escape them in LangChain templates
  return text.replace(/\{/g, '{{').replace(/\}/g, '}}');
}

// Optimized JSON extraction function - using strategy 1 as primary
function extractJsonFromText(text: string): any {
  logger.info('Extracting JSON from text:', text);

  // Strategy 1: Find first complete JSON object (this is the one that works)
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

  // Fallback: Try balanced brace counting for nested objects
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

export async function parseLead(message: string, userId: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) throw new Error('Missing GOOGLE_API_KEY in .env');

  try {
    // Initialize Gemini model
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      maxOutputTokens: 2048,
      temperature: 0.1,
      apiKey: GOOGLE_API_KEY,
    });

    // Create tools with user context
    const tools = createLeadTools(userId);

    // Properly escape the message to prevent template issues
    const escapedMessage = escapeCurlyBraces(message);

    // Build the full prompt string without using template variables
    const toolNames = tools.map((tool) => tool.name).join(', ');
    const toolDetails = tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');

    const fullPrompt = `${LEAD_AGENT_PROMPT}

${createStrictOutputInstructions()}

TOOLS AVAILABLE: ${toolNames}

TOOL DETAILS:
${toolDetails}

LEAD MESSAGE TO PROCESS:
${escapedMessage}`;

    // Create a simple prompt template that doesn't use any template variables
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', fullPrompt],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create the structured chat agent
    const agent = await createStructuredChatAgent({
      llm: model,
      tools,
      prompt,
    });

    // Create the executor
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });

    // Run the agent with minimal input
    const result = await agentExecutor.invoke({
      input: '',
      agent_scratchpad: [],
    });

    logger.info('Lead processing result:', result);

    if (!result.output) {
      throw new Error('No output from agent');
    }

    // Robust JSON extraction with improved parsing
    let parsedOutput;
    const outputStr = String(result.output);

    try {
      // First try direct parsing
      parsedOutput = JSON.parse(outputStr);
    } catch (parseError) {
      logger.warn('Direct JSON parsing failed, attempting extraction:', parseError);

      // Try to extract JSON from the output
      parsedOutput = extractJsonFromText(outputStr);
      if (!parsedOutput) {
        throw new Error(`No valid JSON found in agent output: ${outputStr}`);
      }
    }

    return {
      status: 'SUCCESS',
      ...parsedOutput,
    };
  } catch (error: any) {
    logger.error('Agent execution error:', error);

    // If it's a template error, try a fallback approach
    if (error.message && error.message.includes('template')) {
      logger.warn('Template error detected, attempting fallback processing');

      try {
        // Fallback: Use the model directly without the agent framework
        const model = new ChatGoogleGenerativeAI({
          model: 'gemini-1.5-flash',
          maxOutputTokens: 2048,
          temperature: 0.1,
          apiKey: process.env.GOOGLE_API_KEY,
        });

        const tools = createLeadTools(userId);
        const toolNames = tools.map((tool) => tool.name).join(', ');
        const toolDetails = tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');

        const fallbackPrompt = `${LEAD_AGENT_PROMPT}

${createStrictOutputInstructions()}

TOOLS AVAILABLE: ${toolNames}

TOOL DETAILS:
${toolDetails}

LEAD MESSAGE TO PROCESS:
${message}

Please process this lead message and respond with the appropriate JSON format.`;

        const response = await model.invoke(fallbackPrompt);

        // Try to parse the response with improved extraction
        let parsedOutput;
        const outputStr = String(response.content);

        try {
          // First try direct parsing
          parsedOutput = JSON.parse(outputStr);
        } catch {
          // Try extraction
          parsedOutput = extractJsonFromText(outputStr);
          if (!parsedOutput) {
            throw new Error(`Could not extract valid JSON from fallback response: ${outputStr}`);
          }
        }

        return {
          status: 'SUCCESS',
          ...parsedOutput,
        };
      } catch (fallbackError: any) {
        logger.error('Fallback processing also failed:', fallbackError);
        throw new Error(`Both primary and fallback processing failed: ${fallbackError.message}`);
      }
    }

    throw new Error(`Failed to process lead: ${error.message}`);
  }
}
