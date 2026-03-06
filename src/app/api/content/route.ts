import { NextRequest, NextResponse } from 'next/server';
import { content, ContentStatus, Platform } from '@/lib/content-db';

// GET /api/content - List all content with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ContentStatus | null;
    const platform = searchParams.get('platform') as Platform | null;
    const campaign = searchParams.get('campaign');
    const view = searchParams.get('view'); // 'pending', 'approved', 'all'

    let items;
    
    if (view === 'pending') {
      items = await content.getPending();
    } else if (view === 'approved') {
      items = await content.getApproved();
    } else {
      items = await content.getAll({
        status: status || undefined,
        platform: platform || undefined,
        campaign: campaign || undefined,
      });
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// POST /api/content - Create new content item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.copy || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: title, copy, platform' },
        { status: 400 }
      );
    }

    const item = await content.create({
      title: body.title,
      copy: body.copy,
      platform: body.platform,
      image_url: body.image_url,
      image_id: body.image_id,
      media_type: body.media_type,
      media_urls: body.media_urls,
      video_url: body.video_url,
      video_thumbnail: body.video_thumbnail,
      scheduled_for: body.scheduled_for,
      campaign: body.campaign,
      hashtags: body.hashtags,
      created_by: body.created_by || 'solomon',
      status: body.status || 'pending',
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create content:', error);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }
}
