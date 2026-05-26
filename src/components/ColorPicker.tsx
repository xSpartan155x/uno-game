import React from 'react';
import { Color } from '../types';

const COLORS: { value: Color; bg: string; label: string; emoji: string }[] = [
  { value: 'red',    bg: '#e53e3e', label: 'Rosso',  emoji: '🔴' },
  { value: 'green',  bg: '#38a169', label: 'Verde',  emoji: '🟢' },
  { value: 'blue',   bg: '#3182ce', label: 'Blu',    emoji: '🔵' },
  { value: 'yellow', bg: '#d69e2e', label: 'Giallo', emoji: '🟡' },
];

interface Props {
  onPick: (color: Color) => void;
}

export default function ColorPicker({ onPick }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card p-6 sm:p-8 flex flex-col items-center gap-5 max-w-xs w-full animate-pop">
        <h3 className="text-white text-lg font-bold">Scegli il colore</h3>
        <div className="grid grid-cols-2 gap-3 w-full">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onPick(c.value)}
              className="h-14 sm:h-16 rounded-2xl font-bold text-white text-sm sm:text-lg transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              style={{ background: c.bg }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
