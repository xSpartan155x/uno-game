import React, { useEffect, useState } from 'react';
import { GameEvent } from '../types';
import { RotateCcw, RotateCw, Ban, PlusCircle, Palette, Trophy, Hand, Zap } from 'lucide-react';

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
    setNotifications(prev => [...prev.slice(-4), { id, event }]);
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2500);
    return () => clearTimeout(timer);
  }, [event]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-12 sm:top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
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
      icon = <RotateCcw size={22} className="animate-spin-once" />;
      text = 'CAMBIO GIRO!';
      bgClass = 'bg-gradient-to-r from-amber-600 to-orange-500';
      animClass = 'animate-reverse-banner';
      break;
    case 'skip':
      icon = <Ban size={22} />;
      text = `SALTATO: ${event.player}!`;
      bgClass = 'bg-gradient-to-r from-rose-600 to-red-500';
      animClass = 'animate-skip-banner';
      break;
    case 'draw2':
      icon = <Zap size={22} />;
      text = `+2 per ${event.target}!`;
      bgClass = 'bg-gradient-to-r from-rose-700 to-red-600';
      animClass = 'animate-draw-banner';
      break;
    case 'wild4':
      icon = <Zap size={22} />;
      text = `+4 per ${event.target}!`;
      bgClass = 'bg-gradient-to-r from-gray-800 to-gray-700';
      animClass = 'animate-draw-banner';
      break;
    case 'draw':
      icon = <Hand size={22} />;
      text = `${event.player} pesca ${event.count}!`;
      bgClass = 'bg-gradient-to-r from-slate-600 to-slate-500';
      animClass = 'animate-draw-banner';
      break;
    case 'colorChange':
      icon = <Palette size={22} />;
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
      icon = <Trophy size={22} />;
      text = `${event.player} VINCE!`;
      bgClass = 'bg-gradient-to-r from-yellow-500 to-amber-500';
      animClass = 'animate-win-banner';
      break;
    default:
      icon = <PlusCircle size={22} />;
      text = '';
      bgClass = 'bg-gray-700';
      animClass = 'animate-pop';
  }

  return (
    <div
      className={`${bgClass} ${animClass} text-white font-black text-base sm:text-xl px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 border border-white/20`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
