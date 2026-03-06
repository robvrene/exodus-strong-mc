import { createClient, Client } from '@libsql/client';

// Initialize Turso client (shared with main db)
const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/mission-control.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize content schema
let contentSchemaInitialized = false;

export async function initializeContentSchema() {
  if (contentSchemaInitialized) return;
  
  await client.batch([
    // Channels table (YouTube, Instagram, etc.)
    `CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      handle TEXT,
      url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Channel metrics (daily snapshots)
    `CREATE TABLE IF NOT EXISTS channel_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      date TEXT NOT NULL,
      subscribers INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      posts INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      UNIQUE(channel_id, date)
    )`,

    // Content items table
    `CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      copy TEXT NOT NULL,
      image_url TEXT,
      image_id TEXT,
      media_type TEXT DEFAULT 'image',
      media_urls TEXT,
      video_url TEXT,
      video_thumbnail TEXT,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_for TEXT,
      campaign TEXT,
      hashtags TEXT,
      created_by TEXT NOT NULL DEFAULT 'solomon',
      approved_by TEXT,
      rejected_by TEXT,
      rejection_reason TEXT,
      published_url TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Content activity log
    `CREATE TABLE IF NOT EXISTS content_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
    )`,

    // Broadcasts table (email/SMS campaigns)
    `CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_for TEXT,
      sent_at TEXT,
      segment TEXT,
      campaign TEXT,
      recipient_count INTEGER DEFAULT 0,
      open_rate REAL,
      click_rate REAL,
      created_by TEXT NOT NULL DEFAULT 'solomon',
      approved_by TEXT,
      rejected_by TEXT,
      rejection_reason TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Broadcast activity log
    `CREATE TABLE IF NOT EXISTS broadcast_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broadcast_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status)`,
    `CREATE INDEX IF NOT EXISTS idx_content_platform ON content_items(platform)`,
    `CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content_items(scheduled_for)`,
    `CREATE INDEX IF NOT EXISTS idx_content_campaign ON content_items(campaign)`,
    `CREATE INDEX IF NOT EXISTS idx_channel_metrics_date ON channel_metrics(date)`,
    `CREATE INDEX IF NOT EXISTS idx_channel_metrics_channel ON channel_metrics(channel_id)`,
    `CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status)`,
    `CREATE INDEX IF NOT EXISTS idx_broadcasts_type ON broadcasts(type)`,
    `CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON broadcasts(scheduled_for)`,
  ], 'write');
  
  contentSchemaInitialized = true;
}

// Type definitions
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected';
export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';

export type MediaType = 'image' | 'carousel' | 'video' | 'reel';

export interface ContentItem {
  id: string;
  title: string;
  copy: string;
  image_url: string | null;
  image_id: string | null;
  media_type: MediaType;
  media_urls: string | null; // JSON array of URLs for carousels
  video_url: string | null;
  video_thumbnail: string | null;
  platform: Platform;
  status: ContentStatus;
  scheduled_for: string | null;
  campaign: string | null;
  hashtags: string | null;
  created_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  published_url: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentActivity {
  id: number;
  content_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'revision_requested';
  actor: string;
  notes: string | null;
  created_at: string;
}

// Generate unique ID
function generateId(): string {
  return `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// Content operations
