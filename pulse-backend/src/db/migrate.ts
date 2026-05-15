import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb, closeDb } from './client';
import { logger } from '../config/logger';

async function runMigrations() {
  logger.info('Running database migrations...');
  const db = getDb();
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  logger.info('Migrations completed successfully');
  await closeDb();
}

runMigrations().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
