import React from 'react';
import { Color } from '../types';

const COLORS: { value: Color; bg: string; label: string }[] = [
  { value: 'red',    bg: '#e53e3e', label: 'Rosso' },
  { value: 'green',  bg: '#38a169', label: 'Verde' },
  { value: 'blue',   bg: '#3182ce', label: 'Blu' },
  { value: 'yellow', bg: '#d69e2e', label: 'Giallo' },
];

interface Props {
  onPick: (color: Color) => void;
}

export default function ColorPicker({ onPick }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="glass-card p-8 flex flex-col items-center gap-6 max-w-xs w-full mx-4">
        <h3 className="text-white text-lg font-bold">Scegli il colore</h3>
        <div className="grid grid-cols-2 gap-4 w-full">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onPick(c.value)}
              className="h-16 rounded-2xl font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg"
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
