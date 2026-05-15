import type { Request, Response, NextFunction } from 'express';
import { checkDbHealth } from '../../db/client';
import { checkRedisHealth } from '../../services/redis';
import { ok } from '../../utils/response';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version: string;
  services: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
  };
}

export async function health(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [dbOk, redisOk] = await Promise.all([checkDbHealth(), checkRedisHealth()]);

    const services = {
      database: dbOk ? ('ok' as const) : ('error' as const),
      redis: redisOk ? ('ok' as const) : ('error' as const),
    };

    const allOk = dbOk && redisOk;
    const anyOk = dbOk || redisOk;

    const body: HealthStatus = {
      status: allOk ? 'ok' : anyOk ? 'degraded' : 'down',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
      services,
    };

    // Return 503 if any critical service is down
    const statusCode = allOk ? 200 : 503;
    res.status(statusCode).json({ success: allOk, data: body });
  } catch (err) {
    next(err);
  }
}

// GET /health/live - lightweight liveness probe (just confirms process is alive)
export function liveness(_req: Request, res: Response): void {
  res.status(200).json({ success: true, data: { status: 'alive', ts: Date.now() } });
}

// GET /health/ready — readiness probe
export async function readiness(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [dbOk, redisOk] = await Promise.all([checkDbHealth(), checkRedisHealth()]);
    if (!dbOk || !redisOk) {
      res.status(503).json({
        success: false,
        data: { status: 'not ready', database: dbOk, redis: redisOk },
      });
      return;
    }
    res.status(200).json({ success: true, data: { status: 'ready' } });
  } catch (err) {
    next(err);
  }
}