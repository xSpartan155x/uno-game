export type Color = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: Color;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHost: boolean;
}

export type GameDirection = 'clockwise' | 'counterclockwise';

export type GamePhase = 'lobby' | 'playing' | 'ended';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  direction: GameDirection;
  drawPile: Card[];
  discardPile: Card[];
  phase: GamePhase;
  currentColor: Color;
  winner: string | null;
  pendingDraw: number;
  lastEvent: GameEvent | null;
}

export type GameEvent =
  | { type: 'play'; player: string; card: Card }
  | { type: 'draw'; player: string; count: number }
  | { type: 'skip'; player: string }
  | { type: 'reverse' }
  | { type: 'draw2'; target: string }
  | { type: 'wild4'; target: string; color: Color }
  | { type: 'colorChange'; color: Color }
  | { type: 'turn'; player: string }
  | { type: 'win'; player: string };

export type PeerMessage =
  | { type: 'player-join'; player: Player }
  | { type: 'game-start'; state: GameState }
  | { type: 'game-state'; state: GameState }
  | { type: 'player-left'; playerId: string }
  | { type: 'lobby-state'; players: Player[] }
  | { type: 'chat'; from: string; text: string };

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
