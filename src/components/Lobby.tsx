import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Play, LogIn, Share2, Link } from 'lucide-react';
import { Player, generateRoomCode } from '../types';

interface Props {
  myId: string | null;
  players: Player[];
  isHost: boolean;
  roomCode: string | null;
  onHost: (name: string) => void;
  onJoin: (roomCode: string, name: string) => void;
  onStart: () => void;
  connectionStatus: string;
  initialRoomCode?: string;
}

export default function Lobby({ myId, players, isHost, roomCode, onHost, onJoin, onStart, connectionStatus, initialRoomCode }: Props) {
  const [name, setName] = useState('');
  const [inputCode, setInputCode] = useState(initialRoomCode ?? '');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'pick' | 'host' | 'join'>(initialRoomCode ? 'join' : 'pick');

  useEffect(() => {
    if (initialRoomCode) {
      setInputCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const inviteUrl = roomCode ? `${window.location.origin}?c=${roomCode}` : '';

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'UNO Online', text: 'Unisciti alla mia partita UNO!', url: inviteUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleHost = () => {
    if (!name.trim()) return;
    onHost(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !inputCode.trim()) return;
    onJoin(inputCode.trim().toUpperCase(), name.trim());
  };

  const statusColor = connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400';

  // --- Pick mode ---
  if (mode === 'pick') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg p-4">
        <div className="uno-logo mb-6 sm:mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="text-white text-lg sm:text-xl font-bold text-center mb-2">Come vuoi giocare?</h2>
          <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setMode('host')}>
            <Users size={18} /> Crea partita
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2" onClick={() => setMode('join')}>
            <LogIn size={18} /> Unisciti
          </button>
        </div>
      </div>
    );
  }

  // --- Host setup ---
  if (mode === 'host' && !myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg p-4">
        <div className="uno-logo mb-6 sm:mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-6 sm:p-8 flex flex-col gap-4">
          <button onClick={() => setMode('pick')} className="text-gray-400 hover:text-white text-sm self-start">&larr; Indietro</button>
          <h2 className="text-white text-lg sm:text-xl font-bold">Crea partita</h2>
          <label className="text-gray-300 text-sm">Il tuo nome</label>
          <input
            className="uno-input"
            placeholder="Inserisci il tuo nome..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleHost()}
            autoFocus
          />
          <button className="btn-primary" onClick={handleHost} disabled={!name.trim()}>
            {connectionStatus === 'connecting' ? 'Connessione...' : 'Crea stanza'}
          </button>
        </div>
      </div>
    );
  }

  // --- Join setup ---
  if (mode === 'join' && !myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg p-4">
        <div className="uno-logo mb-6 sm:mb-8">
          <span className="text-white">UNO</span>
        </div>
        <div className="glass-card w-full max-w-sm p-6 sm:p-8 flex flex-col gap-4">
          {!initialRoomCode && (
            <button onClick={() => setMode('pick')} className="text-gray-400 hover:text-white text-sm self-start">&larr; Indietro</button>
          )}
          <h2 className="text-white text-lg sm:text-xl font-bold">Unisciti</h2>
          <label className="text-gray-300 text-sm">Il tuo nome</label>
          <input
            className="uno-input"
            placeholder="Inserisci il tuo nome..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus={!initialRoomCode}
          />
          <label className="text-gray-300 text-sm">Codice stanza</label>
          <input
            className="uno-input font-mono uppercase tracking-widest text-center text-lg"
            placeholder="ABC12345"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus={!!initialRoomCode}
            maxLength={8}
          />
          <button className="btn-primary" onClick={handleJoin} disabled={!name.trim() || !inputCode.trim()}>
            {connectionStatus === 'connecting' ? 'Connessione...' : 'Unisciti'}
          </button>
        </div>
      </div>
    );
  }

  // --- Room lobby (connected) ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-uno-bg p-4">
      <div className="uno-logo mb-6">
        <span className="text-white">UNO</span>
      </div>

      <div className="glass-card w-full max-w-md p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg sm:text-xl font-bold">Sala d'attesa</h2>
          <span className={`text-xs font-medium ${statusColor}`}>
            {connectionStatus === 'connected' ? 'Online' : 'Connessione...'}
          </span>
        </div>

        {/* Invite link section */}
        {roomCode && (
          <div className="bg-black/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link size={14} className="text-gray-400" />
              <p className="text-gray-400 text-xs">Invita amici con questo link</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3 flex items-center gap-2">
              <code className="text-green-400 font-mono text-xs sm:text-sm flex-1 break-all select-all">{inviteUrl}</code>
              <button onClick={handleCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0" title="Copia link">
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 text-center">
                <p className="text-gray-400 text-[10px] mb-0.5">Codice stanza</p>
                <p className="text-white font-mono font-bold text-xl tracking-widest">{roomCode}</p>
              </div>
              <button onClick={handleShare} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Condividi">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Players list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-400" />
            <p className="text-gray-300 text-sm font-medium">Giocatori ({players.length}/4)</p>
          </div>
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 animate-pop" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${PLAYER_COLORS[i % 4]}`}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm sm:text-base">{p.name}</span>
                {p.isHost && <span className="ml-auto text-[10px] text-yellow-400 font-semibold bg-yellow-500/20 px-2 py-0.5 rounded-full">HOST</span>}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - players.length) }, (_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 bg-black/10 rounded-xl px-4 py-3 border border-white/5 border-dashed">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-gray-600 text-lg">+</span>
                </div>
                <span className="text-gray-600 text-sm">In attesa...</span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button className="btn-primary flex items-center justify-center gap-2 animate-pulse-ring" onClick={onStart} disabled={players.length < 2}>
            <Play size={18} />
            {players.length < 2 ? 'Aspetta 2 giocatori' : 'Inizia partita!'}
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
