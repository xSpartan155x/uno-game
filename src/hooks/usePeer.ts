import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface GameLobby {
  id: string;
  room_code: string;
  created_by: string;
  status: 'waiting' | 'playing' | 'ended';
  game_state?: any;
}

interface LobbyPlayer {
  id: string;
  player_id: string;
  player_name: string;
  is_host: boolean;
}

export function useLobby() {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [myPeerId] = useState(() => `player-${Math.random().toString(36).slice(2, 11)}`);

  // Create or get lobby
  const getLobbyOrCreate = useCallback(async (roomCode: string, isCreating: boolean, playerName: string) => {
    try {
      setStatus('connecting');

      // Try to find existing lobby
      const { data: existing } = await supabase
        .from('game_lobbies')
        .select('id')
        .eq('room_code', roomCode)
        .maybeSingle();

      let lobbyId: string;

      if (existing) {
        lobbyId = existing.id;
      } else if (isCreating) {
        // Create new lobby
        const { data: newLobby, error } = await supabase
          .from('game_lobbies')
          .insert({ room_code: roomCode, created_by: myPeerId })
          .select('id')
          .single();

        if (error) throw error;
        lobbyId = newLobby.id;
      } else {
        throw new Error('Lobby not found');
      }

      // Add player to lobby
      const { error: joinError } = await supabase
        .from('lobby_players')
        .insert({
          lobby_id: lobbyId,
          player_id: myPeerId,
          player_name: playerName,
          is_host: isCreating,
        })
        .select();

      if (joinError && !joinError.message.includes('duplicate')) throw joinError;

      setStatus('connected');
      return lobbyId;
    } catch (err) {
      console.error('Lobby error:', err);
      setStatus('error');
      throw err;
    }
  }, [myPeerId]);

  // Get all players in lobby
  const getPlayers = useCallback(async (lobbyId: string) => {
    const { data } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', lobbyId)
      .order('joined_at');

    return data || [];
  }, []);

  // Subscribe to lobby changes
  const subscribePlayers = useCallback((lobbyId: string, callback: (players: LobbyPlayer[]) => void) => {
    const subscription = supabase
      .channel(`players-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => {
          // Re-fetch on any change
          getPlayers(lobbyId).then(callback);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [getPlayers]);

  // Subscribe to game state changes
  const subscribeGameState = useCallback((lobbyId: string, callback: (state: any) => void) => {
    const subscription = supabase
      .channel(`game-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_lobbies',
          filter: `id=eq.${lobbyId}`,
        },
        (payload) => {
          if (payload.new.game_state) {
            callback(payload.new.game_state);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update game state
  const updateGameState = useCallback(async (lobbyId: string, gameState: any) => {
    await supabase
      .from('game_lobbies')
      .update({ game_state: gameState, status: 'playing' })
      .eq('id', lobbyId);
  }, []);

  // Update lobby status
  const updateLobbyStatus = useCallback(async (lobbyId: string, newStatus: string) => {
    await supabase
      .from('game_lobbies')
      .update({ status: newStatus })
      .eq('id', lobbyId);
  }, []);

  // Leave lobby
  const leaveLobby = useCallback(async (lobbyId: string) => {
    await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('player_id', myPeerId);
  }, [myPeerId]);

  return {
    myPeerId,
    status,
    getLobbyOrCreate,
    getPlayers,
    subscribePlayers,
    subscribeGameState,
    updateGameState,
    updateLobbyStatus,
    leaveLobby,
  };
}