export const content = {
  getAll: async (filters?: { status?: ContentStatus; platform?: Platform; campaign?: string }): Promise<ContentItem[]> => {
    await initializeContentSchema();
    
    let sql = 'SELECT * FROM content_items WHERE 1=1';
    const args: (string)[] = [];
    
    if (filters?.status) {
      sql += ' AND status = ?';
      args.push(filters.status);
    }
    if (filters?.platform) {
      sql += ' AND platform = ?';
      args.push(filters.platform);
    }
    if (filters?.campaign) {
      sql += ' AND campaign = ?';
      args.push(filters.campaign);
    }
    
    sql += ' ORDER BY COALESCE(scheduled_for, created_at) ASC';
    
    const result = await client.execute({ sql, args });
    return result.rows as unknown as ContentItem[];
  },

  getPending: async (): Promise<ContentItem[]> => {
    await initializeContentSchema();
    const result = await client.execute(
      "SELECT * FROM content_items WHERE status = 'pending' ORDER BY created_at ASC"
    );
    return result.rows as unknown as ContentItem[];
  },

  getApproved: async (): Promise<ContentItem[]> => {
    await initializeContentSchema();
    const result = await client.execute(
      "SELECT * FROM content_items WHERE status IN ('approved', 'scheduled') ORDER BY scheduled_for ASC"
    );
    return result.rows as unknown as ContentItem[];
  },

  getById: async (id: string): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM content_items WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as ContentItem | undefined;
  },

  create: async (data: {
    title: string;
    copy: string;
    platform: Platform;
    image_url?: string;
    image_id?: string;
    media_type?: MediaType;
    media_urls?: string[]; // Array for carousels
    video_url?: string;
    video_thumbnail?: string;
    scheduled_for?: string;
    campaign?: string;
    hashtags?: string;
    created_by?: string;
    status?: ContentStatus;
  }): Promise<ContentItem> => {
    await initializeContentSchema();
    const id = generateId();
    
    // Determine media type
    let mediaType: MediaType = data.media_type || 'image';
    if (data.media_urls && data.media_urls.length > 1) mediaType = 'carousel';
    if (data.video_url) mediaType = 'video';
    
    await client.execute({
      sql: `INSERT INTO content_items (id, title, copy, image_url, image_id, media_type, media_urls, video_url, video_thumbnail, platform, status, scheduled_for, campaign, hashtags, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title,
        data.copy,
        data.image_url || null,
        data.image_id || null,
        mediaType,
        data.media_urls ? JSON.stringify(data.media_urls) : null,
        data.video_url || null,
        data.video_thumbnail || null,
        data.platform,
        data.status || 'pending',
        data.scheduled_for || null,
        data.campaign || null,
        data.hashtags || null,
        data.created_by || 'solomon',
      ],
    });
    
    // Log activity
    await contentActivity.log(id, 'created', data.created_by || 'solomon', `Created ${data.platform} post`);
    
    return (await content.getById(id))!;
  },

  update: async (id: string, data: Partial<ContentItem>): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.copy !== undefined) { updates.push('copy = ?'); values.push(data.copy); }
    if (data.image_url !== undefined) { updates.push('image_url = ?'); values.push(data.image_url); }
    if (data.image_id !== undefined) { updates.push('image_id = ?'); values.push(data.image_id); }
    if (data.platform !== undefined) { updates.push('platform = ?'); values.push(data.platform); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    if (data.scheduled_for !== undefined) { updates.push('scheduled_for = ?'); values.push(data.scheduled_for); }
    if (data.campaign !== undefined) { updates.push('campaign = ?'); values.push(data.campaign); }
    if (data.hashtags !== undefined) { updates.push('hashtags = ?'); values.push(data.hashtags); }
    if (data.approved_by !== undefined) { updates.push('approved_by = ?'); values.push(data.approved_by); }
    if (data.rejected_by !== undefined) { updates.push('rejected_by = ?'); values.push(data.rejected_by); }
    if (data.rejection_reason !== undefined) { updates.push('rejection_reason = ?'); values.push(data.rejection_reason); }
    if (data.published_url !== undefined) { updates.push('published_url = ?'); values.push(data.published_url); }
    if (data.media_urls !== undefined) { updates.push('media_urls = ?'); values.push(data.media_urls); }
    if (data.media_type !== undefined) { updates.push('media_type = ?'); values.push(data.media_type); }
    if (data.video_url !== undefined) { updates.push('video_url = ?'); values.push(data.video_url); }
    if (data.video_thumbnail !== undefined) { updates.push('video_thumbnail = ?'); values.push(data.video_thumbnail); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); values.push(data.metadata); }

    if (updates.length === 0) return content.getById(id);
    
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await client.execute({
      sql: `UPDATE content_items SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    return content.getById(id);
  },

  approve: async (id: string, approvedBy: string): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE content_items SET status = 'approved', approved_by = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [approvedBy, id],
    });
    
    await contentActivity.log(id, 'approved', approvedBy, 'Content approved');
    return content.getById(id);
  },

  reject: async (id: string, rejectedBy: string, reason?: string): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE content_items SET status = 'rejected', rejected_by = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [rejectedBy, reason || null, id],
    });
    
    await contentActivity.log(id, 'rejected', rejectedBy, reason || 'Content rejected');
    return content.getById(id);
  },

  schedule: async (id: string, scheduledFor: string): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE content_items SET status = 'scheduled', scheduled_for = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [scheduledFor, id],
    });
    
    await contentActivity.log(id, 'scheduled', 'system', `Scheduled for ${scheduledFor}`);
    return content.getById(id);
  },

  markPublished: async (id: string, publishedUrl?: string): Promise<ContentItem | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE content_items SET status = 'published', published_url = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [publishedUrl || null, id],
    });
    
    await contentActivity.log(id, 'published', 'system', publishedUrl ? `Published at ${publishedUrl}` : 'Published');
    return content.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: 'DELETE FROM content_items WHERE id = ?',
      args: [id],
    });
    return true;
  },

  getStats: async () => {
    await initializeContentSchema();
    const result = await client.execute(`
      SELECT 
        status,
        platform,
        COUNT(*) as count
      FROM content_items 
      GROUP BY status, platform
    `);
    return result.rows as unknown as { status: string; platform: string; count: number }[];
  },

  getCalendar: async (startDate: string, endDate: string): Promise<ContentItem[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: `SELECT * FROM content_items 
            WHERE scheduled_for >= ? AND scheduled_for <= ?
            AND status IN ('approved', 'scheduled', 'published')
            ORDER BY scheduled_for ASC`,
      args: [startDate, endDate],
    });
    return result.rows as unknown as ContentItem[];
  },
};

