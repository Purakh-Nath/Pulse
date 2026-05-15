import type { Server, Socket, Namespace } from 'socket.io';

// Registry of active poll rooms - used by workers to emit events
const roomRegistry = new Map<string, Namespace | Server>();

let _io: Server;

export function setSocketServer(io: Server): void {
  _io = io;
}

export function getSocketServer(): Server {
  return _io;
}

export function getPollSocketRoom(pollId: string): ReturnType<Server['to']> | null {
  if (!_io) return null;
  return _io.to(`poll:${pollId}`);
}

export function broadcastToPoll(pollId: string, event: string, data: unknown): void {
  if (!_io) return;
  _io.to(`poll:${pollId}`).emit(event, data);
}
