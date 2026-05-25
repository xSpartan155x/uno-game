import React, { useState } from 'react';
import { GameState, Color, Card } from '../types';
import CardImage from './CardImage';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import ColorPicker from './ColorPicker';
import { RotateCcw, RotateCw } from 'lucide-react';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onPlay: (cardId: string, chosenColor?: Color) => void;
  onDraw: () => void;
}

const COLOR_BG: Record<string, string> = {
  red: 'from-red-900/50 to-red-700/20',
  green: 'from-green-900/50 to-green-700/20',
  blue: 'from-blue-900/50 to-blue-700/20',
  yellow: 'from-yellow-900/50 to-yellow-700/20',
  wild: 'from-gray-900/50 to-gray-700/20',
};

const COLOR_GLOW: Record<string, string> = {
  red: '0 0 60px 20px rgba(229,62,62,0.25)',
  green: '0 0 60px 20px rgba(56,161,105,0.25)',
  blue: '0 0 60px 20px rgba(49,130,206,0.25)',
  yellow: '0 0 60px 20px rgba(214,158,46,0.25)',
  wild: '0 0 60px 20px rgba(90,90,90,0.2)',
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

  const getPosition = (opIdx: number): 'top' | 'left' | 'right' => {
    if (opponents.length === 1) return 'top';
    if (opponents.length === 2) return opIdx === 0 ? 'left' : 'right';
    const positions: Array<'top' | 'left' | 'right'> = ['left', 'top', 'right'];
    return positions[opIdx] ?? 'top';
  };

  if (gameState.phase === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="glass-card p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-black text-white">
            {gameState.winner === me?.name ? 'Hai vinto!' : `${gameState.winner} ha vinto!`}
          </h2>
          <p className="text-gray-400">Ricarica la pagina per giocare ancora</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br ${COLOR_BG[gameState.currentColor]} bg-uno-bg relative overflow-hidden`}
      style={{ boxShadow: `inset ${COLOR_GLOW[gameState.currentColor]}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="uno-logo-sm">
          <span className="text-white text-sm font-black tracking-widest">UNO</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          {gameState.direction === 'clockwise'
            ? <RotateCw size={16} className="text-gray-400" />
            : <RotateCcw size={16} className="text-gray-400" />}
          <span>Colore: <ColorDot color={gameState.currentColor} /></span>
        </div>
        <div className="text-gray-400 text-xs">
          Mazzo: {gameState.drawPile.length}
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 gap-4">

        {/* Opponents top */}
        <div className="flex justify-around w-full max-w-2xl gap-4">
          {opponents.map(({ player, idx }, opIdx) => {
            const pos = getPosition(opIdx);
            if (pos === 'top' || opponents.length <= 2) {
              return (
                <OpponentHand
                  key={player.id}
                  player={player}
                  isCurrentPlayer={gameState.currentPlayerIndex === idx}
                  position={pos}
                />
              );
            }
            return null;
          })}
        </div>

        {/* Center: draw pile + discard pile */}
        <div className="flex items-center justify-center gap-6 my-2">
          {/* Draw pile */}
          <div
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={isMyTurn ? onDraw : undefined}
            title={isMyTurn ? 'Pesca una carta' : ''}
          >
            <div className="relative">
              {[2, 1, 0].map(offset => (
                <div
                  key={offset}
                  className="absolute"
                  style={{ top: -offset * 2, left: offset, zIndex: offset }}
                >
                  <CardImage
                    card={{ id: `pile-${offset}`, color: 'wild', value: 'wild' }}
                    faceDown
                  />
                </div>
              ))}
              <div style={{ visibility: 'hidden' }}>
                <CardImage card={{ id: 'placeholder', color: 'wild', value: 'wild' }} faceDown />
              </div>
            </div>
            {isMyTurn && (
              <p className="text-center text-yellow-300 text-xs mt-1 animate-pulse font-semibold">
                Pesca
              </p>
            )}
          </div>

          {/* Discard pile */}
          <div className="relative">
            {gameState.discardPile.slice(-3).map((card, i, arr) => (
              <div
                key={card.id}
                className="absolute"
                style={{
                  top: -(arr.length - 1 - i) * 2,
                  left: (arr.length - 1 - i) * 2,
                  zIndex: i,
                  transform: `rotate(${(i - arr.length + 1) * 8}deg)`,
                }}
              >
                <CardImage card={card} />
              </div>
            ))}
            <div style={{ visibility: 'hidden' }}>
              <CardImage card={topCard} />
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {isMyTurn && (
          <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-full px-6 py-1.5">
            <p className="text-yellow-300 text-sm font-bold animate-pulse">Il tuo turno!</p>
          </div>
        )}

        {/* My hand */}
        {me && (
          <div className="w-full max-w-2xl">
            <p className="text-center text-gray-400 text-xs mb-1">
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
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    wild: 'bg-gray-500',
  };
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${colors[color] ?? 'bg-gray-500'} ml-1 align-middle`}
    />
  );
}