// Content activity operations
export const contentActivity = {
  getByContent: async (contentId: string): Promise<ContentActivity[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM content_activity WHERE content_id = ? ORDER BY created_at DESC',
      args: [contentId],
    });
    return result.rows as unknown as ContentActivity[];
  },

  log: async (contentId: string, action: ContentActivity['action'], actor: string, notes?: string) => {
    await initializeContentSchema();
    await client.execute({
      sql: `INSERT INTO content_activity (content_id, action, actor, notes)
            VALUES (?, ?, ?, ?)`,
      args: [contentId, action, actor, notes || null],
    });
  },

  getRecent: async (limit = 20): Promise<(ContentActivity & { content_title?: string })[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: `SELECT ca.*, ci.title as content_title 
            FROM content_activity ca 
            LEFT JOIN content_items ci ON ca.content_id = ci.id
            ORDER BY ca.created_at DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows as unknown as (ContentActivity & { content_title?: string })[];
  },
};

// Channel types
export interface Channel {
  id: string;
  name: string;
  platform: Platform;
  handle: string | null;
  url: string | null;
  created_at: string;
}

export interface ChannelMetrics {
  id: number;
  channel_id: string;
  date: string;
  subscribers: number;
  views: number;
  posts: number;
  engagement: number;
  metadata: string | null;
  created_at: string;
}

// Channel operations
export const channels = {
  getAll: async (): Promise<Channel[]> => {
    await initializeContentSchema();
    const result = await client.execute('SELECT * FROM channels ORDER BY name ASC');
    return result.rows as unknown as Channel[];
  },

  getById: async (id: string): Promise<Channel | undefined> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM channels WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as Channel | undefined;
  },

  create: async (data: { name: string; platform: Platform; handle?: string; url?: string }): Promise<Channel> => {
    await initializeContentSchema();
    const id = `ch-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    
    await client.execute({
      sql: `INSERT INTO channels (id, name, platform, handle, url) VALUES (?, ?, ?, ?, ?)`,
      args: [id, data.name, data.platform, data.handle || null, data.url || null],
    });
    
    return (await channels.getById(id))!;
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeContentSchema();
    await client.execute({
      sql: 'DELETE FROM channels WHERE id = ?',
      args: [id],
    });
    return true;
  },
};

