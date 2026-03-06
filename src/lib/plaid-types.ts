// Plaid integration types

export type PlaidEntity = 'personal' | 'multiply_inc' | 'cashflow_empire';

export interface PlaidAccount {
  id: string;
  item_id: string;
  institution_name: string;
  institution_id: string;
  account_name: string;
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  account_subtype: string | null;
  mask: string | null; // Last 4 digits
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  entity: PlaidEntity;
  last_synced: string;
  created_at: string;
}

export interface PlaidTransaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[];
  pending: boolean;
  transaction_type: string;
  payment_channel: string;
}

export interface PlaidLinkToken {
  link_token: string;
  expiration: string;
}

export interface PlaidExchangeResponse {
  success: boolean;
  item_id: string;
  accounts: PlaidAccount[];
}

export const ENTITY_LABELS: Record<PlaidEntity, string> = {
  personal: 'Personal',
  multiply_inc: 'Multiply Inc',
  cashflow_empire: 'CashFlow Empire',
};

export const ENTITY_COLORS: Record<PlaidEntity, string> = {
  personal: '#8B5CF6', // Purple
  multiply_inc: '#E91E8C', // Magenta
  cashflow_empire: '#00D9FF', // Cyan
};

export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  checking: '🏦',
  savings: '💰',
  credit: '💳',
  investment: '📈',
  loan: '📋',
  other: '🏛️',
};
