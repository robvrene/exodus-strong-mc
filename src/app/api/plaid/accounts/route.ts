import { NextRequest, NextResponse } from 'next/server';
import { plaidClient, isPlaidConfigured } from '@/lib/plaid-client';
import { plaidItems, plaidAccounts } from '@/lib/plaid-db';

export const dynamic = 'force-dynamic';

// GET: Fetch all connected accounts with balances
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
    const refresh = searchParams.get('refresh') === 'true';
    const itemIdFilter = searchParams.get('item_id');

    // Get all stored items
    const items = await plaidItems.getAll();

    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        accounts: [],
        summary: {
          totalBalance: 0,
          byType: [],
          totalAccounts: 0,
        },
      });
    }

    // If refresh requested, fetch fresh data from Plaid
    if (refresh) {
      for (const item of items) {
        if (itemIdFilter && item.item_id !== itemIdFilter) continue;
        
        try {
          const accountsResponse = await plaidClient.accountsGet({
            access_token: item.access_token,
          });

          // Update accounts in database
          for (const account of accountsResponse.data.accounts) {
            await plaidAccounts.upsert({
              item_id: item.item_id,
              account_id: account.account_id,
              name: account.name,
              official_name: account.official_name || undefined,
              type: account.type,
              subtype: account.subtype || undefined,
              mask: account.mask || undefined,
              current_balance: account.balances.current ?? undefined,
              available_balance: account.balances.available ?? undefined,
              iso_currency_code: account.balances.iso_currency_code || undefined,
            });
          }

          // Clear any previous errors
          if (item.error_code) {
            await plaidItems.setError(item.item_id, null, null);
          }
        } catch (error) {
          console.error(`Error refreshing accounts for item ${item.item_id}:`, error);
          
          // Store error on the item
          const plaidError = error as { response?: { data?: { error_code?: string; error_message?: string } } };
          if (plaidError?.response?.data?.error_code) {
            await plaidItems.setError(
              item.item_id,
              plaidError.response.data.error_code,
              plaidError.response.data.error_message || null
            );
          }
        }
      }
    }

    // Get summary from database
    const summary = await plaidAccounts.getSummary();
    
    // Get fresh items list (with updated error states)
    const updatedItems = await plaidItems.getAll();

    // Filter if item_id specified
    let filteredAccounts = summary.accounts;
    if (itemIdFilter) {
      filteredAccounts = summary.accounts.filter(a => a.item_id === itemIdFilter);
    }

    return NextResponse.json({
      items: updatedItems.map(i => ({
        id: i.id,
        item_id: i.item_id,
        institution_name: i.institution_name,
        user_label: i.user_label,
        error_code: i.error_code,
        error_message: i.error_message,
        created_at: i.created_at,
        updated_at: i.updated_at,
      })),
      accounts: filteredAccounts.map(a => ({
        id: a.id,
        item_id: a.item_id,
        account_id: a.account_id,
        name: a.name,
        official_name: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        current_balance: a.current_balance,
        available_balance: a.available_balance,
        iso_currency_code: a.iso_currency_code,
        last_updated: a.last_updated,
      })),
      summary: {
        totalBalance: itemIdFilter 
          ? filteredAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0)
          : summary.totalBalance,
        byType: summary.byType,
        totalAccounts: filteredAccounts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' }, 
      { status: 500 }
    );
  }
}

// DELETE: Remove a connected item
export async function DELETE(request: NextRequest) {
  try {
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        { error: 'Plaid not configured' }, 
        { status: 503 }
      );
    }

    const body = await request.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json(
        { error: 'item_id is required' }, 
        { status: 400 }
      );
    }

    // Get the item to get access token
    const item = await plaidItems.getByItemId(item_id);
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' }, 
        { status: 404 }
      );
    }

    // Remove item from Plaid
    try {
      await plaidClient.itemRemove({
        access_token: item.access_token,
      });
    } catch (error) {
      console.error('Error removing item from Plaid:', error);
      // Continue to delete from database anyway
    }

    // Delete accounts associated with this item
    await plaidAccounts.deleteByItemId(item_id);

    // Delete the item
    await plaidItems.delete(item_id);

    return NextResponse.json({
      success: true,
      message: 'Item and associated accounts removed',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' }, 
      { status: 500 }
    );
  }
}
