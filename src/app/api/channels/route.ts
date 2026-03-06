import { NextRequest, NextResponse } from 'next/server';
import { channels, channelMetrics, Platform } from '@/lib/content-db';

// GET /api/channels - List all channels with latest metrics
export async function GET() {
  try {
    const summary = await channelMetrics.getAllChannelsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// POST /api/channels - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: name, platform' },
        { status: 400 }
      );
    }

    const channel = await channels.create({
      name: body.name,
      platform: body.platform as Platform,
      handle: body.handle,
      url: body.url,
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Failed to create channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
