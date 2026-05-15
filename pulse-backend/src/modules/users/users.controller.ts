import type { Request, Response, NextFunction } from 'express';
import { getUserById, updateUser } from './users.service';
import { ok } from '../../utils/response';
import type { AuthenticatedRequest } from '../../shared/types';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getUserById((req as AuthenticatedRequest).user.id);
    ok(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await updateUser(
      (req as AuthenticatedRequest).user.id,
      req.body as { name?: string }
    );
    ok(res, user);
  } catch (err) {
    next(err);
  }
}
