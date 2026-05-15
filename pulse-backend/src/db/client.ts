import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';
import { logger } from '../config/logger';

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    _pool.on('error', (err) => logger.error({ err }, 'PostgreSQL pool error'));
    _pool.on('connect', () => logger.debug('PostgreSQL client connected'));
  }
  return _pool;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export async function checkDbHealth(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    logger.info('PostgreSQL pool closed');
  }
}

export { schema };
export type Db = ReturnType<typeof getDb>;
