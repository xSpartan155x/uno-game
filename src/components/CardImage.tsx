import React from 'react';
import { Card, Color } from '../types';

const COLOR_MAP: Record<Color, { bg: string; dark: string; text: string }> = {
  red:    { bg: '#e53e3e', dark: '#9b2c2c', text: '#fff' },
  green:  { bg: '#38a169', dark: '#276749', text: '#fff' },
  blue:   { bg: '#3182ce', dark: '#2c5282', text: '#fff' },
  yellow: { bg: '#d69e2e', dark: '#975a16', text: '#fff' },
  wild:   { bg: '#2d3748', dark: '#1a202c', text: '#fff' },
};

const LABEL: Record<string, string> = {
  skip: '⊘',
  reverse: '↺',
  draw2: '+2',
  wild: 'W',
  wild4: '+4',
};

interface Props {
  card: Card;
  faceDown?: boolean;
  small?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function CardImage({ card, faceDown = false, small = false, highlight = false, onClick, disabled }: Props) {
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  const r = small ? 6 : 10;

  if (faceDown) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}
        aria-label="card back"
      >
        <rect width={w} height={h} rx={r} ry={r} fill="#1a1a2e" />
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={r - 2} ry={r - 2} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
        {/* diagonal pattern */}
        <defs>
          <pattern id="bp" patternUnits="userSpaceOnUse" width={8} height={8}>
            <line x1={0} y1={8} x2={8} y2={0} stroke="#2d3a5e" strokeWidth={1} />
          </pattern>
        </defs>
        <rect x={6} y={6} width={w - 12} height={h - 12} rx={r - 3} fill="url(#bp)" />
        <ellipse cx={w / 2} cy={h / 2} rx={w * 0.28} ry={h * 0.22} fill="#c53030" />
        <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={small ? 10 : 14} fontWeight="bold" fontFamily="sans-serif">
          UNO
        </text>
      </svg>
    );
  }

  const { bg, dark, text } = COLOR_MAP[card.color];
  const isWild = card.color === 'wild';
  const label = LABEL[card.value] ?? card.value;
  const isNum = /^\d$/.test(label);
  const fontSize = small ? (isNum ? 22 : 14) : (isNum ? 38 : 22);
  const cornerSize = small ? 8 : 12;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      onClick={!disabled ? onClick : undefined}
      style={{ cursor: onClick && !disabled ? 'pointer' : 'default', flexShrink: 0 }}
      aria-label={`${card.color} ${card.value}`}
    >
      {/* drop shadow */}
      <defs>
        <filter id={`sh-${card.id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* card body */}
      <rect
        width={w} height={h} rx={r} ry={r}
        fill={bg}
        filter={`url(#sh-${card.id})`}
      />

      {/* border */}
      <rect
        x={2} y={2} width={w - 4} height={h - 4}
        rx={r - 1} ry={r - 1}
        fill="none"
        stroke={highlight ? '#ffd700' : '#ffffffaa'}
        strokeWidth={highlight ? 3 : 1.5}
      />

      {/* center oval */}
      {isWild ? (
        // wild: 4 color quadrants
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

      {/* center label */}
      <text
        x={w / 2} y={h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isWild ? '#fff' : text}
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="'Arial Black', sans-serif"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>

      {/* top-left corner */}
      <text
        x={small ? 5 : 7} y={small ? 5 : 8}
        textAnchor="start"
        dominantBaseline="hanging"
        fill={text}
        fontSize={cornerSize}
        fontWeight="bold"
        fontFamily="'Arial Black', sans-serif"
      >
        {label}
      </text>

      {/* bottom-right corner (rotated) */}
      <text
        x={w - (small ? 5 : 7)} y={h - (small ? 5 : 8)}
        textAnchor="end"
        dominantBaseline="ideographic"
        fill={text}
        fontSize={cornerSize}
        fontWeight="bold"
        fontFamily="'Arial Black', sans-serif"
        transform={`rotate(180, ${w / 2}, ${h / 2})`}
      >
        {label}
      </text>
    </svg>
  );
}
