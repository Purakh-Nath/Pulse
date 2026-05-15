// Socket event payloads
export interface PresenceUpdatePayload {
  pollId: string;
  activeUsers: number;
  userIds?: string[];
}

export interface ResponseCountPayload {
  pollId: string;
  count: number;
}

export interface PollExpiredPayload {
  pollId: string;
}

export interface PollPublishedPayload {
  pollId: string;
}

export type SocketEvent =
  | 'presence:update'
  | 'response:count'
  | 'poll:expired'
  | 'poll:published'
  | 'poll:join'
  | 'poll:leave'
  | 'ping';

export interface SocketRoom {
  pollId: string;
  joined: boolean;
}
