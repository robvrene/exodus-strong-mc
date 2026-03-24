/**
 * Exodus Strong Mission Control — Database Seed Script
 * Run: npx tsx scripts/seed.ts
 *
 * Initializes the Turso DB with:
 *  - A live "Exodus Strong" demo record
 *  - Week 1 task kanban (seeded from The Nehemiah Protocol)
 *  - Initial revenue plan snapshot
 */

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("❌  TURSO_DATABASE_URL not set. Copy .env.example → .env.local and fill it in.");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? undefined });

// ─── Migrations ─────────────────────────────────────────────────────────────

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS demos (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    volunteer_name TEXT,
    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'foundation',
    revenue_goal INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    elapsed_seconds INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    demo_id TEXT REFERENCES demos(id),
    task_name TEXT NOT NULL,
    wave INTEGER,
    status TEXT DEFAULT 'todo',
    output_type TEXT,
    destination TEXT,
    output_path TEXT,
    output_url TEXT,
    duration_seconds INTEGER,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    demo_id TEXT REFERENCES demos(id),
    event_type TEXT NOT NULL,
    signal TEXT,
    payload JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS revenue_plans (
    id TEXT PRIMARY KEY,
    demo_id TEXT REFERENCES demos(id),
    revenue_goal INTEGER,
    promote_prospect TEXT,
    promote_paid TEXT,
    promote_publish TEXT,
    promote_partnership TEXT,
    profit_cart TEXT,
    profit_call TEXT,
    profit_crowd TEXT,
    profit_ai_sales TEXT,
    produce_selections JSON,
    locked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

// ─── Seed Data ───────────────────────────────────────────────────────────────

const DEMO_ID = "exodus-w1";

const tasks = [
  // WAVE 1 — Compliance (The Levite)
  { id: "lv-1", name: "The Levite: FastAPI endpoint live on Solomon2", wave: 1, status: "done",       output_type: "agent",    destination: "Solomon2" },
  { id: "lv-2", name: "Forbidden terms database loaded (6 product lines)", wave: 1, status: "done",  output_type: "database", destination: "Solomon2" },
  { id: "lv-3", name: "Compliance gate: all content scanned before delivery", wave: 1, status: "done", output_type: "api",    destination: "Solomon2" },

  // WAVE 1 — Cold Email Infrastructure
  { id: "ce-1", name: "Purchase cold outreach domains (never exodusstrong.com)", wave: 1, status: "todo", output_type: "domain", destination: "Instantly" },
  { id: "ce-2", name: "Configure SPF, DKIM, DMARC on each domain", wave: 1, status: "todo", output_type: "dns",  destination: "Domain Registrar" },
  { id: "ce-3", name: "Set up Instantly/Smartlead — begin warmup (10–20/day)", wave: 1, status: "todo", output_type: "email", destination: "Instantly" },
  { id: "ce-4", name: "Define B2B ICP: wellness clinics, church ministries, podcast producers", wave: 1, status: "todo", output_type: "doc", destination: "Google Drive" },

  // WAVE 1 — Red Wave Phase 1
  { id: "rw-1", name: "Register on PodMatch, MatchMaker.fm, PodcastGuests.com", wave: 1, status: "todo", output_type: "profile", destination: "Podcast Platforms" },
  { id: "rw-2", name: "Call WBAP 820 AM (Joe Pags Show — Dallas local)", wave: 1, status: "todo", output_type: "call", destination: "WBAP" },
  { id: "rw-3", name: "Submit top 5 guest apps: Dana Loesch, Keep The Faith, Biohacker Babes, EWTN, Made For This", wave: 1, status: "todo", output_type: "application", destination: "Podcast Hosts" },
  { id: "rw-4", name: "Request Actovision build /radio, /faith, /biohack landing pages", wave: 1, status: "todo", output_type: "page", destination: "exodusstrong.com" },

  // WAVE 1 — Paid Ads (Laurel Phase 1)
  { id: "pa-1", name: "Select 3 videos: My Exodus / Light Code educational content", wave: 1, status: "todo", output_type: "video", destination: "Facebook Ads" },
  { id: "pa-2", name: "Launch Video Views campaigns — $5/day × 3 = $15/day total", wave: 1, status: "todo", output_type: "campaign", destination: "Facebook Ads Manager" },
  { id: "pa-3", name: "Monitor CPV — target $0.07–$0.50 per 25% view", wave: 1, status: "todo", output_type: "report", destination: "The Watchman" },

  // WAVE 1 — Gate Actions
  { id: "g1-1", name: "GATE I: Contact Hyman Phelps (FDA specialists)", wave: 1, status: "todo", output_type: "email", destination: "Regulatory Counsel" },
  { id: "g1-2", name: "GATE I: Contact Venable LLP (FTC advertising)", wave: 1, status: "todo", output_type: "email", destination: "Regulatory Counsel" },
  { id: "g1-3", name: "GATE I: Request referrals from Kevin Troutman + Goletti network", wave: 1, status: "todo", output_type: "call", destination: "Referral Network" },

  // WAVE 2 — The Scribe + Multiplier
  { id: "sc-1", name: "Deploy The Scribe on Solomon2 — build 4 email sequences (DRAFT)", wave: 2, status: "todo", output_type: "agent", destination: "Solomon2" },
  { id: "sc-2", name: "Scribe: God Algorithm → Quiz Funnel Bridge (5 emails)", wave: 2, status: "todo", output_type: "sequence", destination: "GHL / Klaviyo" },
  { id: "sc-3", name: "Scribe: Book Buyer → Subscription Ascension (7 emails)", wave: 2, status: "todo", output_type: "sequence", destination: "GHL / Klaviyo" },
  { id: "mp-1", name: "Deploy The Multiplier on Solomon2 — 1 video → 10–15 assets", wave: 2, status: "todo", output_type: "agent", destination: "Solomon2" },

  // WAVE 3 — Revenue Agents
  { id: "me-1", name: "Deploy The Merchant on Solomon — cart recovery + upsell engine", wave: 3, status: "todo", output_type: "agent", destination: "Solomon" },
  { id: "wa-1", name: "Deploy The Watchman on Solomon — 6AM daily brief + Sunday War Council", wave: 3, status: "todo", output_type: "agent", destination: "Solomon" },
  { id: "he-1", name: "Deploy The Herald on Solomon — VSL, quiz, advertorial, offer stack", wave: 3, status: "todo", output_type: "agent", destination: "Solomon" },
  { id: "he-2", name: "Herald: Build AC Ascension Funnel copy (Zipify OCU)", wave: 3, status: "todo", output_type: "copy", destination: "Actovision" },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🔧  Running migrations...");
  for (const sql of MIGRATIONS) {
    await db.execute(sql);
  }
  console.log("✓  Migrations complete");

  // Clear old seed data if re-running
  await db.execute({ sql: "DELETE FROM tasks WHERE demo_id = ?", args: [DEMO_ID] });
  await db.execute({ sql: "DELETE FROM events WHERE demo_id = ?", args: [DEMO_ID] });
  await db.execute({ sql: "DELETE FROM revenue_plans WHERE demo_id = ?", args: [DEMO_ID] });
  await db.execute({ sql: "DELETE FROM demos WHERE id = ?", args: [DEMO_ID] });

  // Insert demo record
  await db.execute({
    sql: `INSERT INTO demos (id, business_name, volunteer_name, status, phase, revenue_goal)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [DEMO_ID, "Exodus Strong", "Rob René", "active", "foundation", 250000],
  });
  console.log("✓  Demo record created");

  // Insert tasks
  for (const t of tasks) {
    await db.execute({
      sql: `INSERT INTO tasks (id, demo_id, task_name, wave, status, output_type, destination)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [t.id, DEMO_ID, t.name, t.wave, t.status, t.output_type, t.destination],
    });
  }
  console.log(`✓  ${tasks.length} tasks seeded`);

  // Insert seed event
  await db.execute({
    sql: `INSERT INTO events (id, demo_id, event_type, signal, payload)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      "seed-evt-1",
      DEMO_ID,
      "phase_update",
      "foundation",
      JSON.stringify({
        demoId: DEMO_ID,
        businessName: "Exodus Strong",
        volunteerName: "Rob René",
        phase: "foundation",
      }),
    ],
  });

  // Insert revenue plan snapshot
  await db.execute({
    sql: `INSERT INTO revenue_plans (id, demo_id, revenue_goal, promote_prospect, promote_paid, promote_publish, promote_partnership, profit_cart, profit_call, profit_crowd, profit_ai_sales, produce_selections)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "rp-exodus-w1",
      DEMO_ID,
      250000,
      "Cold email: 3 domains warming, B2B ICP defined",
      "Laurel Method Phase 1: $15/day video views",
      "Light Code Book ($47) + $27 Challenge Guide (Month 2)",
      "Red Wave Phase 1: PodMatch, free guest appearances",
      "AC Ascension Funnel: $47 → OB → $67 H₂ → device → $60/mo",
      "The Centurion (Week 7): high-ticket DM qualifier",
      "Warm list launch (Week 5–6): 8,400 Beehiiv subs — GATE II PROTECTED",
      "The Centurion deploys Week 7",
      JSON.stringify(["Light Code Book", "Molecular Hydrogen", "RLT Device", "Subscription"]),
    ],
  });

  console.log("✓  Revenue plan snapshot seeded");
  console.log("\n🏛️  Exodus Strong Mission Control database initialized.");
  console.log(`   Demo ID: ${DEMO_ID}`);
  console.log("   Phase: Foundation (Week 1 of 12)");
  console.log(`   Tasks: ${tasks.length} seeded across Waves 1–3`);
  console.log("\n   The Nehemiah Protocol is live. Execute.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