// Channel metrics operations
export const channelMetrics = {
  record: async (channelId: string, data: { 
    date?: string; 
    subscribers?: number; 
    views?: number; 
    posts?: number;
    engagement?: number;
  }): Promise<ChannelMetrics> => {
    await initializeContentSchema();
    const date = data.date || new Date().toISOString().split('T')[0];
    
    // Upsert - update if exists, insert if not
    await client.execute({
      sql: `INSERT INTO channel_metrics (channel_id, date, subscribers, views, posts, engagement)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(channel_id, date) DO UPDATE SET
              subscribers = COALESCE(excluded.subscribers, channel_metrics.subscribers),
              views = COALESCE(excluded.views, channel_metrics.views),
              posts = COALESCE(excluded.posts, channel_metrics.posts),
              engagement = COALESCE(excluded.engagement, channel_metrics.engagement)`,
      args: [channelId, date, data.subscribers || 0, data.views || 0, data.posts || 0, data.engagement || 0],
    });
    
    const result = await client.execute({
      sql: 'SELECT * FROM channel_metrics WHERE channel_id = ? AND date = ?',
      args: [channelId, date],
    });
    return result.rows[0] as unknown as ChannelMetrics;
  },

  getByChannel: async (channelId: string, days = 30): Promise<ChannelMetrics[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: `SELECT * FROM channel_metrics 
            WHERE channel_id = ? 
            AND date >= date('now', '-' || ? || ' days')
            ORDER BY date DESC`,
      args: [channelId, days],
    });
    return result.rows as unknown as ChannelMetrics[];
  },

  getLatest: async (channelId: string): Promise<ChannelMetrics | undefined> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM channel_metrics WHERE channel_id = ? ORDER BY date DESC LIMIT 1',
      args: [channelId],
    });
    return result.rows[0] as unknown as ChannelMetrics | undefined;
  },

  getSummary: async (channelId: string): Promise<{
    daily: ChannelMetrics | undefined;
    weeklyGrowth: { subscribers: number; views: number };
    monthlyGrowth: { subscribers: number; views: number };
  }> => {
    await initializeContentSchema();
    
    // Get latest
    const latest = await channelMetrics.getLatest(channelId);
    
    // Get 7 days ago
    const weekAgoResult = await client.execute({
      sql: `SELECT * FROM channel_metrics 
            WHERE channel_id = ? AND date <= date('now', '-7 days')
            ORDER BY date DESC LIMIT 1`,
      args: [channelId],
    });
    const weekAgo = weekAgoResult.rows[0] as unknown as ChannelMetrics | undefined;
    
    // Get 30 days ago
    const monthAgoResult = await client.execute({
      sql: `SELECT * FROM channel_metrics 
            WHERE channel_id = ? AND date <= date('now', '-30 days')
            ORDER BY date DESC LIMIT 1`,
      args: [channelId],
    });
    const monthAgo = monthAgoResult.rows[0] as unknown as ChannelMetrics | undefined;
    
    return {
      daily: latest,
      weeklyGrowth: {
        subscribers: latest && weekAgo ? latest.subscribers - weekAgo.subscribers : 0,
        views: latest && weekAgo ? latest.views - weekAgo.views : 0,
      },
      monthlyGrowth: {
        subscribers: latest && monthAgo ? latest.subscribers - monthAgo.subscribers : 0,
        views: latest && monthAgo ? latest.views - monthAgo.views : 0,
      },
    };
  },

  getAllChannelsSummary: async (): Promise<Array<{
    channel: Channel;
    latest: ChannelMetrics | undefined;
    weeklyGrowth: { subscribers: number; views: number };
    monthlyGrowth: { subscribers: number; views: number };
  }>> => {
    await initializeContentSchema();
    const allChannels = await channels.getAll();
    
    const summaries = await Promise.all(
      allChannels.map(async (channel) => {
        const summary = await channelMetrics.getSummary(channel.id);
        return {
          channel,
          latest: summary.daily,
          weeklyGrowth: summary.weeklyGrowth,
          monthlyGrowth: summary.monthlyGrowth,
        };
      })
    );
    
    return summaries;
  },
};

// Broadcast types
export type BroadcastType = 'email' | 'sms';
export type BroadcastStatus = 'draft' | 'pending' | 'approved' | 'scheduled' | 'sent' | 'rejected';

