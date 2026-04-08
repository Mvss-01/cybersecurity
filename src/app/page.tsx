'use client'
import { Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleStart = () => {
    if (name.trim()) {
      localStorage.setItem('neural_heist_user', name);
      router.push('/main');
    } else {
      alert("Identify yourself, Operative.");
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-6 font-mono">
      <Brain className="w-24 h-24 text-cyan-500 animate-pulse mb-6" />

      <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 text-center">
        NEURAL HEIST
      </h1>

      <p className="text-red-500 max-w-lg text-center mb-8 border border-red-900/50 bg-red-950/30 p-4 rounded-md shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        WARNING: CONSCIOUSNESS TRAPPED.<br />
        Lethal cyber-attack in progress. Neural sync degrading.<br />
        Identify the culprit and patch the network to survive.
      </p>

      <div className="flex flex-col mb-8 w-full max-w-xs">
        <label className="text-cyan-600 text-xs uppercase mb-2 tracking-tighter">Enter Username:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="USERNAME..."
          className="bg-black/50 border-b border-cyan-500/50 p-2 text-cyan-400 focus:outline-none focus:border-cyan-400 transition-colors text-center"
        />
      </div>

      <button
        onClick={handleStart}
        className="px-8 py-3 bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-200 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
        disabled={!name.trim()}
      >
        INITIALIZE CONNECTION
      </button>

      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>
    </div>
  );
};