/*
  # Create game tables for UNO multiplayer

  1. New Tables
    - `game_lobbies` - tracks active game rooms
    - `lobby_players` - players in each lobby
  
  2. Security
    - Enable RLS on both tables
    - Anyone can create/join lobbies with room code
    - Realtime enabled for live updates
*/

CREATE TABLE IF NOT EXISTS game_lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by text NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'ended')),
  game_state jsonb
);

CREATE TABLE IF NOT EXISTS lobby_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  player_name text NOT NULL,
  is_host boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(lobby_id, player_id)
);

ALTER TABLE game_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lobbies"
  ON game_lobbies FOR SELECT USING (true);

CREATE POLICY "Anyone can insert lobbies"
  ON game_lobbies FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update lobbies"
  ON game_lobbies FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read lobby players"
  ON lobby_players FOR SELECT USING (true);

CREATE POLICY "Anyone can insert into lobby players"
  ON lobby_players FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update lobby players"
  ON lobby_players FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete lobby players"
  ON lobby_players FOR DELETE USING (true);
