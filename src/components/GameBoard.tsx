import React, { useState } from 'react';
import { GameState, Color, Card } from '../types';
import CardImage from './CardImage';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import ColorPicker from './ColorPicker';
import GameNotifications from './GameNotifications';
import { RotateCcw, RotateCw, Layers } from 'lucide-react';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onPlay: (cardId: string, chosenColor?: Color) => void;
  onDraw: () => void;
}

const COLOR_BG: Record<string, string> = {
  red: 'from-red-950/60', green: 'from-green-950/60',
  blue: 'from-blue-950/60', yellow: 'from-yellow-950/40', wild: 'from-gray-950/60',
};

export default function GameBoard({ gameState, myPlayerId, onPlay, onDraw }: Props) {
  const [pendingWildCard, setPendingWildCard] = useState<string | null>(null);

  const myIndex = gameState.players.findIndex(p => p.id === myPlayerId);
  const me = gameState.players[myIndex];
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const opponents = gameState.players
    .map((p, i) => ({ player: p, idx: i }))
    .filter(({ idx }) => idx !== myIndex);

  const handleCardClick = (cardId: string) => {
    const card = me?.hand.find(c => c.id === cardId);
    if (!card) return;
    if (card.color === 'wild') {
      setPendingWildCard(cardId);
    } else {
      onPlay(cardId);
    }
  };

  const handleColorPick = (color: Color) => {
    if (pendingWildCard) {
      onPlay(pendingWildCard, color);
      setPendingWildCard(null);
    }
  };

  if (gameState.phase === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 sm:p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="text-5xl animate-bounce-slow">&#127942;</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {gameState.winner === me?.name ? 'Hai vinto!' : `${gameState.winner} ha vinto!`}
          </h2>
          <p className="text-gray-400 text-sm">Ricarica la pagina per giocare ancora</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${COLOR_BG[gameState.currentColor] ?? ''} to-gray-950 relative overflow-hidden`}>
      {/* Notifications */}
      <GameNotifications event={gameState.lastEvent} />

      {/* Header bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 pt-2 pb-1 bg-black/30 backdrop-blur-sm">
        <div className="uno-logo-sm">
          <span className="text-white text-xs sm:text-sm font-black tracking-widest">UNO</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-gray-300 text-xs sm:text-sm">
          {gameState.direction === 'clockwise'
            ? <RotateCw size={14} className="text-gray-400" />
            : <RotateCcw size={14} className="text-gray-400" />}
          <span className="flex items-center gap-1">
            Colore: <ColorDot color={gameState.currentColor} />
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Layers size={12} /> {gameState.drawPile.length}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col justify-between px-2 sm:px-4 py-2 sm:py-4 gap-2 sm:gap-4 max-h-[calc(100vh-44px)]">

        {/* Opponents row */}
        <div className="flex justify-center sm:justify-around gap-3 sm:gap-6 flex-wrap">
          {opponents.map(({ player, idx }) => (
            <OpponentHand
              key={player.id}
              player={player}
              isCurrentPlayer={gameState.currentPlayerIndex === idx}
              position="top"
            />
          ))}
        </div>

        {/* Center area: draw + discard */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Draw pile */}
          <div
            className={`relative ${isMyTurn ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} transition-transform`}
            onClick={isMyTurn ? onDraw : undefined}
          >
            {[2, 1, 0].map(offset => (
              <div
                key={offset}
                className="absolute"
                style={{ top: -offset * 1.5, left: offset * 0.5, zIndex: offset }}
              >
                <CardImage card={{ id: `pile-${offset}`, color: 'wild', value: 'wild' }} faceDown />
              </div>
            ))}
            <div style={{ visibility: 'hidden' }}>
              <CardImage card={{ id: 'ph', color: 'wild', value: 'wild' }} faceDown />
            </div>
            {isMyTurn && (
              <p className="text-center text-yellow-300 text-[10px] sm:text-xs mt-0.5 animate-pulse font-semibold">
                Pesca
              </p>
            )}
          </div>

          {/* Discard pile */}
          <div className="relative animate-card-land">
            {topCard && <CardImage card={topCard} />}
          </div>
        </div>

        {/* Turn indicator */}
        <div className="text-center">
          {isMyTurn ? (
            <span className="inline-block bg-yellow-400/20 border border-yellow-400/40 rounded-full px-4 sm:px-6 py-1 text-yellow-300 text-xs sm:text-sm font-bold animate-pulse">
              Il tuo turno!
            </span>
          ) : (
            <span className="inline-block text-gray-500 text-xs sm:text-sm">
              Turno di {gameState.players[gameState.currentPlayerIndex]?.name}
            </span>
          )}
        </div>

        {/* My hand */}
        {me && (
          <div className="w-full">
            <p className="text-center text-gray-500 text-[10px] sm:text-xs mb-1">
              {me.name} &mdash; {me.hand.length} carte
            </p>
            <PlayerHand
              cards={me.hand}
              isMyTurn={isMyTurn}
              topCard={topCard}
              currentColor={gameState.currentColor}
              onPlay={handleCardClick}
            />
          </div>
        )}
      </div>

      {pendingWildCard && <ColorPicker onPick={handleColorPick} />}
    </div>
  );
}

function ColorDot({ color }: { color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-500', green: 'bg-green-500', blue: 'bg-blue-500', yellow: 'bg-yellow-400', wild: 'bg-gray-500',
  };
  return <span className={`inline-block w-3 h-3 rounded-full ${colors[color] ?? 'bg-gray-500'} align-middle shadow-lg`} />;
}
