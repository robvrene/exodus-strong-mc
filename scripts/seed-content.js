const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:data/mission-control.db'
});

async function main() {
  // Create tables
  await client.batch([
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
    )`
  ], 'write');

  console.log('Tables created');

  // Content data
  const storyImage = 'https://v3b.fal.media/files/b/0a8efced/DVzs00psRvHvaT_cU9p-A_image.webp';
  const carousel1 = 'https://v3b.fal.media/files/b/0a8efced/kZnVPhcF8LD2S_s1zcNei_image.webp';
  const carousel2 = 'https://v3b.fal.media/files/b/0a8efcee/2xBtyqp7YXOpst-nNIZiz_image.webp';
  const carousel3 = 'https://v3b.fal.media/files/b/0a8efcee/pzZ97sKUW-KRKSuscS5gx_image.webp';
  const videoPlaceholder = 'https://v3b.fal.media/files/b/0a8efcc6/2OTSUhg-PHY2Md2jFbwtV_image.webp';
  const emailPlaceholder = 'https://v3b.fal.media/files/b/0a8efc5b/4CyxpyBkchjJwQOUVIFxs_image.webp';

  // Insert content
  const content = [
    // Story
    {
      id: `content-${Date.now()}-1`,
      title: 'Daily Story - AI Productivity',
      copy: '🤖 My AI assistant just saved me 4 hours today.\n\nNot kidding.\n\nSwipe up to see how →',
      image_url: storyImage,
      media_type: 'image',
      platform: 'instagram',
      hashtags: '#AI #Productivity #Business',
      created_by: 'Solomon'
    },
    // Carousel
    {
      id: `content-${Date.now()}-2`,
      title: 'Carousel - Builders vs Watchers',
      copy: '🚨 The AI gap is widening.\n\nSlide 1: This was you 6 months ago\nSlide 2: This is you with AI\nSlide 3: The transformation\n\nWhich side are you on?\n\nComment "BUILD" if you are ready to stop watching. 👇',
      image_url: carousel1,
      media_type: 'carousel',
      media_urls: JSON.stringify([carousel1, carousel2, carousel3]),
      platform: 'instagram',
      hashtags: '#AIWorkforce #Automation #BuildersNotWatchers',
      created_by: 'Solomon'
    },
    // Reel 1 - Aaron records
    {
      id: `content-${Date.now()}-3`,
      title: 'Reel #1 - Hook: I Deleted My Project Manager',
      copy: 'HOOK: "I deleted my project manager yesterday..."\n\nBODY: "...and replaced them with an AI that works 24/7, never complains, and cost me $0.03 per task."\n\n"Here is what it does:"\n- Assigns tasks automatically\n- Follows up on deadlines\n- Sends me a daily briefing\n\nCTA: "Comment PM if you want to see how I built it."',
      image_url: videoPlaceholder,
      video_thumbnail: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#AIAssistant #ProjectManagement #Automation',
      created_by: 'Solomon',
      metadata: JSON.stringify({needs_recording: true, script_included: true})
    },
    // Reel 2 - Aaron records  
    {
      id: `content-${Date.now()}-4`,
      title: 'Reel #2 - The 4 Hour vs 12 Minute Follow-up',
      copy: 'HOOK: "This business owner spent 4 hours following up with leads yesterday..."\n\nBODY: "I did the same thing in 12 minutes."\n\n"Same number of leads. Same personalization. Same results."\n\n"The difference? I have an AI workforce. They don not."\n\nCTA: "Comment SHOW ME and I will send you the exact workflow."',
      image_url: videoPlaceholder,
      video_thumbnail: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#LeadGeneration #AIWorkforce #TimeIsMoney',
      created_by: 'Solomon',
      metadata: JSON.stringify({needs_recording: true, script_included: true})
    },
    // Reel 3 - Aaron records
    {
      id: `content-${Date.now()}-5`,
      title: 'Reel #3 - Stop Learning Start Building',
      copy: 'HOOK: "Every AI course I have taken was useless..."\n\nBODY: "Until I stopped taking courses."\n\n"The problem with AI courses: You learn concepts."\n"What you actually need: Built systems."\n\n"We do not teach AI. We BUILD your AI workforce with you in 3 days."\n\nCTA: "Comment BUILD if you want to actually build something."',
      image_url: videoPlaceholder,
      video_thumbnail: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#AIImplementation #NoMoreCourses #JustBuild',
      created_by: 'Solomon',
      metadata: JSON.stringify({needs_recording: true, script_included: true})
    }
  ];

  for (const item of content) {
    await client.execute({
      sql: `INSERT INTO content_items (id, title, copy, image_url, media_type, media_urls, video_thumbnail, platform, status, hashtags, created_by, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [item.id, item.title, item.copy, item.image_url, item.media_type, item.media_urls || null, item.video_thumbnail || null, item.platform, item.hashtags, item.created_by, item.metadata || null]
    });
    console.log('✅ Created:', item.title);
  }

  // Insert broadcasts
  const broadcasts = [
    {
      id: `bcast-${Date.now()}-1`,
      title: 'Daily Newsletter - Feb 18',
      subject: 'The AI workforce is here. Are you building or watching?',
      body: `Good morning!

Yesterday I watched a business owner spend 4 hours manually following up with leads.

Meanwhile, my AI workforce sent 847 personalized follow-ups while I had breakfast.

Same result. 4 hours vs 12 minutes.

This is the gap between builders and watchers.

Reply "BUILD" for details.

- Joseph Aaron`,
      type: 'email',
      segment: 'Main List',
      recipient_count: 12847
    },
    {
      id: `bcast-${Date.now()}-2`,
      title: 'Promo Email - 3 Day Workshop',
      subject: '🤖 Build your AI workforce in 3 days (no coding)',
      body: `Quick question:

If you could clone yourself...

Would you use it to do MORE work?
Or to finally take a breath?

This week we are running a 3-day workshop where you will literally build your first AI employee.

Day 1: Your AI Lead Gen Machine
Day 2: Your AI Follow-Up System  
Day 3: Your AI Content Factory

Only 50 spots. We are at 31.

Want in? Reply "IM IN" and I will send the link.

- Joseph Aaron`,
      type: 'email',
      segment: 'Engaged Leads',
      recipient_count: 4521
    }
  ];

  for (const b of broadcasts) {
    await client.execute({
      sql: `INSERT INTO broadcasts (id, title, subject, body, type, status, segment, recipient_count, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, 'Solomon', datetime('now'), datetime('now'))`,
      args: [b.id, b.title, b.subject, b.body, b.type, b.segment, b.recipient_count]
    });
    console.log('✅ Created broadcast:', b.title);
  }

  console.log('\n🎉 All content created!');
}

main().catch(console.error);
