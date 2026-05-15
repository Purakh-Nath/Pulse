import type { Request, Response, NextFunction } from 'express';
import * as service from './polls.service';
import { ok, created, noContent, paginated } from '../../utils/response';
import { NotFoundError } from '../../shared/errors';
import type { AuthenticatedRequest } from '../../shared/types';

export async function createPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const poll = await service.createPoll((req as AuthenticatedRequest).user.id, req.body);
    created(res, poll);
  } catch (err) { next(err); }
}

export async function getMyPolls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.listUserPolls((req as AuthenticatedRequest).user.id, req.query as never);
    paginated(res, result);
  } catch (err) { next(err); }
}

export async function getPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const poll = await service.getPollById(req.params['pollId']!);
    if (!poll) throw new NotFoundError('Poll');
    
    if (poll.status === 'draft' && poll.ownerId !== (req as AuthenticatedRequest).user?.id) {
      throw new NotFoundError('Poll');
    }

    ok(res, poll);
  } catch (err) { next(err); }
}

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function getPollBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slugOrId = req.params['slug']!;
    const poll = isUuid(slugOrId) 
      ? await service.getPollById(slugOrId) 
      : await service.getPollBySlug(slugOrId);

    if (!poll) throw new NotFoundError('Poll');

    if (poll.status === 'draft' && poll.ownerId !== (req as AuthenticatedRequest).user?.id) {
      throw new NotFoundError('Poll');
    }

    ok(res, poll);
  } catch (err) { next(err); }
}

export async function updatePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const poll = await service.updatePoll(
      req.params['pollId']!,
      (req as AuthenticatedRequest).user.id,
      req.body
    );
    ok(res, poll);
  } catch (err) { next(err); }
}

export async function activatePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const poll = await service.activatePoll(
      req.params['pollId']!,
      (req as AuthenticatedRequest).user.id
    );
    ok(res, poll);
  } catch (err) { next(err); }
}

export async function deletePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deletePoll(req.params['pollId']!, (req as AuthenticatedRequest).user.id);
    noContent(res);
  } catch (err) { next(err); }
}
