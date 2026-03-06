import { NextRequest, NextResponse } from 'next/server';
import { broadcasts, BroadcastStatus, BroadcastType } from '@/lib/content-db';

// GET /api/broadcasts - List all broadcasts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as BroadcastStatus | null;
    const type = searchParams.get('type') as BroadcastType | null;
    const view = searchParams.get('view'); // 'pending', 'scheduled', 'all'

    let items;
    
    if (view === 'pending') {
      items = await broadcasts.getPending();
    } else if (view === 'scheduled') {
      items = await broadcasts.getScheduled();
    } else {
      items = await broadcasts.getAll({
        status: status || undefined,
        type: type || undefined,
      });
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch broadcasts:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

// POST /api/broadcasts - Create new broadcast
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.body || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, type' },
        { status: 400 }
      );
    }

    if (!['email', 'sms'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be "email" or "sms"' },
        { status: 400 }
      );
    }

    const item = await broadcasts.create({
      title: body.title,
      subject: body.subject,
      body: body.body,
      type: body.type,
      scheduled_for: body.scheduled_for,
      segment: body.segment,
      campaign: body.campaign,
      recipient_count: body.recipient_count,
      created_by: body.created_by || 'solomon',
      status: body.status || 'pending',
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create broadcast:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}
