import React from 'react';
import { Card, Color } from '../types';
import CardImage from './CardImage';
import { isPlayable } from '../gameLogic';

interface Props {
  cards: Card[];
  isMyTurn: boolean;
  topCard: Card;
  currentColor: Color;
  pendingDraw: number;
  onPlay: (cardId: string) => void;
}

export default function PlayerHand({ cards, isMyTurn, topCard, currentColor, pendingDraw, onPlay }: Props) {
  const canPlay = (card: Card) => isMyTurn && isPlayable(card, topCard, currentColor, pendingDraw);

  return (
    <div className="w-full overflow-x-auto overflow-y-visible pb-2 -mx-2 px-2 scrollbar-hide">
      <div className="flex items-end justify-center min-w-min" style={{ gap: cards.length > 10 ? 2 : 4 }}>
        {cards.map((card, i) => {
          const playable = canPlay(card);
          const spread = Math.min(28, Math.max(12, 220 / Math.max(cards.length, 1)));
          const angle = cards.length > 1
            ? ((i / (cards.length - 1)) - 0.5) * Math.min(20, cards.length * 2)
            : 0;

          return (
            <div
              key={card.id}
              className={`transition-all duration-200 ${playable ? 'hover:-translate-y-5 sm:hover:-translate-y-6' : 'opacity-60 sm:opacity-70'}`}
              style={{
                marginLeft: i > 0 ? -Math.max(0, 80 - spread) : 0,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
                zIndex: i,
              }}
              onClick={() => playable && onPlay(card.id)}
            >
              <CardImage
                card={card}
                highlight={playable}
                disabled={!playable}
                mini={cards.length > 12}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
