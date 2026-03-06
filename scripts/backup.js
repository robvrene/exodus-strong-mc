#!/usr/bin/env node
/**
 * Mission Control Database Backup Script
 * 
 * Exports all data from Turso database and uploads to Google Drive.
 * Maintains last 30 backups, deletes older ones.
 * 
 * Usage: node backup.js
 * 
 * Required:
 * - config/turso.json (database credentials)
 * - config/google-service-account.json (Google API credentials)
 */

const { createClient } = require('@libsql/client');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const GOOGLE_DRIVE_FOLDER_ID = '1QfPlBMW1Jxu7KLPpKeYdO7rX5E7I5y1W'; // AIM Master Brain > Memory
const IMPERSONATION_EMAIL = 'solomon@multiplyinc.com';
const MAX_BACKUPS = 30;
const BACKUP_PREFIX = 'mission-control-backup-';

// Load credentials
const configDir = path.resolve(__dirname, '../../config');
const tursoConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'turso.json'), 'utf-8'));
const googleServiceAccount = JSON.parse(fs.readFileSync(path.join(configDir, 'google-service-account.json'), 'utf-8'));

// Initialize Turso client
const tursoClient = createClient({
  url: tursoConfig.database_url,
  authToken: tursoConfig.auth_token,
});

// Initialize Google Drive API with impersonation
async function getGoogleDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: googleServiceAccount,
    scopes: ['https://www.googleapis.com/auth/drive'],
    clientOptions: {
      subject: IMPERSONATION_EMAIL,
    },
  });
  
  return google.drive({ version: 'v3', auth });
}

// Export all data from Turso
async function exportDatabase() {
  console.log('📊 Exporting database...');
  
  const [
    projectsResult,
    tasksResult,
    subtasksResult,
    commentsResult,
    activityResult,
    linksResult,
  ] = await Promise.all([
    tursoClient.execute('SELECT * FROM missions ORDER BY created_at DESC'),
    tursoClient.execute('SELECT * FROM tasks ORDER BY created_at DESC'),
    tursoClient.execute('SELECT * FROM subtasks ORDER BY task_id, position ASC'),
    tursoClient.execute('SELECT * FROM comments ORDER BY task_id, created_at ASC'),
    tursoClient.execute('SELECT * FROM activity ORDER BY created_at DESC'),
    tursoClient.execute('SELECT * FROM links ORDER BY task_id, created_at DESC'),
  ]);

  const backup = {
    exported_at: new Date().toISOString(),
    projects: projectsResult.rows,
    tasks: tasksResult.rows,
    subtasks: subtasksResult.rows,
    comments: commentsResult.rows,
    activity: activityResult.rows,
    links: linksResult.rows,
  };

  console.log(`  ✓ Projects: ${backup.projects.length}`);
  console.log(`  ✓ Tasks: ${backup.tasks.length}`);
  console.log(`  ✓ Subtasks: ${backup.subtasks.length}`);
  console.log(`  ✓ Comments: ${backup.comments.length}`);
  console.log(`  ✓ Activity: ${backup.activity.length}`);
  console.log(`  ✓ Links: ${backup.links.length}`);

  return backup;
}

// Upload backup to Google Drive
async function uploadToGoogleDrive(drive, backup) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = `${BACKUP_PREFIX}${today}.json`;
  const content = JSON.stringify(backup, null, 2);

  console.log(`\n☁️  Uploading to Google Drive: ${fileName}`);

  // Check if a backup for today already exists
  const existingFiles = await drive.files.list({
    q: `name='${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)',
  });

  if (existingFiles.data.files && existingFiles.data.files.length > 0) {
    // Update existing file
    const fileId = existingFiles.data.files[0].id;
    console.log(`  → Found existing backup, updating...`);
    
    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType: 'application/json',
        body: content,
      },
    });
    console.log(`  ✓ Updated existing backup: ${fileId}`);
    return fileId;
  } else {
    // Create new file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/json',
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'application/json',
        body: content,
      },
      fields: 'id, name',
    });
    console.log(`  ✓ Created new backup: ${response.data.id}`);
    return response.data.id;
  }
}

// Cleanup old backups (keep only MAX_BACKUPS most recent)
async function cleanupOldBackups(drive) {
  console.log(`\n🧹 Cleaning up old backups (keeping last ${MAX_BACKUPS})...`);

  // List all backup files
  const response = await drive.files.list({
    q: `name contains '${BACKUP_PREFIX}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name, createdTime)',
    orderBy: 'name desc', // Sort by name (which includes date) descending
  });

  const backupFiles = response.data.files || [];
  console.log(`  Found ${backupFiles.length} backup files`);

  if (backupFiles.length <= MAX_BACKUPS) {
    console.log(`  ✓ No cleanup needed`);
    return 0;
  }

  // Sort by name (date) descending and get files to delete
  const sortedFiles = backupFiles.sort((a, b) => b.name.localeCompare(a.name));
  const filesToDelete = sortedFiles.slice(MAX_BACKUPS);

  console.log(`  Deleting ${filesToDelete.length} old backups...`);

  for (const file of filesToDelete) {
    await drive.files.delete({ fileId: file.id });
    console.log(`    🗑️  Deleted: ${file.name}`);
  }

  console.log(`  ✓ Cleanup complete`);
  return filesToDelete.length;
}

// Main backup function
async function runBackup() {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Mission Control Database Backup');
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Initialize Google Drive
    const drive = await getGoogleDriveClient();

    // Export database
    const backup = await exportDatabase();

    // Upload to Google Drive
    const fileId = await uploadToGoogleDrive(drive, backup);

    // Cleanup old backups
    const deleted = await cleanupOldBackups(drive);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ Backup completed successfully!');
    console.log(`  Duration: ${duration}s`);
    console.log(`  File ID: ${fileId}`);
    console.log(`  Old backups deleted: ${deleted}`);
    console.log('═══════════════════════════════════════════════════════\n');

    return { success: true, fileId, duration, deleted };
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBackup();
}

module.exports = { runBackup, exportDatabase };
