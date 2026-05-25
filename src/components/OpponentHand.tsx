import React from 'react';
import { Player } from '../types';
import CardImage from './CardImage';

interface Props {
  player: Player;
  isCurrentPlayer: boolean;
  position: 'top' | 'left' | 'right';
}

export default function OpponentHand({ player, isCurrentPlayer, position }: Props) {
  const count = player.hand.length;
  const dummyCards = Array.from({ length: Math.min(count, 10) });

  const isVertical = position === 'left' || position === 'right';

  return (
    <div className={`flex flex-col items-center gap-2 ${isCurrentPlayer ? 'drop-shadow-[0_0_12px_rgba(255,215,0,0.7)]' : ''}`}>
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center`} style={{ gap: -8 }}>
        {dummyCards.map((_, i) => (
          <div
            key={i}
            style={{
              marginLeft: !isVertical && i > 0 ? -18 : 0,
              marginTop: isVertical && i > 0 ? -22 : 0,
            }}
          >
            <CardImage
              card={{ id: `back-${i}`, color: 'wild', value: 'wild' }}
              faceDown
              small
            />
          </div>
        ))}
      </div>
      <div className={`flex items-center gap-2 ${isCurrentPlayer ? 'text-yellow-300' : 'text-gray-300'}`}>
        <span className="font-bold text-sm">{player.name}</span>
        <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">{count}</span>
        {isCurrentPlayer && <span className="text-xs animate-pulse">&#x25B6;</span>}
      </div>
    </div>
  );
}
