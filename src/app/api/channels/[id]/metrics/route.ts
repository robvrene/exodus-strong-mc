import { NextRequest, NextResponse } from 'next/server';
import { channelMetrics, channels } from '@/lib/content-db';

// POST /api/channels/[id]/metrics - Record metrics for a channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Verify channel exists
    const channel = await channels.getById(id);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const metrics = await channelMetrics.record(id, {
      date: body.date,
      subscribers: body.subscribers,
      views: body.views,
      posts: body.posts,
      engagement: body.engagement,
    });

    return NextResponse.json(metrics, { status: 201 });
  } catch (error) {
    console.error('Failed to record metrics:', error);
    return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 });
  }
}

// GET /api/channels/[id]/metrics - Get metrics history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const metrics = await channelMetrics.getByChannel(id, days);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
