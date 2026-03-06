import { NextRequest, NextResponse } from 'next/server';

const GHL_TOKEN = process.env.GHL_TOKEN || 'pit-2dbe09b1-7f0d-4731-a72c-607ab17e91bd';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'h0E8jBzgHYKg32ZshJ2N';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7830035467:AAHq_EkAolQANZMPfxDpSDhX5uqbXER0Mvw';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1339916777';

async function sendTelegram(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }
}

async function searchGHLContact(firstName: string) {
  const res = await fetch(
    `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(firstName)}`,
    {
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Version': '2021-07-28'
      }
    }
  );
  const data = await res.json();
  return data.contacts || [];
}

async function updateGHLTags(contactId: string, currentTags: string[]) {
  // Remove race-to-revenue, add Buyer
  const newTags = currentTags.filter(t => t.toLowerCase() !== 'race-to-revenue');
  if (!newTags.includes('Buyer')) {
    newTags.push('Buyer');
  }
  
  const res = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags: newTags })
    }
  );
  return res.ok;
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Only process successful charges
    if (event.type !== 'charge.succeeded') {
      return NextResponse.json({ received: true, skipped: event.type });
    }
    
    const charge = event.data.object;
    const amount = (charge.amount / 100).toFixed(2);
    const currency = charge.currency?.toUpperCase() || 'USD';
    const customerName = charge.billing_details?.name || 'Unknown';
    const customerEmail = charge.billing_details?.email || 'Unknown';
    const firstName = customerName.split(' ')[0];
    
    let ghlUpdated = false;
    let ghlMessage = 'Contact not found in GHL';
    
    // Search GHL by first name
    if (firstName && firstName !== 'Unknown') {
      const contacts = await searchGHLContact(firstName);
      
      // Find matching contact by email if possible
      let matchedContact = contacts.find((c: any) => 
        c.email?.toLowerCase() === customerEmail?.toLowerCase()
      );
      
      // If no email match, take first result with matching first name
      if (!matchedContact && contacts.length > 0) {
        matchedContact = contacts[0];
      }
      
      if (matchedContact) {
        const currentTags = matchedContact.tags || [];
        const updated = await updateGHLTags(matchedContact.id, currentTags);
        
        if (updated) {
          ghlUpdated = true;
          ghlMessage = `✅ Tagged as Buyer (removed race-to-revenue)`;
        } else {
          ghlMessage = '❌ Failed to update tags';
        }
      }
    }
    
    // Send Telegram notification
    const message = `💰 <b>NEW PAYMENT RECEIVED</b>

<b>Amount:</b> $${amount} ${currency}
<b>Customer:</b> ${customerName}
<b>Email:</b> ${customerEmail}

<b>GHL Status:</b> ${ghlMessage}`;
    
    await sendTelegram(message);
    
    return NextResponse.json({ 
      received: true, 
      amount,
      customer: customerName,
      ghlUpdated 
    });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    await sendTelegram(`❌ Stripe webhook error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'Stripe webhook active',
    endpoint: '/api/webhooks/stripe'
  });
}
