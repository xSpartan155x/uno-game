import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { PeerMessage } from '../types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UsePeerOptions {
  onMessage: (msg: PeerMessage, fromId: string) => void;
  onPeerConnect?: (peerId: string) => void;
  onPeerDisconnect?: (peerId: string) => void;
}

// Prefix to namespace room codes from other peerjs IDs
const ROOM_PREFIX = 'uno-room-';

export function peerIdFromRoom(roomCode: string): string {
  return `${ROOM_PREFIX}${roomCode}`;
}

export function roomFromPeerId(peerId: string): string | null {
  if (peerId.startsWith(ROOM_PREFIX)) return peerId.slice(ROOM_PREFIX.length);
  return null;
}

export function usePeer({ onMessage, onPeerConnect, onPeerDisconnect }: UsePeerOptions) {
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const [myId, setMyId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const onMessageRef = useRef(onMessage);
  const onPeerConnectRef = useRef(onPeerConnect);
  const onPeerDisconnectRef = useRef(onPeerDisconnect);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onPeerConnectRef.current = onPeerConnect; }, [onPeerConnect]);
  useEffect(() => { onPeerDisconnectRef.current = onPeerDisconnect; }, [onPeerDisconnect]);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('data', (data) => {
      onMessageRef.current(data as PeerMessage, conn.peer);
    });
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
      onPeerConnectRef.current?.(conn.peer);
    });
    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      onPeerDisconnectRef.current?.(conn.peer);
    });
    conn.on('error', () => {
      connectionsRef.current.delete(conn.peer);
      onPeerDisconnectRef.current?.(conn.peer);
    });
  }, []);

  const initAsHost = useCallback((roomCode: string) => {
    setStatus('connecting');
    const peerId = peerIdFromRoom(roomCode);
    const peer = new Peer(peerId, { debug: 0 });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyId(id);
      setStatus('connected');
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', () => {
      setStatus('error');
    });

    peer.on('disconnected', () => {
      setStatus('idle');
    });
  }, [setupConnection]);

  const initAsGuest = useCallback(() => {
    setStatus('connecting');
    // Guest gets a random ID
    const peer = new Peer({ debug: 0 });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyId(id);
      setStatus('connected');
    });

    peer.on('error', () => {
      setStatus('error');
    });

    peer.on('disconnected', () => {
      setStatus('idle');
    });
  }, []);

  const connectToHost = useCallback((roomCode: string) => {
    if (!peerRef.current) return;
    const hostPeerId = peerIdFromRoom(roomCode);
    const conn = peerRef.current.connect(hostPeerId, { reliable: true });
    setupConnection(conn);
  }, [setupConnection]);

  const sendTo = useCallback((peerId: string, msg: PeerMessage) => {
    const conn = connectionsRef.current.get(peerId);
    if (conn?.open) conn.send(msg);
  }, []);

  const broadcast = useCallback((msg: PeerMessage) => {
    for (const conn of connectionsRef.current.values()) {
      if (conn.open) conn.send(msg);
    }
  }, []);

  const destroy = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    connectionsRef.current.clear();
    setMyId(null);
    setStatus('idle');
  }, []);

  const connectedPeerIds = useCallback(() => {
    return [...connectionsRef.current.keys()];
  }, []);

  return { myId, status, initAsHost, initAsGuest, connectToHost, sendTo, broadcast, destroy, connectedPeerIds };
}
