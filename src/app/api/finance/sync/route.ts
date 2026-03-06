import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import * as fs from 'fs';
import * as path from 'path';

// Workspace paths
const WORKSPACE = process.env.HOME ? path.join(process.env.HOME, '.openclaw/workspace') : '/Users/solomonmoltbot/.openclaw/workspace';
const CONFIG_PATH = path.join(WORKSPACE, 'config');

// Load configuration
function loadConfig() {
  const sheetsConfigPath = path.join(CONFIG_PATH, 'plaid-sheets.json');
  const plaidCredentialsPath = path.join(CONFIG_PATH, 'plaid-credentials.json');
  
  const sheetsConfig = JSON.parse(fs.readFileSync(sheetsConfigPath, 'utf8'));
  
  let plaidCredentials = null;
  if (fs.existsSync(plaidCredentialsPath)) {
    plaidCredentials = JSON.parse(fs.readFileSync(plaidCredentialsPath, 'utf8'));
  }
  
  return { sheetsConfig, plaidCredentials };
}

// Initialize Google Sheets
async function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    keyFile: path.join(CONFIG_PATH, 'google-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    clientOptions: {
      subject: 'solomon@multiplyinc.com'
    }
  });
}

// Initialize Plaid
function getPlaidClient(credentials: { client_id: string; secret: string; environment?: string }) {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[credentials.environment || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': credentials.client_id,
        'PLAID-SECRET': credentials.secret,
      },
    },
  });
  
  return new PlaidApi(configuration);
}

// Determine entity for an account
function getEntityForAccount(account: { name?: string | null; official_name?: string | null }, accessTokenEntity?: string): string {
  if (accessTokenEntity) return accessTokenEntity;
  
  const name = (account.name || '').toLowerCase();
  const officialName = (account.official_name || '').toLowerCase();
  
  if (name.includes('multiply') || officialName.includes('multiply')) return 'multiply_inc';
  if (name.includes('cashflow') || officialName.includes('cashflow empire')) return 'cashflow_empire';
  
  return 'personal';
}

interface TokenConfig {
  access_token: string;
  institution?: string;
  entity?: string;
}

// Fetch accounts from Plaid
async function fetchAccounts(plaidClient: PlaidApi, accessTokens: TokenConfig[]) {
  const allAccounts: unknown[] = [];
  
  for (const tokenConfig of accessTokens) {
    try {
      const response = await plaidClient.accountsBalanceGet({
        access_token: tokenConfig.access_token
      });
      
      for (const account of response.data.accounts) {
        allAccounts.push({
          ...account,
          _entity: getEntityForAccount(account, tokenConfig.entity),
          _institution: tokenConfig.institution || 'Unknown'
        });
      }
    } catch (error) {
      console.error(`Error fetching accounts for ${tokenConfig.institution || 'unknown'}:`, error);
    }
  }
  
  return allAccounts;
}

// Fetch transactions from Plaid
async function fetchTransactions(plaidClient: PlaidApi, accessTokens: TokenConfig[], days: number = 30) {
  const allTransactions: unknown[] = [];
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  for (const tokenConfig of accessTokens) {
    try {
      const response = await plaidClient.transactionsGet({
        access_token: tokenConfig.access_token,
        start_date: startDate,
        end_date: endDate
      });
      
      for (const txn of response.data.transactions) {
        allTransactions.push({
          ...txn,
          _entity: getEntityForAccount({ name: txn.name }, tokenConfig.entity),
          _institution: tokenConfig.institution || 'Unknown'
        });
      }
    } catch (error) {
      console.error(`Error fetching transactions for ${tokenConfig.institution || 'unknown'}:`, error);
    }
  }
  
  return allTransactions;
}

// Update sheets
async function updateSheets(sheetsConfig: { spreadsheetId: string; entityMapping: Record<string, { sheetName: string }> }, accounts: unknown[], transactions: unknown[]) {
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = sheetsConfig.spreadsheetId;
  
  // Update accounts
  if (accounts.length > 0) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Accounts!A2:J1000'
    });
    
    const rows = (accounts as Array<{
      name?: string;
      _institution?: string;
      type?: string;
      subtype?: string;
      mask?: string;
      _entity?: string;
      balances?: { current?: number; available?: number };
      account_id?: string;
    }>).map(account => [
      account.name || '',
      account._institution || '',
      account.type || '',
      account.subtype || '',
      account.mask || '',
      sheetsConfig.entityMapping[account._entity || 'personal']?.sheetName || account._entity,
      account.balances?.current ?? '',
      account.balances?.available ?? '',
      new Date().toISOString(),
      account.account_id || ''
    ]);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Accounts!A2',
      valueInputOption: 'RAW',
      requestBody: { values: rows }
    });
  }
  
  // Group and update transactions
  const byEntity: Record<string, unknown[]> = {
    personal: [],
    multiply_inc: [],
    cashflow_empire: []
  };
  
  for (const txn of transactions as Array<{ _entity?: string }>) {
    const entity = txn._entity || 'personal';
    if (byEntity[entity]) {
      byEntity[entity].push(txn);
    }
  }
  
  for (const [entity, txns] of Object.entries(byEntity)) {
    const sheetName = sheetsConfig.entityMapping[entity]?.sheetName || entity;
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A2:I10000`
    });
    
    if (txns.length > 0) {
      const rows = (txns as Array<{
        date?: string;
        account_id?: string;
        name?: string;
        merchant_name?: string;
        personal_finance_category?: { primary?: string };
        category?: string[];
        amount?: number;
        pending?: boolean;
        transaction_id?: string;
      }>).sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
        .map(txn => [
          txn.date || '',
          txn.account_id || '',
          txn.name || txn.merchant_name || '',
          (txn.personal_finance_category?.primary || txn.category?.[0]) || '',
          txn.amount || 0,
          txn.merchant_name || '',
          txn.pending ? 'Yes' : 'No',
          txn.transaction_id || '',
          txn.account_id || ''
        ]);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      });
    }
  }
  
  return {
    accountsUpdated: accounts.length,
    transactionsUpdated: transactions.length
  };
}

// GET - Fetch sync status
export async function GET() {
  try {
    const { sheetsConfig, plaidCredentials } = loadConfig();
    
    return NextResponse.json({
      status: 'ok',
      spreadsheetUrl: sheetsConfig.spreadsheetUrl,
      spreadsheetId: sheetsConfig.spreadsheetId,
      plaidConfigured: !!plaidCredentials,
      accessTokenCount: plaidCredentials?.access_tokens?.length || 0,
      entities: Object.keys(sheetsConfig.entityMapping)
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { days = 30, accountsOnly = false, transactionsOnly = false } = body;
    
    const { sheetsConfig, plaidCredentials } = loadConfig();
    
    if (!plaidCredentials) {
      return NextResponse.json({
        error: 'Plaid credentials not configured',
        message: 'Create config/plaid-credentials.json with your Plaid credentials',
        spreadsheetUrl: sheetsConfig.spreadsheetUrl
      }, { status: 400 });
    }
    
    const plaidClient = getPlaidClient(plaidCredentials);
    
    let accounts: unknown[] = [];
    let transactions: unknown[] = [];
    
    if (!transactionsOnly) {
      accounts = await fetchAccounts(plaidClient, plaidCredentials.access_tokens);
    }
    
    if (!accountsOnly) {
      transactions = await fetchTransactions(plaidClient, plaidCredentials.access_tokens, days);
    }
    
    const result = await updateSheets(sheetsConfig, accounts, transactions);
    
    return NextResponse.json({
      success: true,
      ...result,
      spreadsheetUrl: sheetsConfig.spreadsheetUrl,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
