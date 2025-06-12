import { logger } from '../utils/logger.js';
import { ensureValidToken } from '../utils/tokenRefresher.js';

interface ZohoPayload {
  [key: string]: any;
}

interface ZohoResponse {
  id: string;
  status: string;
  message: string;
  raw?: any;
}

/**
 * Service level functions for CRM operations - mostly used by agent tools
 */
export async function getValidZohoToken(userId: string): Promise<string> {
  return ensureValidToken(userId, 'zoho');
}

export async function zohoApiCall<T>(
  path: string,
  method: string,
  data: any,
  accessToken: string,
): Promise<T> {
  const url = `https://www.zohoapis.com/crm/v2/${path}`;
  const headers = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Zoho API error:', error);
      throw new Error(`Zoho API error: ${error.message || response.statusText}`);
    }

    return response.json();
  } catch (error) {
    logger.error(`Zoho API call failed for ${path}:`, error);
    throw error;
  }
}

export async function createLead(
  leadData: ZohoPayload,
  accessToken: string,
): Promise<ZohoResponse> {
  const response = await zohoApiCall<any>('Leads', 'POST', { data: [leadData] }, accessToken);

  if (response?.data?.[0]) {
    const record = response.data[0];
    return {
      id: record.details.id,
      status: record.status.toUpperCase(),
      message: record.message,
      raw: record,
    };
  }

  throw new Error('Zoho CRM did not return expected response');
}

export default {
  createLead,
  getValidZohoToken,
  zohoApiCall,
};
