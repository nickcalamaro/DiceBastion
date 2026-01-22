/**
 * Manual BGG Sync Script
 * Run with: node scripts/manual-sync-bgg.js
 * This will trigger the sync endpoint on your production worker
 */

const WORKER_URL = 'https://dicebastion-memberships.ncalamaro.workers.dev';

async function triggerSync() {
  console.log('Triggering BGG board games sync...');
  
  try {
    // Option 1: Try calling the API endpoint directly (will fail with 401 if not logged in)
    const response = await fetch(`${WORKER_URL}/api/board-games`);
    const data = await response.json();
    
    console.log(`Current games in database: ${data.games?.length || 0}`);
    
    if (data.games?.length === 0) {
      console.log('\n⚠️  No games in database yet!');
      console.log('\nTo populate the database, you have two options:');
      console.log('1. Log in at https://dicebastion.com/admin/ and click "🎲 Sync Board Games"');
      console.log('2. Wait for the daily cron job to run at 2 AM UTC');
      console.log('3. Use wrangler to trigger the scheduled event:');
      console.log('   cd worker && wrangler dev --test-scheduled');
    } else {
      console.log(`✅ Database has ${data.games.length} games`);
      console.log(`Last synced: ${data.metadata?.lastUpdate || 'unknown'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

triggerSync();
