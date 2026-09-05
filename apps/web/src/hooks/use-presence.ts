'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export function usePresence(enabled: boolean) {
  const [events, setEvents] = useState<unknown[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const socket: Socket = io(`${WS_URL}/presence`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence', (payload) => {
      setEvents((prev) => [payload, ...prev].slice(0, 50));
    });
    return () => {
      socket.disconnect();
    };
  }, [enabled]);

  return { events, connected };
}
