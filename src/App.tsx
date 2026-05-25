import { useCallback, useRef, useState } from 'react';
import { GameState, Player, PeerMessage, Color } from './types';
import { initGame, applyPlay, applyDraw } from './gameLogic';
import { usePeer } from './hooks/usePeer';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

type AppPhase = 'lobby' | 'playing';

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);

  const peerIdToPlayerRef = useRef<Map<string, string>>(new Map());
  const hostIdRef = useRef<string | null>(null);

  const handleMessage = useCallback((msg: PeerMessage, fromId: string) => {
    switch (msg.type) {
      case 'player-join': {
        setLobbyPlayers(prev => {
          if (prev.find(p => p.id === msg.player.id)) return prev;
          const next = [...prev, msg.player];
          peerIdToPlayerRef.current.set(fromId, msg.player.id);
          return next;
        });
        break;
      }
      case 'lobby-state': {
        setLobbyPlayers(msg.players);
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

  const handlePeerConnect = useCallback((_peerId: string) => {
    // host sends current lobby state to new peer
  }, []);

  const handlePeerDisconnect = useCallback((peerId: string) => {
    const playerId = peerIdToPlayerRef.current.get(peerId);
    if (playerId) {
      setLobbyPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  }, []);

  const { myId, status, init, connectTo, broadcast, sendTo } = usePeer({
    onMessage: handleMessage,
    onPeerConnect: handlePeerConnect,
    onPeerDisconnect: handlePeerDisconnect,
  });

  const handleHost = useCallback((name: string) => {
    init();
    setIsHost(true);
    // myId is set async, so we set player after peer is ready
    const checkReady = setInterval(() => {
      // handled via useEffect in a moment — use a ref trick
    }, 100);
    clearInterval(checkReady);

    // We store the name temporarily, player created in useEffect
    sessionStorage.setItem('uno-name', name);
  }, [init]);

  // Once myId is available, create host player
  const hostPlayerCreated = useRef(false);
  if (myId && isHost && !hostPlayerCreated.current && lobbyPlayers.length === 0) {
    const name = sessionStorage.getItem('uno-name') || 'Host';
    hostPlayerCreated.current = true;
    const player: Player = { id: myId, name, hand: [], isHost: true };
    setMyPlayer(player);
    setLobbyPlayers([player]);
  }

  // When lobby players update and isHost, broadcast
  const prevLobbyRef = useRef<Player[]>([]);
  if (isHost && myId && lobbyPlayers !== prevLobbyRef.current) {
    prevLobbyRef.current = lobbyPlayers;
    broadcast({ type: 'lobby-state', players: lobbyPlayers });
  }

  const handleJoin = useCallback((hostId: string, name: string) => {
    hostIdRef.current = hostId;
    sessionStorage.setItem('uno-name', name);
    init();
    // connect after peer ready
  }, [init]);

  // When myId available and joining, connect to host
  const joinedRef = useRef(false);
  if (myId && !isHost && hostIdRef.current && !joinedRef.current) {
    joinedRef.current = true;
    const name = sessionStorage.getItem('uno-name') || 'Player';
    const player: Player = { id: myId, name, hand: [], isHost: false };
    setMyPlayer(player);
    connectTo(hostIdRef.current);
    // Send join after short delay to let connection open
    setTimeout(() => {
      sendTo(hostIdRef.current!, { type: 'player-join', player });
    }, 600);
  }

  // Host: receive player-join and add to lobby
  const handleLobbyJoin = useCallback((msg: PeerMessage, fromId: string) => {
    if (msg.type !== 'player-join') return;
    setLobbyPlayers(prev => {
      if (prev.find(p => p.id === msg.player.id)) return prev;
      peerIdToPlayerRef.current.set(fromId, msg.player.id);
      const next = [...prev, msg.player];
      // broadcast updated list
      broadcast({ type: 'lobby-state', players: next });
      return next;
    });
  }, [broadcast]);
  void handleLobbyJoin;

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
      if (isHost) {
        broadcast({ type: 'game-state', state: next });
      } else {
        // guest sends action — for simplicity, host handles all state
        // We send to host (first player who is host)
        const hostPlayer = prev.players.find(p => p.isHost);
        if (hostPlayer) sendTo(hostPlayer.id, { type: 'game-state', state: next });
        broadcast({ type: 'game-state', state: next });
      }
      return next;
    });
  }, [isHost, broadcast, sendTo]);

  const handleDraw = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyDraw(prev);
      if (isHost) {
        broadcast({ type: 'game-state', state: next });
      } else {
        broadcast({ type: 'game-state', state: next });
      }
      return next;
    });
  }, [isHost, broadcast]);

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
      onHost={handleHost}
      onJoin={handleJoin}
      onStart={handleStart}
      connectionStatus={status}
    />
  );
}
