require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkContent() {
  // Check what tables exist
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables:", tables.rows.map(r => r.name));
  
  // Check for content table
  const contentTables = tables.rows.filter(r => 
    r.name.toLowerCase().includes('content') || 
    r.name.toLowerCase().includes('post') ||
    r.name.toLowerCase().includes('schedule')
  );
  
  if (contentTables.length > 0) {
    for (const table of contentTables) {
      console.log(`\n--- ${table.name} ---`);
      const rows = await client.execute(`SELECT * FROM ${table.name} LIMIT 20`);
      console.log(JSON.stringify(rows.rows, null, 2));
    }
  }
}

checkContent().catch(console.error);
