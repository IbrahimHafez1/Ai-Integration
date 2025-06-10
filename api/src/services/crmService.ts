import axios from 'axios';

interface ZohoPayload {
  [key: string]: any;
}

export async function createLead(leadData: ZohoPayload, accessToken: string) {
  const url = `https://www.zohoapis.com/crm/v2/Leads`;
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
