import React from 'react';
import { Card, Color } from '../types';
import CardImage from './CardImage';
import { isPlayable } from '../gameLogic';

interface Props {
  cards: Card[];
  isMyTurn: boolean;
  topCard: Card;
  currentColor: Color;
  onPlay: (cardId: string) => void;
}

export default function PlayerHand({ cards, isMyTurn, topCard, currentColor, onPlay }: Props) {
  const playable = (card: Card) => isMyTurn && isPlayable(card, topCard, currentColor);

  const offset = Math.min(60, Math.max(20, 300 / Math.max(cards.length, 1)));

  return (
    <div className="flex justify-center items-end relative" style={{ minHeight: 100 }}>
      <div
        className="flex items-end justify-center"
        style={{
          gap: cards.length > 8 ? -8 : 4,
          flexWrap: cards.length > 12 ? 'wrap' : 'nowrap',
          maxWidth: '100%',
          padding: '0 8px',
        }}
      >
        {cards.map((card, i) => {
          const canPlay = playable(card);
          const angle = cards.length > 1
            ? ((i / (cards.length - 1)) - 0.5) * Math.min(30, cards.length * 3)
            : 0;
          const yOffset = Math.abs(angle) * 0.6;

          return (
            <div
              key={card.id}
              className={`transition-all duration-150 ${canPlay ? 'hover:-translate-y-4 cursor-pointer' : 'opacity-70'}`}
              style={{
                transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                transformOrigin: 'bottom center',
                zIndex: i,
                marginLeft: cards.length > 8 ? -18 : 0,
              }}
              onClick={() => canPlay && onPlay(card.id)}
              title={canPlay ? 'Gioca questa carta' : undefined}
            >
              <CardImage
                card={card}
                highlight={canPlay}
                disabled={!canPlay}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
