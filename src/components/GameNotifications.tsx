import React, { useEffect, useState } from 'react';
import { GameEvent } from '../types';
import { RotateCcw, RotateCw, Ban, PlusCircle, Palette, Trophy, Hand } from 'lucide-react';

interface Props {
  event: GameEvent | null;
}

interface Notification {
  id: number;
  event: GameEvent;
}

let notifId = 0;

export default function GameNotifications({ event }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!event) return;
    const id = ++notifId;
    setNotifications(prev => [...prev, { id, event }]);
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2200);
    return () => clearTimeout(timer);
  }, [event]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {notifications.map(n => (
        <EventBanner key={n.id} event={n.event} />
      ))}
    </div>
  );
}

function EventBanner({ event }: { event: GameEvent }) {
  let icon: React.ReactNode;
  let text: string;
  let bgClass: string;
  let animClass: string;

  switch (event.type) {
    case 'reverse':
      icon = <RotateCcw size={24} />;
      text = 'CAMBIO GIRO!';
      bgClass = 'bg-gradient-to-r from-amber-600 to-orange-500';
      animClass = 'animate-reverse-banner';
      break;
    case 'skip':
      icon = <Ban size={24} />;
      text = `SALTATO: ${event.player}!`;
      bgClass = 'bg-gradient-to-r from-rose-600 to-red-500';
      animClass = 'animate-skip-banner';
      break;
    case 'draw2':
      icon = <PlusCircle size={24} />;
      text = `+2 per ${event.target}!`;
      bgClass = 'bg-gradient-to-r from-rose-700 to-red-600';
      animClass = 'animate-draw-banner';
      break;
    case 'wild4':
      icon = <PlusCircle size={24} />;
      text = `+4 per ${event.target}!`;
      bgClass = 'bg-gradient-to-r from-gray-800 to-gray-700';
      animClass = 'animate-draw-banner';
      break;
    case 'draw':
      icon = <Hand size={24} />;
      text = `${event.player} pesca!`;
      bgClass = 'bg-gradient-to-r from-slate-600 to-slate-500';
      animClass = 'animate-draw-banner';
      break;
    case 'colorChange':
      icon = <Palette size={24} />;
      const colorName: Record<string, string> = { red: 'Rosso', green: 'Verde', blue: 'Blu', yellow: 'Giallo' };
      text = `Colore: ${colorName[event.color] ?? event.color}`;
      const colorBg: Record<string, string> = {
        red: 'from-red-600 to-red-500',
        green: 'from-green-600 to-green-500',
        blue: 'from-blue-600 to-blue-500',
        yellow: 'from-yellow-600 to-yellow-500',
      };
      bgClass = `bg-gradient-to-r ${colorBg[event.color] ?? 'from-gray-600 to-gray-500'}`;
      animClass = 'animate-color-banner';
      break;
    case 'win':
      icon = <Trophy size={24} />;
      text = `${event.player} VINCE!`;
      bgClass = 'bg-gradient-to-r from-yellow-500 to-amber-500';
      animClass = 'animate-win-banner';
      break;
    default:
      icon = null;
      text = '';
      bgClass = 'bg-gray-700';
      animClass = 'animate-pop';
  }

  return (
    <div
      className={`${bgClass} ${animClass} text-white font-black text-lg sm:text-xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
