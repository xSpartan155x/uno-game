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
  const showCount = Math.min(count, position === 'top' ? 10 : 7);
  const dummyCards = Array.from({ length: showCount });

  return (
    <div className={`flex flex-col items-center gap-1 ${isCurrentPlayer ? 'animate-current-player' : ''}`}>
      {/* Name badge */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
        ${isCurrentPlayer ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' : 'bg-white/10 text-gray-300'}`}>
        {isCurrentPlayer && <span className="animate-pulse">&#9654;</span>}
        <span>{player.name}</span>
        <span className="bg-black/40 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
      </div>

      {/* Cards */}
      <div className="flex items-center" style={{ gap: -4 }}>
        {dummyCards.map((_, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -16 : 0 }}>
            <CardImage card={{ id: `back-${i}`, color: 'wild', value: 'wild' }} faceDown small />
          </div>
        ))}
      </div>
    </div>
  );
}
