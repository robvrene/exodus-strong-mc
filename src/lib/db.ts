import { createClient, type Client, type InStatement } from "@libsql/client";

// ---------------------------------------------------------------------------
// Singleton Turso / libSQL client
// ---------------------------------------------------------------------------

let _client: Client | null = null;
let _migrated = false;

function getClient(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  if (url) {
    _client = createClient({ url, authToken: authToken || undefined });
    console.log("[DB] Connected to Turso:", url);
  } else {
    // Fallback: in-memory SQLite (works on Vercel's read-only filesystem)
    // Data resets per cold start — configure TURSO_DATABASE_URL for persistence
    _client = createClient({ url: ":memory:" });
    console.warn(
      "[DB] No DATABASE_URL — using in-memory SQLite (data will not persist across restarts)"
    );
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Auto-migration — runs once per process
// ---------------------------------------------------------------------------

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS demos (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    volunteer_name TEXT,
    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'startup',
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

  `CREATE TABLE IF NOT EXISTS journal (
    date TEXT PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

async function runMigrations(): Promise<void> {
  if (_migrated) return;
  const db = getClient();
  for (const sql of MIGRATIONS) {
    await db.execute(sql);
  }
  _migrated = true;
  console.log("[DB] Migrations complete");
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export async function db() {
  await runMigrations();
  return getClient();
}

/** Shortcut: execute a single statement */
export async function execute(sql: string, args?: Record<string, unknown>) {
  const client = await db();
  return client.execute({ sql, args: args ?? {} } as InStatement);
}

/** Shortcut: execute a batch of statements in a transaction */
export async function batch(stmts: InStatement[]) {
  const client = await db();
  return client.batch(stmts, "write");
}

/** Generate a short unique ID */
export function newId(): string {
  return crypto.randomUUID().slice(0, 8);
}
