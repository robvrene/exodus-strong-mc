import { createClient, Client } from '@libsql/client';

// Initialize Turso client
const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/mission-control.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize Plaid schema
let plaidSchemaInitialized = false;

export async function initializePlaidSchema() {
  if (plaidSchemaInitialized) return;
  
  await client.batch([
    // Plaid Items table (stores connected institutions)
    `CREATE TABLE IF NOT EXISTS plaid_items (
      id TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      item_id TEXT NOT NULL UNIQUE,
      institution_id TEXT,
      institution_name TEXT,
      user_label TEXT,
      consent_expiration TEXT,
      error_code TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Plaid Accounts table (accounts within each item)
    `CREATE TABLE IF NOT EXISTS plaid_accounts (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      account_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      official_name TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      mask TEXT,
      current_balance REAL,
      available_balance REAL,
      iso_currency_code TEXT,
      last_updated TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES plaid_items(item_id) ON DELETE CASCADE
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_plaid_items_item_id ON plaid_items(item_id)`,
    `CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON plaid_accounts(item_id)`,
    `CREATE INDEX IF NOT EXISTS idx_plaid_accounts_type ON plaid_accounts(type)`,
  ], 'write');
  
  plaidSchemaInitialized = true;
}

// Type definitions
export interface PlaidItem {
  id: string;
  access_token: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  user_label: string | null;
  consent_expiration: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaidAccount {
  id: string;
  item_id: string;
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string | null;
  last_updated: string | null;
  created_at: string;
}

// Generate unique ID
function generateId(): string {
  return `plaid-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// Plaid Item operations
export const plaidItems = {
  getAll: async (): Promise<PlaidItem[]> => {
    await initializePlaidSchema();
    const result = await client.execute('SELECT * FROM plaid_items ORDER BY created_at DESC');
    return result.rows as unknown as PlaidItem[];
  },

  getByItemId: async (itemId: string): Promise<PlaidItem | undefined> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM plaid_items WHERE item_id = ?',
      args: [itemId],
    });
    return result.rows[0] as unknown as PlaidItem | undefined;
  },

  getById: async (id: string): Promise<PlaidItem | undefined> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM plaid_items WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as PlaidItem | undefined;
  },

  create: async (data: {
    access_token: string;
    item_id: string;
    institution_id?: string;
    institution_name?: string;
    user_label?: string;
  }): Promise<PlaidItem> => {
    await initializePlaidSchema();
    const id = generateId();
    await client.execute({
      sql: `INSERT INTO plaid_items (id, access_token, item_id, institution_id, institution_name, user_label)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.access_token,
        data.item_id,
        data.institution_id || null,
        data.institution_name || null,
        data.user_label || null,
      ],
    });
    return (await plaidItems.getById(id))!;
  },

  update: async (itemId: string, data: Partial<PlaidItem>): Promise<PlaidItem | undefined> => {
    await initializePlaidSchema();
    const existing = await plaidItems.getByItemId(itemId);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.access_token !== undefined) { updates.push('access_token = ?'); values.push(data.access_token); }
    if (data.institution_id !== undefined) { updates.push('institution_id = ?'); values.push(data.institution_id); }
    if (data.institution_name !== undefined) { updates.push('institution_name = ?'); values.push(data.institution_name); }
    if (data.user_label !== undefined) { updates.push('user_label = ?'); values.push(data.user_label); }
    if (data.consent_expiration !== undefined) { updates.push('consent_expiration = ?'); values.push(data.consent_expiration); }
    if (data.error_code !== undefined) { updates.push('error_code = ?'); values.push(data.error_code); }
    if (data.error_message !== undefined) { updates.push('error_message = ?'); values.push(data.error_message); }

    updates.push("updated_at = datetime('now')");
    values.push(itemId);

    await client.execute({
      sql: `UPDATE plaid_items SET ${updates.join(', ')} WHERE item_id = ?`,
      args: values,
    });

    return plaidItems.getByItemId(itemId);
  },

  delete: async (itemId: string): Promise<boolean> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'DELETE FROM plaid_items WHERE item_id = ?',
      args: [itemId],
    });
    return (result.rowsAffected ?? 0) > 0;
  },

  setError: async (itemId: string, errorCode: string | null, errorMessage: string | null): Promise<void> => {
    await initializePlaidSchema();
    await client.execute({
      sql: `UPDATE plaid_items SET error_code = ?, error_message = ?, updated_at = datetime('now') WHERE item_id = ?`,
      args: [errorCode, errorMessage, itemId],
    });
  },
};

// Plaid Account operations
export const plaidAccounts = {
  getAll: async (): Promise<PlaidAccount[]> => {
    await initializePlaidSchema();
    const result = await client.execute('SELECT * FROM plaid_accounts ORDER BY type, name');
    return result.rows as unknown as PlaidAccount[];
  },

  getByItemId: async (itemId: string): Promise<PlaidAccount[]> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM plaid_accounts WHERE item_id = ? ORDER BY type, name',
      args: [itemId],
    });
    return result.rows as unknown as PlaidAccount[];
  },

  getByAccountId: async (accountId: string): Promise<PlaidAccount | undefined> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM plaid_accounts WHERE account_id = ?',
      args: [accountId],
    });
    return result.rows[0] as unknown as PlaidAccount | undefined;
  },

  upsert: async (data: {
    item_id: string;
    account_id: string;
    name: string;
    official_name?: string;
    type: string;
    subtype?: string;
    mask?: string;
    current_balance?: number;
    available_balance?: number;
    iso_currency_code?: string;
  }): Promise<PlaidAccount> => {
    await initializePlaidSchema();
    
    const existing = await plaidAccounts.getByAccountId(data.account_id);
    
    if (existing) {
      // Update existing account
      await client.execute({
        sql: `UPDATE plaid_accounts SET 
              name = ?, official_name = ?, type = ?, subtype = ?, mask = ?,
              current_balance = ?, available_balance = ?, iso_currency_code = ?,
              last_updated = datetime('now')
              WHERE account_id = ?`,
        args: [
          data.name,
          data.official_name || null,
          data.type,
          data.subtype || null,
          data.mask || null,
          data.current_balance ?? null,
          data.available_balance ?? null,
          data.iso_currency_code || null,
          data.account_id,
        ],
      });
      return (await plaidAccounts.getByAccountId(data.account_id))!;
    } else {
      // Create new account
      const id = generateId();
      await client.execute({
        sql: `INSERT INTO plaid_accounts (id, item_id, account_id, name, official_name, type, subtype, mask, current_balance, available_balance, iso_currency_code, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          data.item_id,
          data.account_id,
          data.name,
          data.official_name || null,
          data.type,
          data.subtype || null,
          data.mask || null,
          data.current_balance ?? null,
          data.available_balance ?? null,
          data.iso_currency_code || null,
        ],
      });
      return (await plaidAccounts.getByAccountId(data.account_id))!;
    }
  },

  deleteByItemId: async (itemId: string): Promise<number> => {
    await initializePlaidSchema();
    const result = await client.execute({
      sql: 'DELETE FROM plaid_accounts WHERE item_id = ?',
      args: [itemId],
    });
    return result.rowsAffected ?? 0;
  },

  // Get summary with totals by account type
  getSummary: async (): Promise<{
    totalBalance: number;
    byType: { type: string; count: number; totalBalance: number }[];
    accounts: PlaidAccount[];
  }> => {
    await initializePlaidSchema();
    
    const accounts = await plaidAccounts.getAll();
    
    const byType = accounts.reduce((acc, account) => {
      const existing = acc.find(t => t.type === account.type);
      const balance = account.current_balance ?? 0;
      
      if (existing) {
        existing.count++;
        existing.totalBalance += balance;
      } else {
        acc.push({ type: account.type, count: 1, totalBalance: balance });
      }
      return acc;
    }, [] as { type: string; count: number; totalBalance: number }[]);
    
    const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
    
    return { totalBalance, byType, accounts };
  },
};

export default client;
