import { NextRequest, NextResponse } from 'next/server';
import { 
  plaidClient, 
  isPlaidConfigured, 
  DEFAULT_PRODUCTS, 
  DEFAULT_COUNTRY_CODES,
  Products 
} from '@/lib/plaid-client';

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

    // Parse request body for optional parameters
    let userId = 'user-' + Date.now();
    let products = DEFAULT_PRODUCTS;
    let itemId: string | undefined;
    
    try {
      const body = await request.json();
      if (body.user_id) userId = body.user_id;
      if (body.products && Array.isArray(body.products)) {
        products = body.products as Products[];
      }
      if (body.access_token) {
        // Update mode - for re-authenticating existing items
        itemId = body.item_id;
      }
    } catch {
      // Body is optional, use defaults
    }

    // Create link token request
    const linkTokenRequest: Parameters<typeof plaidClient.linkTokenCreate>[0] = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Mission Control',
      products: products,
      country_codes: DEFAULT_COUNTRY_CODES,
      language: 'en',
    };

    // If updating an existing item, add access_token
    if (itemId) {
      const { plaidItems } = await import('@/lib/plaid-db');
      const item = await plaidItems.getByItemId(itemId);
      if (item) {
        linkTokenRequest.access_token = item.access_token;
      }
    }

    const response = await plaidClient.linkTokenCreate(linkTokenRequest);

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
      request_id: response.data.request_id,
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    
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
      { error: 'Failed to create link token' }, 
      { status: 500 }
    );
  }
}
