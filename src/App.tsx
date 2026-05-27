import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, Player, PeerMessage, Color, generateRoomCode } from './types';
import { initGame, applyPlay, applyDraw } from './gameLogic';
import { usePeer, peerIdFromRoom } from './hooks/usePeer';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

type AppPhase = 'lobby' | 'playing';

function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('c')?.toUpperCase() ?? null;
}

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [urlRoomCode] = useState(() => getRoomCodeFromUrl());

  // Refs for values needed in callbacks
  const nameRef = useRef<string>('')
;
  const roomCodeRef = useRef<string | null>(null);
  const myPlayerRef = useRef<Player | null>(null);
  const lobbyPlayersRef = useRef<Player[]>([]);

  // Keep refs in sync
  useEffect(() => { myPlayerRef.current = myPlayer; }, [myPlayer]);
  useEffect(() => { lobbyPlayersRef.current = lobbyPlayers; }, [lobbyPlayers]);

  // Clean URL after reading room code
  useEffect(() => {
    if (urlRoomCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [urlRoomCode]);

  // Handle incoming messages
  const handleMessage = useCallback((msg: PeerMessage, fromPeerId: string) => {
    console.log('Received message:', msg.type, 'from', fromPeerId);

    switch (msg.type) {
      case 'player-join': {
        // Host receives this from guest
        setLobbyPlayers(prev => {
          const exists = prev.find(p => p.id === msg.player.id);
          if (exists) return prev;
          const updated = [...prev, msg.player];
          // Broadcast updated lobby to all connections
          setTimeout(() => {
            sendToRef.current(fromPeerId, { type: 'lobby-state', players: updated });
            broadcastRef.current({ type: 'lobby-state', players: updated });
          }, 100);
          return updated;
        });
        break;
      }

      case 'lobby-state': {
        // Guest receives lobby state from host
        setLobbyPlayers(msg.players);
        // Find myself in the lobby
        const me = msg.players.find(p => p.id === myPlayerRef.current?.id);
        if (me) setMyPlayer(me);
        break;
      }

      case 'game-start':
      case 'game-state': {
        setGameState(msg.state);
        setAppPhase('playing');
        break;
      }

      case 'player-left': {
        setLobbyPlayers(prev => prev.filter(p => p.id !== msg.playerId));
        break;
      }
    }
  }, []);

  const {
    myPeerId,
    status,
    initHost,
    initGuest,
    connectToHost,
    sendTo,
    broadcast,
    isConnected,
  } = usePeer({ onMessage: handleMessage });

  // Refs for send functions
  const sendToRef = useRef(sendTo);
  const broadcastRef = useRef(broadcast);
  useEffect(() => { sendToRef.current = sendTo; }, [sendTo]);
  useEffect(() => { broadcastRef.current = broadcast; }, [broadcast]);

  // Host: when peer is ready, add self to lobby
  const hostInitRef = useRef(false);
  useEffect(() => {
    if (isHost && myPeerId && !hostInitRef.current) {
      hostInitRef.current = true;
      const player: Player = { id: myPeerId, name: nameRef.current, hand: [], isHost: true };
      setMyPlayer(player);
      setLobbyPlayers([player]);
    }
  }, [isHost, myPeerId]);

  // Guest: when peer is ready and we have a room code, connect to host
  const guestInitRef = useRef(false);
  useEffect(() => {
    if (!isHost && myPeerId && roomCodeRef.current && !guestInitRef.current) {
      guestInitRef.current = true;
      const hostPeerId = peerIdFromRoom(roomCodeRef.current);

      // Create player and connect
      const player: Player = { id: myPeerId, name: nameRef.current, hand: [], isHost: false };
      setMyPlayer(player);

      // Small delay to ensure peer is ready
      setTimeout(() => {
        connectToHost(roomCodeRef.current!);
      }, 200);

      // Wait for connection then send join
      const checkAndJoin = () => {
        if (isConnected(hostPeerId)) {
          sendToRef.current(hostPeerId, { type: 'player-join', player });
        } else {
          setTimeout(checkAndJoin, 100);
        }
      };
      setTimeout(checkAndJoin, 500);
    }
  }, [isHost, myPeerId, connectToHost, isConnected]);

  // Handle create game
  const handleHost = useCallback((name: string) => {
    const code = generateRoomCode();
    nameRef.current = name;
    roomCodeRef.current = code;
    setRoomCode(code);
    setIsHost(true);
    hostInitRef.current = false;
    initHost(code);
  }, [initHost]);

  // Handle join game
  const handleJoin = useCallback((code: string, name: string) => {
    nameRef.current = name;
    roomCodeRef.current = code.toUpperCase();
    setRoomCode(code.toUpperCase());
    setIsHost(false);
    guestInitRef.current = false;
    initGuest();
  }, [initGuest]);

  // Handle start game
  const handleStart = useCallback(() => {
    if (!isHost || lobbyPlayers.length < 2) return;
    const state = initGame(lobbyPlayers);
    setGameState(state);
    setAppPhase('playing');
    broadcastRef.current({ type: 'game-start', state });
  }, [isHost, lobbyPlayers]);

  // Handle play card
  const handlePlay = useCallback((cardId: string, chosenColor?: Color) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyPlay(prev, cardId, chosenColor);
      broadcastRef.current({ type: 'game-state', state: next });
      return next;
    });
  }, []);

  // Handle draw card
  const handleDraw = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyDraw(prev);
      broadcastRef.current({ type: 'game-state', state: next });
      return next;
    });
  }, []);

  // Render game or lobby
  if (appPhase === 'playing' && gameState && myPlayer) {
    return (
      <GameBoard
        gameState={gameState}
        myPlayerId={myPlayer.id}
        onPlay={handlePlay}
        onDraw={handleDraw}
      />
    );
  }

  return (
    <Lobby
      myId={myPeerId}
      players={lobbyPlayers}
      isHost={isHost}
      roomCode={roomCode}
      onHost={handleHost}
      onJoin={handleJoin}
      onStart={handleStart}
      connectionStatus={status}
      initialRoomCode={urlRoomCode}
    />
  );
}
