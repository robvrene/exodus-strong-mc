import { NextRequest, NextResponse } from 'next/server';
import { plaidClient, isPlaidConfigured, CountryCode } from '@/lib/plaid-client';
import { plaidItems, plaidAccounts } from '@/lib/plaid-db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { public_token, institution, user_label } = body;

    if (!public_token) {
      return NextResponse.json(
        { error: 'public_token is required' }, 
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info if not provided
    let institutionId = institution?.institution_id;
    let institutionName = institution?.name;

    if (!institutionName && institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = instResponse.data.institution.name;
      } catch {
        // Institution lookup failed, continue without it
      }
    }

    // Store the item in database
    const item = await plaidItems.create({
      access_token: accessToken,
      item_id: itemId,
      institution_id: institutionId,
      institution_name: institutionName,
      user_label: user_label,
    });

    // Fetch and store accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const storedAccounts = [];
    for (const account of accountsResponse.data.accounts) {
      const stored = await plaidAccounts.upsert({
        item_id: itemId,
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
      storedAccounts.push(stored);
    }

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        item_id: item.item_id,
        institution_name: item.institution_name,
        created_at: item.created_at,
      },
      accounts: storedAccounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
      })),
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    
    // Extract Plaid error details if available
    const plaidError = error as { response?: { data?: { error_type?: string; error_code?: string; error_message?: string } } };
    if (plaidError?.response?.data?.error_type) {
      return NextResponse.json(
        { 
          error: plaidError.response.data.error_type,
          error_code: plaidError.response.data.error_code,
          message: plaidError.response.data.error_message,
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to exchange token' }, 
      { status: 500 }
    );
  }
}
