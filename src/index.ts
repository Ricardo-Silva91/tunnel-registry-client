import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

interface Config {
  sheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
  worksheet: string;
}

function getConfig(): Config {
  const sheetId = process.env.TUNNEL_REGISTRY_SHEET_ID;
  const serviceAccountEmail = process.env.TUNNEL_REGISTRY_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.TUNNEL_REGISTRY_PRIVATE_KEY;
  const worksheet = process.env.TUNNEL_REGISTRY_WORKSHEET ?? 'Tunnels';

  const missing: string[] = [];
  if (!sheetId) missing.push('TUNNEL_REGISTRY_SHEET_ID');
  if (!serviceAccountEmail) missing.push('TUNNEL_REGISTRY_SERVICE_ACCOUNT_EMAIL');
  if (!privateKey) missing.push('TUNNEL_REGISTRY_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `tunnel-registry-client: missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    sheetId: sheetId!,
    serviceAccountEmail: serviceAccountEmail!,
    // support both raw newlines and \n-escaped strings
    privateKey: privateKey!.replace(/\\n/g, '\n'),
    worksheet,
  };
}

async function loadSheet(config: Config) {
  const auth = new JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const doc = new GoogleSpreadsheet(config.sheetId, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[config.worksheet];
  if (!sheet) {
    throw new Error(
      `tunnel-registry-client: worksheet "${config.worksheet}" not found in spreadsheet`
    );
  }

  return sheet;
}

export async function getTunnelUrl(serviceName: string): Promise<string | null> {
  const config = getConfig();
  const sheet = await loadSheet(config);
  const rows = await sheet.getRows();

  for (const row of rows) {
    if (row.get('Service') === serviceName) {
      const url = row.get('URL') as string | undefined;
      return url || null;
    }
  }

  return null;
}

export async function getAllTunnels(): Promise<Record<string, string>> {
  const config = getConfig();
  const sheet = await loadSheet(config);
  const rows = await sheet.getRows();

  const result: Record<string, string> = {};
  for (const row of rows) {
    const service = row.get('Service') as string | undefined;
    const url = row.get('URL') as string | undefined;
    if (service && url) {
      result[service] = url;
    }
  }

  return result;
}
