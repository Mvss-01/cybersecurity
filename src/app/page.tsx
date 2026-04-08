'use client'
import { Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();
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

      <button
        onClick={() => router.push('/main')}
        className="px-8 py-3 bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-200 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)]"
      >
        INITIALIZE CONNECTION
      </button>

      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>
    </div>
  );
};