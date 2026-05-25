import React, { useState } from 'react';
import { Copy, Check, Users, Wifi, WifiOff, Play, LogIn } from 'lucide-react';
import { Player } from '../types';

interface Props {
  myId: string | null;
  players: Player[];
  isHost: boolean;
  onHost: (name: string) => void;
  onJoin: (hostId: string, name: string) => void;
  onStart: () => void;
  connectionStatus: string;
}

export default function Lobby({ myId, players, isHost, onHost, onJoin, onStart, connectionStatus }: Props) {
  const [name, setName] = useState('');
  const [hostId, setHostId] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'pick' | 'host' | 'join'>('pick');

  const handleCopy = () => {
    if (!myId) return;
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHost = () => {
    if (!name.trim()) return;
    onHost(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !hostId.trim()) return;
    onJoin(hostId.trim(), name.trim());
  };

  const statusColor = connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400';
  const StatusIcon = connectionStatus === 'connected' ? Wifi : WifiOff;

  if (mode === 'pick') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg">
        <div className="uno-logo mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-8 flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold text-center mb-2">Come vuoi giocare?</h2>
          <button className="btn-primary" onClick={() => setMode('host')}>
            <Users size={18} className="inline mr-2" /> Crea partita (Host)
          </button>
          <button className="btn-secondary" onClick={() => setMode('join')}>
            <LogIn size={18} className="inline mr-2" /> Unisciti a una partita
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'host' && !myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg">
        <div className="uno-logo mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-8 flex flex-col gap-4">
          <button onClick={() => setMode('pick')} className="text-gray-400 hover:text-white text-sm self-start mb-2">&larr; Indietro</button>
          <h2 className="text-white text-xl font-bold">Crea partita</h2>
          <label className="text-gray-300 text-sm">Il tuo nome</label>
          <input
            className="uno-input"
            placeholder="Inserisci il tuo nome..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleHost()}
          />
          <button className="btn-primary" onClick={handleHost} disabled={!name.trim()}>
            {connectionStatus === 'connecting' ? 'Connessione...' : 'Crea stanza'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join' && !myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg">
        <div className="uno-logo mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-8 flex flex-col gap-4">
          <button onClick={() => setMode('pick')} className="text-gray-400 hover:text-white text-sm self-start mb-2">&larr; Indietro</button>
          <h2 className="text-white text-xl font-bold">Unisciti</h2>
          <label className="text-gray-300 text-sm">Il tuo nome</label>
          <input
            className="uno-input"
            placeholder="Inserisci il tuo nome..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label className="text-gray-300 text-sm">ID stanza host</label>
          <input
            className="uno-input"
            placeholder="Incolla l'ID dell'host..."
            value={hostId}
            onChange={e => setHostId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button className="btn-primary" onClick={handleJoin} disabled={!name.trim() || !hostId.trim()}>
            {connectionStatus === 'connecting' ? 'Connessione...' : 'Unisciti'}
          </button>
        </div>
      </div>
    );
  }

  // Lobby room view
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg p-4">
      <div className="uno-logo mb-6">
        <span className="text-white">UNO</span>
      </div>

      <div className="glass-card w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">Sala d'attesa</h2>
          <span className={`flex items-center gap-1 text-sm ${statusColor}`}>
            <StatusIcon size={14} /> {connectionStatus === 'connected' ? 'Online' : 'Connessione...'}
          </span>
        </div>

        {isHost && myId && (
          <div className="bg-black/30 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">ID stanza (condividi con gli amici)</p>
            <div className="flex items-center gap-2">
              <code className="text-green-400 font-mono text-sm flex-1 break-all">{myId}</code>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copia ID"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-400" />
            <p className="text-gray-300 text-sm font-medium">Giocatori ({players.length}/4)</p>
          </div>
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${PLAYER_COLORS[i % 4]}`}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <span className="text-white font-medium">{p.name}</span>
                {p.isHost && <span className="ml-auto text-xs text-yellow-400 font-semibold">HOST</span>}
              </div>
            ))}
            {players.length < 4 && (
              <div className="flex items-center gap-3 bg-black/10 rounded-xl px-4 py-3 border border-white/10 border-dashed">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">+</span>
                </div>
                <span className="text-gray-500 text-sm">In attesa...</span>
              </div>
            )}
          </div>
        </div>

        {isHost && (
          <button
            className="btn-primary"
            onClick={onStart}
            disabled={players.length < 2}
          >
            <Play size={18} className="inline mr-2" />
            {players.length < 2 ? 'Aspetta almeno 2 giocatori' : 'Inizia partita!'}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-gray-400 text-sm animate-pulse">
            In attesa che l'host avvii la partita...
          </p>
        )}
      </div>
    </div>
  );
}

const PLAYER_COLORS = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-yellow-500 text-white',
];
