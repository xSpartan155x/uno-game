import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { PeerMessage } from '../types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UsePeerOptions {
  onMessage: (msg: PeerMessage, fromId: string) => void;
}

const ROOM_PREFIX = 'uno-room-';

export function peerIdFromRoom(roomCode: string): string {
  return `${ROOM_PREFIX}${roomCode}`;
}

export function roomFromPeerId(peerId: string): string | null {
  if (peerId.startsWith(ROOM_PREFIX)) return peerId.slice(ROOM_PREFIX.length);
  return null;
}

export function usePeer({ onMessage }: UsePeerOptions) {
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref updated
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  // Setup data handlers for a connection
  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
    });
    conn.on('data', (data) => {
      onMessageRef.current(data as PeerMessage, conn.peer);
    });
    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
    });
    conn.on('error', () => {
      connectionsRef.current.delete(conn.peer);
    });
  }, []);

  // Initialize as HOST (with room code)
  const initHost = useCallback((roomCode: string) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setStatus('connecting');
    const peerId = peerIdFromRoom(roomCode);
    const peer = new Peer(peerId, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyPeerId(id);
      setStatus('connected');
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('Host peer error:', err);
      setStatus('error');
    });
  }, [setupConnection]);

  // Initialize as GUEST (random ID, connect to host)
  const initGuest = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setStatus('connecting');
    const peer = new Peer({ debug: 1 });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyPeerId(id);
      setStatus('connected');
    });

    peer.on('error', (err) => {
      console.error('Guest peer error:', err);
      setStatus('error');
    });
  }, []);

  // Connect to host (guest calls this)
  const connectToHost = useCallback((roomCode: string): DataConnection | null => {
    if (!peerRef.current) return null;
    const hostPeerId = peerIdFromRoom(roomCode);
    const conn = peerRef.current.connect(hostPeerId, { reliable: true });
    setupConnection(conn);
    // Return the connection so caller can send immediately after open
    return conn;
  }, [setupConnection]);

  // Send to specific peer
  const sendTo = useCallback((peerId: string, msg: PeerMessage) => {
    const conn = connectionsRef.current.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    } else {
      console.warn('Connection not open for peer:', peerId);
    }
  }, []);

  // Broadcast to all connected peers
  const broadcast = useCallback((msg: PeerMessage) => {
    for (const conn of connectionsRef.current.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }, []);

  // Get all connected peer IDs
  const getConnectedPeerIds = useCallback(() => {
    return [...connectionsRef.current.keys()];
  }, []);

  // Check if connected to specific peer
  const isConnected = useCallback((peerId: string) => {
    const conn = connectionsRef.current.get(peerId);
    return conn && conn.open;
  }, []);

  // Cleanup
  const destroy = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    connectionsRef.current.clear();
    setMyPeerId(null);
    setStatus('idle');
  }, []);

  return {
    myPeerId,
    status,
    initHost,
    initGuest,
    connectToHost,
    sendTo,
    broadcast,
    getConnectedPeerIds,
    isConnected,
    destroy,
  };
}
