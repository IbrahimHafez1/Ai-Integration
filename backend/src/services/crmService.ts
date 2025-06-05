import axios from 'axios';

interface ZohoAuthConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function getZohoToken(config: ZohoAuthConfig): Promise<string> {
  // Call Zoho’s token endpoint with grant_type=refresh_token
  const resp = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
    params: {
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    },
  });
  if (resp.data && resp.data.access_token) {
    // Optionally, store new `expires_in` somewhere if you want to track expiry
    return resp.data.access_token;
  }
  throw new Error('Failed to get Zoho access token');
}

interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  orgId: string;
  module: string; // "Leads", "Contacts", etc.
}

interface ZohoPayload {
  [key: string]: any; // e.g. { Last_Name: 'Doe', First_Name: 'John', Email: 'john@example.com', ... }
}

export async function createLead(leadData: ZohoPayload) {
  // 1. Get a fresh access token (auto‐refresh if expired)
  const accessToken = await getZohoToken({
    clientId: process.env.ZOHO_CLIENT_ID!,
    clientSecret: process.env.ZOHO_CLIENT_SECRET!,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
  });

  // 2. Call Zoho CRM create record endpoint
  const url = `https://www.zohoapis.com/crm/v2/Leads}`;
  const headers = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const body = { data: [leadData] };

  const resp = await axios.post(url, body, { headers });

  if (resp.data && resp.data.data && resp.data.data.length > 0) {
    const record = resp.data.data[0];
    return {
      id: record.details.id,
      status: record.status.toUpperCase(),
      message: record.message,
      raw: record,
    };
  }

  throw new Error('Zoho CRM did not return expected response');
}

export default { createLead };
