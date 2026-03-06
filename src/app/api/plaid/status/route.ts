import { NextResponse } from 'next/server';
import { isPlaidConfigured } from '@/lib/plaid-client';
import { plaidItems, plaidAccounts, initializePlaidSchema } from '@/lib/plaid-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize schema if needed
    await initializePlaidSchema();
    
    const configured = isPlaidConfigured();
    
    if (!configured) {
      return NextResponse.json({
        status: 'not_configured',
        configured: false,
        message: 'Plaid credentials not set. Update config/plaid.json with your Plaid sandbox credentials.',
        setup_url: 'https://dashboard.plaid.com/developers/keys',
      });
    }

    // Get counts
    const items = await plaidItems.getAll();
    const summary = await plaidAccounts.getSummary();
    
    // Check for any items with errors
    const itemsWithErrors = items.filter(i => i.error_code);

    return NextResponse.json({
      status: 'ready',
      configured: true,
      stats: {
        connected_institutions: items.length,
        total_accounts: summary.accounts.length,
        items_with_errors: itemsWithErrors.length,
      },
      items: items.map(i => ({
        item_id: i.item_id,
        institution_name: i.institution_name,
        user_label: i.user_label,
        has_error: !!i.error_code,
        error_code: i.error_code,
      })),
    });
  } catch (error) {
    console.error('Error checking Plaid status:', error);
    return NextResponse.json({
      status: 'error',
      configured: false,
      error: 'Failed to check Plaid status',
    }, { status: 500 });
  }
}
