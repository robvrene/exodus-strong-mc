require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  const storyImage = 'https://v3b.fal.media/files/b/0a8efced/DVzs00psRvHvaT_cU9p-A_image.webp';
  const carousel1 = 'https://v3b.fal.media/files/b/0a8efced/kZnVPhcF8LD2S_s1zcNei_image.webp';
  const carousel2 = 'https://v3b.fal.media/files/b/0a8efcee/2xBtyqp7YXOpst-nNIZiz_image.webp';
  const carousel3 = 'https://v3b.fal.media/files/b/0a8efcee/pzZ97sKUW-KRKSuscS5gx_image.webp';
  const videoPlaceholder = 'https://v3b.fal.media/files/b/0a8efcc6/2OTSUhg-PHY2Md2jFbwtV_image.webp';

  const content = [
    {
      id: 'cnt-demo-' + Date.now() + '-1',
      title: '📱 Daily Story - AI Productivity',
      copy: '🤖 My AI assistant just saved me 4 hours today.\n\nNot kidding.\n\nSwipe up to see how →',
      image_url: storyImage,
      media_type: 'image',
      platform: 'instagram',
      hashtags: '#AI #Productivity #Business',
      created_by: 'Solomon'
    },
    {
      id: 'cnt-demo-' + Date.now() + '-2',
      title: '🎠 Carousel - Builders vs Watchers',
      copy: '🚨 The AI gap is widening.\n\nSlide 1: This was you 6 months ago\nSlide 2: This is you with AI\nSlide 3: The transformation\n\nWhich side are you on?\n\nComment "BUILD" if you are ready to stop watching. 👇',
      image_url: carousel1,
      media_type: 'carousel',
      media_urls: JSON.stringify([carousel1, carousel2, carousel3]),
      platform: 'instagram',
      hashtags: '#AIWorkforce #Automation #BuildersNotWatchers',
      created_by: 'Solomon'
    },
    {
      id: 'cnt-demo-' + Date.now() + '-3',
      title: '🎬 Reel #1 - I Deleted My Project Manager',
      copy: 'HOOK: "I deleted my project manager yesterday..."\n\nBODY: "...and replaced them with an AI that works 24/7, never complains, and cost me $0.03 per task."\n\nCTA: "Comment PM if you want to see how I built it."',
      image_url: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#AIAssistant #ProjectManagement #Automation',
      created_by: 'Solomon'
    },
    {
      id: 'cnt-demo-' + Date.now() + '-4',
      title: '🎬 Reel #2 - 4 Hours vs 12 Minutes',
      copy: 'HOOK: "This business owner spent 4 hours following up with leads yesterday..."\n\nBODY: "I did the same thing in 12 minutes. Same leads. Same results."\n\nCTA: "Comment SHOW ME and I will send you the exact workflow."',
      image_url: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#LeadGeneration #AIWorkforce #TimeIsMoney',
      created_by: 'Solomon'
    },
    {
      id: 'cnt-demo-' + Date.now() + '-5',
      title: '🎬 Reel #3 - Stop Learning Start Building',
      copy: 'HOOK: "Every AI course I have taken was useless..."\n\nBODY: "We do not teach AI. We BUILD your AI workforce with you in 3 days."\n\nCTA: "Comment BUILD if you want to actually build something."',
      image_url: videoPlaceholder,
      media_type: 'reel',
      platform: 'instagram',
      hashtags: '#AIImplementation #NoMoreCourses #JustBuild',
      created_by: 'Solomon'
    }
  ];

  for (const item of content) {
    await client.execute({
      sql: `INSERT INTO content_items (id, title, copy, image_url, media_type, media_urls, platform, status, hashtags, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))`,
      args: [item.id, item.title, item.copy, item.image_url, item.media_type, item.media_urls || null, item.platform, item.hashtags, item.created_by]
    });
    console.log('✅', item.title);
  }

  // Add broadcasts
  await client.execute({
    sql: `INSERT INTO broadcasts (id, title, subject, body, type, status, segment, recipient_count, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'email', 'pending', ?, ?, 'Solomon', datetime('now'), datetime('now'))`,
    args: ['bcast-demo-' + Date.now() + '-1', '📧 Daily Newsletter - Feb 18', 'The AI workforce is here. Are you building or watching?', 'Good morning!\n\nYesterday I watched a business owner spend 4 hours following up.\n\nMy AI did it in 12 minutes.\n\nReply BUILD for details.\n\n- Joseph Aaron', 'Main List', 12847]
  });
  console.log('✅ Newsletter');

  await client.execute({
    sql: `INSERT INTO broadcasts (id, title, subject, body, type, status, segment, recipient_count, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'email', 'pending', ?, ?, 'Solomon', datetime('now'), datetime('now'))`,
    args: ['bcast-demo-' + Date.now() + '-2', '📧 Promo - 3 Day Workshop', '🤖 Build your AI workforce in 3 days', 'This week: 3-day workshop to build your first AI employee.\n\nDay 1: AI Lead Gen\nDay 2: AI Follow-Up\nDay 3: AI Content Factory\n\nOnly 50 spots. Reply IM IN.\n\n- Joseph Aaron', 'Engaged Leads', 4521]
  });
  console.log('✅ Promo Email');

  console.log('\n🎉 Done! Refresh Mission Control.');
}

main().catch(console.error);
