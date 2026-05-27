import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, Player, Color } from './types';
import { initGame, applyPlay, applyDraw } from './gameLogic';
import { useLobby } from './hooks/usePeer';
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

  const {
    myPeerId,
    status,
    getLobbyOrCreate,
    getPlayers,
    subscribePlayers,
    subscribeGameState,
    updateGameState,
    updateLobbyStatus,
    leaveLobby,
  } = useLobby();

  const lobbyIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const gameUnsubscribeRef = useRef<(() => void) | null>(null);

  // Clean URL after reading room code
  useEffect(() => {
    if (urlRoomCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [urlRoomCode]);

  // Host: create lobby
  const handleHost = useCallback(async (name: string) => {
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const id = await getLobbyOrCreate(code, true, name);

      lobbyIdRef.current = id;
      setRoomCode(code);
      setIsHost(true);

      // Create host player
      const hostPlayer: Player = { id: myPeerId, name, hand: [], isHost: true };
      setMyPlayer(hostPlayer);
      setLobbyPlayers([hostPlayer]);

      // Subscribe to player changes
      const unsub = subscribePlayers(id, (players) => {
        const converted: Player[] = players.map(p => ({
          id: p.player_id,
          name: p.player_name,
          hand: [],
          isHost: p.is_host,
        }));
        setLobbyPlayers(converted);
      });
      unsubscribeRef.current = unsub;

      // Subscribe to game state changes
      const gameUnsub = subscribeGameState(id, (state) => {
        setGameState(state);
        setAppPhase('playing');
      });
      gameUnsubscribeRef.current = gameUnsub;
    } catch (err) {
      console.error('Failed to create lobby:', err);
    }
  }, [myPeerId, getLobbyOrCreate, subscribePlayers, subscribeGameState]);

  // Guest: join lobby
  const handleJoin = useCallback(async (code: string, name: string) => {
    try {
      const id = await getLobbyOrCreate(code.toUpperCase(), false, name);

      lobbyIdRef.current = id;
      setRoomCode(code.toUpperCase());
      setIsHost(false);

      // Create guest player
      const guestPlayer: Player = { id: myPeerId, name, hand: [], isHost: false };
      setMyPlayer(guestPlayer);

      // Get initial players
      const players = await getPlayers(id);
      const converted: Player[] = players.map(p => ({
        id: p.player_id,
        name: p.player_name,
        hand: [],
        isHost: p.is_host,
      }));
      setLobbyPlayers(converted);

      // Subscribe to player changes
      const unsub = subscribePlayers(id, (players) => {
        const converted: Player[] = players.map(p => ({
          id: p.player_id,
          name: p.player_name,
          hand: [],
          isHost: p.is_host,
        }));
        setLobbyPlayers(converted);
      });
      unsubscribeRef.current = unsub;

      // Subscribe to game state changes
      const gameUnsub = subscribeGameState(id, (state) => {
        setGameState(state);
        setAppPhase('playing');
      });
      gameUnsubscribeRef.current = gameUnsub;
    } catch (err) {
      console.error('Failed to join lobby:', err);
    }
  }, [myPeerId, getLobbyOrCreate, getPlayers, subscribePlayers, subscribeGameState]);

  // Host: start game
  const handleStart = useCallback(async () => {
    if (!isHost || !lobbyIdRef.current || lobbyPlayers.length < 2) return;

    const state = initGame(lobbyPlayers);
    setGameState(state);
    setAppPhase('playing');
    await updateGameState(lobbyIdRef.current, state);
  }, [isHost, lobbyPlayers, updateGameState]);

  // Any player: play card
  const handlePlay = useCallback(async (cardId: string, chosenColor?: Color) => {
    if (!lobbyIdRef.current) return;

    setGameState(prev => {
      if (!prev) return prev;
      const next = applyPlay(prev, cardId, chosenColor);
      updateGameState(lobbyIdRef.current!, next);
      return next;
    });
  }, [updateGameState]);

  // Any player: draw card
  const handleDraw = useCallback(async () => {
    if (!lobbyIdRef.current) return;

    setGameState(prev => {
      if (!prev) return prev;
      const next = applyDraw(prev);
      updateGameState(lobbyIdRef.current!, next);
      return next;
    });
  }, [updateGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (gameUnsubscribeRef.current) gameUnsubscribeRef.current();
      if (lobbyIdRef.current && myPeerId) {
        leaveLobby(lobbyIdRef.current);
      }
    };
  }, [myPeerId, leaveLobby]);

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
