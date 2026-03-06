import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import * as fs from 'fs';
import * as path from 'path';

// Load Plaid config from file
function loadPlaidConfig(): { client_id: string; secret: string; environment: string } {
  const configPath = path.join(process.cwd(), '..', 'config', 'plaid.json');
  const workspaceConfigPath = '/Users/solomonmoltbot/.openclaw/workspace/config/plaid.json';
  
  let configFile = workspaceConfigPath;
  if (fs.existsSync(configPath)) {
    configFile = configPath;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    return config;
  } catch (error) {
    console.error('Failed to load Plaid config:', error);
    return {
      client_id: process.env.PLAID_CLIENT_ID || '',
      secret: process.env.PLAID_SECRET || '',
      environment: process.env.PLAID_ENV || 'sandbox',
    };
  }
}

const plaidConfig = loadPlaidConfig();

// Map environment string to Plaid environment URL
const envMap: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production: PlaidEnvironments.production,
};

const configuration = new Configuration({
  basePath: envMap[plaidConfig.environment] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': plaidConfig.client_id,
      'PLAID-SECRET': plaidConfig.secret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Re-export useful types and constants
export { Products, CountryCode };

// Helper to check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return (
    plaidConfig.client_id !== 'PLAID_CLIENT_ID_PLACEHOLDER' &&
    plaidConfig.secret !== 'PLAID_SANDBOX_SECRET_PLACEHOLDER' &&
    plaidConfig.client_id.length > 0 &&
    plaidConfig.secret.length > 0
  );
}

// Default products to request
export const DEFAULT_PRODUCTS: Products[] = [
  Products.Transactions,
  Products.Auth,
];

// Default country codes
export const DEFAULT_COUNTRY_CODES: CountryCode[] = [
  CountryCode.Us,
];
