import React from 'react';
import { Card, Color } from '../types';

const COLOR_MAP: Record<Color, { bg: string; dark: string; text: string }> = {
  red:    { bg: '#e53e3e', dark: '#9b2c2c', text: '#fff' },
  green:  { bg: '#38a169', dark: '#276749', text: '#fff' },
  blue:   { bg: '#3182ce', dark: '#2c5282', text: '#fff' },
  yellow: { bg: '#d69e2e', dark: '#975a16', text: '#1a1a2e' },
  wild:   { bg: '#2d3748', dark: '#1a202c', text: '#fff' },
};

const LABEL: Record<string, string> = {
  skip: '⊘', reverse: '↺', draw2: '+2', wild: 'W', wild4: '+4',
};

interface Props {
  card: Card;
  faceDown?: boolean;
  small?: boolean;
  mini?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function CardImage({ card, faceDown = false, small = false, mini = false, highlight = false, onClick, disabled }: Props) {
  const w = mini ? 36 : small ? 52 : 80;
  const h = mini ? 54 : small ? 78 : 120;
  const r = mini ? 4 : small ? 6 : 10;

  if (faceDown) {
    return (
      <svg
        width={w} height={h}
        viewBox={`0 0 ${w} ${h}`}
        onClick={onClick}
        className={`flex-shrink-0 ${onClick ? 'cursor-pointer' : ''}`}
        role="img"
        aria-label="card back"
      >
        <rect width={w} height={h} rx={r} ry={r} fill="#1a1a2e" />
        <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={r - 1} ry={r - 1} fill="none" stroke="#e2e8f0" strokeWidth={1} />
        <defs>
          <pattern id={`bp-${w}`} patternUnits="userSpaceOnUse" width={6} height={6}>
            <line x1={0} y1={6} x2={6} y2={0} stroke="#2d3a5e" strokeWidth={0.8} />
          </pattern>
        </defs>
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={r - 2} fill={`url(#bp-${w})`} />
        <ellipse cx={w / 2} cy={h / 2} rx={w * 0.26} ry={h * 0.2} fill="#c53030" />
        <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={mini ? 7 : small ? 9 : 14} fontWeight="bold" fontFamily="sans-serif">UNO</text>
      </svg>
    );
  }

  const { bg, dark, text } = COLOR_MAP[card.color];
  const isWild = card.color === 'wild';
  const label = LABEL[card.value] ?? card.value;
  const isNum = /^\d$/.test(label);
  const fontSize = mini ? (isNum ? 16 : 10) : small ? (isNum ? 22 : 14) : (isNum ? 38 : 22);
  const cornerSize = mini ? 6 : small ? 8 : 12;

  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      onClick={!disabled ? onClick : undefined}
      className={`flex-shrink-0 transition-transform duration-150 ${onClick && !disabled ? 'cursor-pointer' : ''} ${highlight ? 'animate-card-glow' : ''}`}
      role="img"
      aria-label={`${card.color} ${card.value}`}
    >
      <defs>
        <filter id={`sh-${card.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      <rect width={w} height={h} rx={r} ry={r} fill={bg} filter={`url(#sh-${card.id})`} />

      <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={r - 1} ry={r - 1} fill="none"
        stroke={highlight ? '#ffd700' : '#ffffffaa'} strokeWidth={highlight ? 2.5 : 1} />

      {isWild ? (
        <>
          <clipPath id={`oval-${card.id}`}>
            <ellipse cx={w / 2} cy={h / 2} rx={w * 0.33} ry={h * 0.26} />
          </clipPath>
          <ellipse cx={w / 2} cy={h / 2} rx={w * 0.33} ry={h * 0.26} fill="#fff" />
          <g clipPath={`url(#oval-${card.id})`}>
            <rect x={0} y={0} width={w / 2} height={h / 2} fill="#e53e3e" />
            <rect x={w / 2} y={0} width={w / 2} height={h / 2} fill="#d69e2e" />
            <rect x={0} y={h / 2} width={w / 2} height={h / 2} fill="#3182ce" />
            <rect x={w / 2} y={h / 2} width={w / 2} height={h / 2} fill="#38a169" />
          </g>
        </>
      ) : (
        <ellipse cx={w / 2} cy={h / 2} rx={w * 0.33} ry={h * 0.26} fill={dark} />
      )}

      <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central"
        fill={isWild ? '#fff' : text} fontSize={fontSize} fontWeight="900"
        fontFamily="'Arial Black', sans-serif">{label}</text>

      <text x={mini ? 3 : small ? 5 : 7} y={mini ? 3 : small ? 5 : 8}
        textAnchor="start" dominantBaseline="hanging"
        fill={text} fontSize={cornerSize} fontWeight="bold" fontFamily="'Arial Black', sans-serif">{label}</text>

      <text x={w - (mini ? 3 : small ? 5 : 7)} y={h - (mini ? 3 : small ? 5 : 8)}
        textAnchor="end" dominantBaseline="ideographic"
        fill={text} fontSize={cornerSize} fontWeight="bold" fontFamily="'Arial Black', sans-serif"
        transform={`rotate(180, ${w / 2}, ${h / 2})`}>{label}</text>
    </svg>
  );
}