export interface Broadcast {
  id: string;
  title: string;
  subject: string | null;
  body: string;
  type: BroadcastType;
  status: BroadcastStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  segment: string | null;
  campaign: string | null;
  recipient_count: number;
  open_rate: number | null;
  click_rate: number | null;
  created_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface BroadcastActivity {
  id: number;
  broadcast_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'scheduled' | 'sent';
  actor: string;
  notes: string | null;
  created_at: string;
}

// Generate unique broadcast ID
function generateBroadcastId(): string {
  return `brc-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// Broadcast operations
export const broadcasts = {
  getAll: async (filters?: { status?: BroadcastStatus; type?: BroadcastType }): Promise<Broadcast[]> => {
    await initializeContentSchema();
    
    let sql = 'SELECT * FROM broadcasts WHERE 1=1';
    const args: string[] = [];
    
    if (filters?.status) {
      sql += ' AND status = ?';
      args.push(filters.status);
    }
    if (filters?.type) {
      sql += ' AND type = ?';
      args.push(filters.type);
    }
    
    sql += ' ORDER BY COALESCE(scheduled_for, created_at) DESC';
    
    const result = await client.execute({ sql, args });
    return result.rows as unknown as Broadcast[];
  },

  getPending: async (): Promise<Broadcast[]> => {
    await initializeContentSchema();
    const result = await client.execute(
      "SELECT * FROM broadcasts WHERE status = 'pending' ORDER BY created_at ASC"
    );
    return result.rows as unknown as Broadcast[];
  },

  getScheduled: async (): Promise<Broadcast[]> => {
    await initializeContentSchema();
    const result = await client.execute(
      "SELECT * FROM broadcasts WHERE status IN ('approved', 'scheduled') ORDER BY scheduled_for ASC"
    );
    return result.rows as unknown as Broadcast[];
  },

  getById: async (id: string): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM broadcasts WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as Broadcast | undefined;
  },

  create: async (data: {
    title: string;
    subject?: string;
    body: string;
    type: BroadcastType;
    scheduled_for?: string;
    segment?: string;
    campaign?: string;
    recipient_count?: number;
    created_by?: string;
    status?: BroadcastStatus;
  }): Promise<Broadcast> => {
    await initializeContentSchema();
    const id = generateBroadcastId();
    
    await client.execute({
      sql: `INSERT INTO broadcasts (id, title, subject, body, type, status, scheduled_for, segment, campaign, recipient_count, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title,
        data.subject || null,
        data.body,
        data.type,
        data.status || 'pending',
        data.scheduled_for || null,
        data.segment || null,
        data.campaign || null,
        data.recipient_count || 0,
        data.created_by || 'solomon',
      ],
    });
    
    await broadcastActivity.log(id, 'created', data.created_by || 'solomon', `Created ${data.type} broadcast`);
    
    return (await broadcasts.getById(id))!;
  },

  update: async (id: string, data: Partial<Broadcast>): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.subject !== undefined) { updates.push('subject = ?'); values.push(data.subject); }
    if (data.body !== undefined) { updates.push('body = ?'); values.push(data.body); }
    if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    if (data.scheduled_for !== undefined) { updates.push('scheduled_for = ?'); values.push(data.scheduled_for); }
    if (data.sent_at !== undefined) { updates.push('sent_at = ?'); values.push(data.sent_at); }
    if (data.segment !== undefined) { updates.push('segment = ?'); values.push(data.segment); }
    if (data.campaign !== undefined) { updates.push('campaign = ?'); values.push(data.campaign); }
    if (data.recipient_count !== undefined) { updates.push('recipient_count = ?'); values.push(data.recipient_count); }
    if (data.open_rate !== undefined) { updates.push('open_rate = ?'); values.push(data.open_rate); }
    if (data.click_rate !== undefined) { updates.push('click_rate = ?'); values.push(data.click_rate); }
    if (data.approved_by !== undefined) { updates.push('approved_by = ?'); values.push(data.approved_by); }
    if (data.rejected_by !== undefined) { updates.push('rejected_by = ?'); values.push(data.rejected_by); }
    if (data.rejection_reason !== undefined) { updates.push('rejection_reason = ?'); values.push(data.rejection_reason); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); values.push(data.metadata); }

    if (updates.length === 0) return broadcasts.getById(id);
    
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await client.execute({
      sql: `UPDATE broadcasts SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    return broadcasts.getById(id);
  },

  approve: async (id: string, approvedBy: string, scheduledFor?: string): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    
    const updateData: Partial<Broadcast> = {
      status: scheduledFor ? 'scheduled' : 'approved',
      approved_by: approvedBy,
    };
    if (scheduledFor) {
      updateData.scheduled_for = scheduledFor;
    }
    
    await client.execute({
      sql: `UPDATE broadcasts SET status = ?, approved_by = ?, scheduled_for = COALESCE(?, scheduled_for), updated_at = datetime('now') WHERE id = ?`,
      args: [updateData.status!, approvedBy, scheduledFor || null, id],
    });
    
    await broadcastActivity.log(id, 'approved', approvedBy, scheduledFor ? `Approved and scheduled for ${scheduledFor}` : 'Broadcast approved');
    return broadcasts.getById(id);
  },

  reject: async (id: string, rejectedBy: string, reason?: string): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE broadcasts SET status = 'rejected', rejected_by = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [rejectedBy, reason || null, id],
    });
    
    await broadcastActivity.log(id, 'rejected', rejectedBy, reason || 'Broadcast rejected');
    return broadcasts.getById(id);
  },

  schedule: async (id: string, scheduledFor: string): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: `UPDATE broadcasts SET status = 'scheduled', scheduled_for = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [scheduledFor, id],
    });
    
    await broadcastActivity.log(id, 'scheduled', 'system', `Scheduled for ${scheduledFor}`);
    return broadcasts.getById(id);
  },

  markSent: async (id: string, recipientCount?: number, openRate?: number, clickRate?: number): Promise<Broadcast | undefined> => {
    await initializeContentSchema();
    
    const updates: string[] = ["status = 'sent'", "sent_at = datetime('now')", "updated_at = datetime('now')"];
    const args: (string | number | null)[] = [];
    
    if (recipientCount !== undefined) {
      updates.push('recipient_count = ?');
      args.push(recipientCount);
    }
    if (openRate !== undefined) {
      updates.push('open_rate = ?');
      args.push(openRate);
    }
    if (clickRate !== undefined) {
      updates.push('click_rate = ?');
      args.push(clickRate);
    }
    args.push(id);
    
    await client.execute({
      sql: `UPDATE broadcasts SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });
    
    await broadcastActivity.log(id, 'sent', 'system', `Sent to ${recipientCount || 0} recipients`);
    return broadcasts.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeContentSchema();
    
    await client.execute({
      sql: 'DELETE FROM broadcasts WHERE id = ?',
      args: [id],
    });
    return true;
  },

  getStats: async (): Promise<{
    pendingEmails: number;
    pendingSms: number;
    scheduled: number;
    sent: number;
    total: number;
  }> => {
    await initializeContentSchema();
    const result = await client.execute(`
      SELECT 
        status,
        type,
        COUNT(*) as count
      FROM broadcasts 
      GROUP BY status, type
    `);
    
    const rows = result.rows as unknown as { status: string; type: string; count: number }[];
    
    let pendingEmails = 0;
    let pendingSms = 0;
    let scheduled = 0;
    let sent = 0;
    let total = 0;
    
    for (const row of rows) {
      total += row.count;
      if (row.status === 'pending') {
        if (row.type === 'email') pendingEmails += row.count;
        if (row.type === 'sms') pendingSms += row.count;
      }
      if (row.status === 'scheduled' || row.status === 'approved') {
        scheduled += row.count;
      }
      if (row.status === 'sent') {
        sent += row.count;
      }
    }
    
    return { pendingEmails, pendingSms, scheduled, sent, total };
  },
};

// Broadcast activity operations
export const broadcastActivity = {
  getByBroadcast: async (broadcastId: string): Promise<BroadcastActivity[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM broadcast_activity WHERE broadcast_id = ? ORDER BY created_at DESC',
      args: [broadcastId],
    });
    return result.rows as unknown as BroadcastActivity[];
  },

  log: async (broadcastId: string, action: BroadcastActivity['action'], actor: string, notes?: string) => {
    await initializeContentSchema();
    await client.execute({
      sql: `INSERT INTO broadcast_activity (broadcast_id, action, actor, notes)
            VALUES (?, ?, ?, ?)`,
      args: [broadcastId, action, actor, notes || null],
    });
  },

  getRecent: async (limit = 20): Promise<(BroadcastActivity & { broadcast_title?: string })[]> => {
    await initializeContentSchema();
    const result = await client.execute({
      sql: `SELECT ba.*, b.title as broadcast_title 
            FROM broadcast_activity ba 
            LEFT JOIN broadcasts b ON ba.broadcast_id = b.id
            ORDER BY ba.created_at DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows as unknown as (BroadcastActivity & { broadcast_title?: string })[];
  },
};

export default client;
