import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, Player, PeerMessage, Color, generateRoomCode } from './types';
import { initGame, applyPlay, applyDraw } from './gameLogic';
import { usePeer } from './hooks/usePeer';
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

  const peerIdToPlayerRef = useRef<Map<string, string>>(new Map());
  const nameRef = useRef<string>('');
  const roomCodeRef = useRef<string | null>(null);

  // Clean URL after reading room code
  useEffect(() => {
    if (urlRoomCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [urlRoomCode]);

  const handleMessage = useCallback((msg: PeerMessage, fromId: string) => {
    switch (msg.type) {
      case 'player-join': {
        setLobbyPlayers(prev => {
          if (prev.find(p => p.id === msg.player.id)) return prev;
          peerIdToPlayerRef.current.set(fromId, msg.player.id);
          return [...prev, msg.player];
        });
        break;
      }
      case 'lobby-state': {
        setLobbyPlayers(msg.players);
        // Also find our own player from lobby state
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

  const handlePeerConnect = useCallback((peerId: string) => {
    // If we're a guest and just connected to host, send our join message
    if (!isHost && myId) {
      const player: Player = { id: myId, name: nameRef.current, hand: [], isHost: false };
      setMyPlayer(player);
      sendToInternal(peerId, { type: 'player-join', player });
    }
  }, [isHost, myId]);

  const handlePeerDisconnect = useCallback((peerId: string) => {
    const playerId = peerIdToPlayerRef.current.get(peerId);
    if (playerId) {
      setLobbyPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  }, []);

  const { myId, status, initAsHost, initAsGuest, connectToHost, sendTo, broadcast } = usePeer({
    onMessage: handleMessage,
    onPeerConnect: handlePeerConnect,
    onPeerDisconnect: handlePeerDisconnect,
  });

  // Store sendTo in a ref so callbacks can use it
  const sendToRef = useRef(sendTo);
  useEffect(() => { sendToRef.current = sendTo; }, [sendTo]);

  const sendToInternal = (peerId: string, msg: PeerMessage) => {
    sendToRef.current(peerId, msg);
  };

  // Host: once myId is set, create self player
  const hostReadyRef = useRef(false);
  useEffect(() => {
    if (myId && isHost && !hostReadyRef.current) {
      hostReadyRef.current = true;
      const player: Player = { id: myId, name: nameRef.current, hand: [], isHost: true };
      setMyPlayer(player);
      setLobbyPlayers([player]);
    }
  }, [myId, isHost]);

  // Host: broadcast lobby state when it changes
  const prevLobbyLenRef = useRef(0);
  useEffect(() => {
    if (isHost && myId && lobbyPlayers.length > 0 && lobbyPlayers.length !== prevLobbyLenRef.current) {
      prevLobbyLenRef.current = lobbyPlayers.length;
      broadcast({ type: 'lobby-state', players: lobbyPlayers });
    }
  }, [isHost, myId, lobbyPlayers, broadcast]);

  // Guest: once myId is set, connect to host room
  const guestConnectRef = useRef(false);
  useEffect(() => {
    if (myId && !isHost && roomCodeRef.current && !guestConnectRef.current) {
      guestConnectRef.current = true;
      connectToHost(roomCodeRef.current);
    }
  }, [myId, isHost, connectToHost]);

  const handleHost = useCallback((name: string) => {
    const code = generateRoomCode();
    nameRef.current = name;
    roomCodeRef.current = code;
    setRoomCode(code);
    setIsHost(true);
    hostReadyRef.current = false;
    initAsHost(code);
  }, [initAsHost]);

  const handleJoin = useCallback((code: string, name: string) => {
    nameRef.current = name;
    roomCodeRef.current = code;
    setRoomCode(code);
    setIsHost(false);
    guestConnectRef.current = false;
    initAsGuest();
  }, [initAsGuest]);

  const handleStart = useCallback(() => {
    if (!isHost || lobbyPlayers.length < 2) return;
    const state = initGame(lobbyPlayers);
    setGameState(state);
    setAppPhase('playing');
    broadcast({ type: 'game-start', state });
  }, [isHost, lobbyPlayers, broadcast]);

  const handlePlay = useCallback((cardId: string, chosenColor?: Color) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyPlay(prev, cardId, chosenColor);
      broadcast({ type: 'game-state', state: next });
      return next;
    });
  }, [broadcast]);

  const handleDraw = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyDraw(prev);
      broadcast({ type: 'game-state', state: next });
      return next;
    });
  }, [broadcast]);

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
      myId={myId}
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
