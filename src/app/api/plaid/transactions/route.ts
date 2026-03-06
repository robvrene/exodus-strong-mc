import { NextRequest, NextResponse } from 'next/server';
import { plaidClient, isPlaidConfigured } from '@/lib/plaid-client';
import { plaidItems, plaidAccounts } from '@/lib/plaid-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if Plaid is configured
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        { 
          error: 'Plaid not configured',
          message: 'Please add valid Plaid credentials to config/plaid.json'
        }, 
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse date range (default to last 30 days)
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const startDate = searchParams.get('start_date') || defaultStartDate.toISOString().split('T')[0];
    
    // Optional filters
    const itemIdFilter = searchParams.get('item_id');
    const accountIdFilter = searchParams.get('account_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get items to fetch transactions for
    let items = await plaidItems.getAll();
    if (itemIdFilter) {
      items = items.filter(i => i.item_id === itemIdFilter);
    }

    if (items.length === 0) {
      return NextResponse.json({
        transactions: [],
        total: 0,
        accounts: [],
        date_range: { start_date: startDate, end_date: endDate },
      });
    }

    // Fetch transactions from all items
    interface Transaction {
      transaction_id: string;
      item_id: string;
      account_id: string;
      account_name?: string;
      amount: number;
      iso_currency_code: string | null;
      date: string;
      datetime?: string | null;
      name: string;
      merchant_name?: string | null;
      category?: string[] | null;
      category_id?: string | null;
      pending: boolean;
      payment_channel: string;
      location?: {
        address?: string | null;
        city?: string | null;
        region?: string | null;
        postal_code?: string | null;
        country?: string | null;
      };
    }
    
    const allTransactions: Transaction[] = [];
    const errors: { item_id: string; error: string }[] = [];
    const accountMap = new Map<string, string>();

    // Build account map for names
    const allAccounts = await plaidAccounts.getAll();
    for (const account of allAccounts) {
      accountMap.set(account.account_id, account.name);
    }

    for (const item of items) {
      try {
        // Build account IDs filter if specified
        let accountIds: string[] | undefined;
        if (accountIdFilter) {
          const accounts = await plaidAccounts.getByItemId(item.item_id);
          accountIds = accounts
            .filter(a => a.account_id === accountIdFilter)
            .map(a => a.account_id);
          
          if (accountIds.length === 0) continue; // Skip this item if account not found
        }

        // Fetch transactions using sync or get
        // Using transactionsGet for date range queries
        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date: startDate,
          end_date: endDate,
          options: {
            count: Math.min(limit, 500),
            offset: offset,
            account_ids: accountIds,
          },
        });

        // Map transactions
        for (const tx of transactionsResponse.data.transactions) {
          allTransactions.push({
            transaction_id: tx.transaction_id,
            item_id: item.item_id,
            account_id: tx.account_id,
            account_name: accountMap.get(tx.account_id),
            amount: tx.amount,
            iso_currency_code: tx.iso_currency_code,
            date: tx.date,
            datetime: tx.datetime,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            category_id: tx.category_id,
            pending: tx.pending,
            payment_channel: tx.payment_channel,
            location: tx.location ? {
              address: tx.location.address,
              city: tx.location.city,
              region: tx.location.region,
              postal_code: tx.location.postal_code,
              country: tx.location.country,
            } : undefined,
          });
        }

        // Clear any previous errors
        if (item.error_code) {
          await plaidItems.setError(item.item_id, null, null);
        }
      } catch (error) {
        console.error(`Error fetching transactions for item ${item.item_id}:`, error);
        
        const plaidError = error as { response?: { data?: { error_code?: string; error_message?: string } } };
        const errorCode = plaidError?.response?.data?.error_code || 'UNKNOWN';
        const errorMessage = plaidError?.response?.data?.error_message || 'Unknown error';
        
        errors.push({
          item_id: item.item_id,
          error: `${errorCode}: ${errorMessage}`,
        });

        // Store error on the item
        if (plaidError?.response?.data?.error_code) {
          await plaidItems.setError(
            item.item_id,
            plaidError.response.data.error_code,
            plaidError.response.data.error_message || null
          );
        }
      }
    }

    // Sort transactions by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply global limit after combining all sources
    const paginatedTransactions = allTransactions.slice(0, limit);

    // Calculate summary
    const totalSpent = paginatedTransactions
      .filter(t => t.amount > 0 && !t.pending)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = paginatedTransactions
      .filter(t => t.amount < 0 && !t.pending)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group by category
    const byCategory = paginatedTransactions.reduce((acc, tx) => {
      const category = tx.category?.[0] || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0 };
      }
      acc[category].count++;
      acc[category].total += tx.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return NextResponse.json({
      transactions: paginatedTransactions,
      total: allTransactions.length,
      summary: {
        total_spent: totalSpent,
        total_income: totalIncome,
        net: totalIncome - totalSpent,
        by_category: byCategory,
      },
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' }, 
      { status: 500 }
    );
  }
}
