'use client'
import { Brain, HelpCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const playSound = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(err => console.error("Audio play failed:", err));
  };

  useEffect(() => {
    const startAudio = new Audio('/start.mp3');
    startAudio.loop = true;
    startAudio.volume = 0.5;

    const playAudio = () => {
      startAudio.play().catch(err => {
        console.log("Autoplay blocked, waiting for interaction");
      });
    };

    playAudio();

    const handleFirstClick = () => {
      playAudio();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);

    return () => {
      startAudio.pause();
      startAudio.src = "";
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);

  const handleStart = () => {
    if (name.trim()) {
      localStorage.setItem('neural_heist_user', name);
      playSound("/abort.mp3");
      router.push('/main');
    } else {
      alert("Identifiez-vous, Agent.");
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6 font-mono">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={() => { playSound("/abort.mp3"); setShowInstructions(true) }}
          className="p-2 text-cyan-500 hover:text-cyan-300 transition-colors bg-black/50 border border-cyan-500/30 rounded-full hover:bg-cyan-950/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          title="Instructions"
        >
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      <Brain className="w-16 h-16 sm:w-24 sm:h-24 text-cyan-500 animate-pulse mb-4 sm:mb-6" />

      <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-3 sm:mb-4 text-center">
        NEURAL HEIST
      </h1>

      <p className="text-red-500 max-w-lg text-center mb-6 sm:mb-8 border border-red-900/50 bg-red-950/30 p-3 sm:p-4 rounded-md shadow-[0_0_15px_rgba(239,68,68,0.2)] text-sm sm:text-base">
        ALERTE : RÉSEAU INFILTRÉ.<br />
        Attaque virale en cours. La santé du système diminue.<br />
        Éliminez les virus et sécurisez les nœuds pour survivre.
      </p>

      <div className="flex flex-col mb-6 sm:mb-8 w-full max-w-xs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          placeholder="NOM D'UTILISATEUR..."
          className="bg-black/50 border-b border-cyan-500/50 p-2 text-cyan-400 focus:outline-none focus:border-cyan-400 transition-colors text-center"
        />
      </div>

      <button
        onClick={handleStart}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-200 transition-all uppercase tracking-widest text-sm sm:text-base shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
        disabled={!name.trim()}
      >
        INITIALISER LA CONNEXION
      </button>

      {showInstructions && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-black border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] p-6 sm:p-8 relative">
            <button
              onClick={() => { playSound("/abort.mp3"); setShowInstructions(false) }}
              className="absolute top-4 right-4 text-cyan-500 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6 border-b border-cyan-900/50 pb-2">
              MANUEL OPÉRATOIRE
            </h2>

            <div className="space-y-4 text-cyan-100/80 text-sm sm:text-base leading-relaxed">
              <p>
                <strong className="text-cyan-400">OBJECTIF PRINCIPAL :</strong> Sécuriser tous les nœuds du réseau le plus rapidement possible.
              </p>
              <ul className="list-disc list-inside space-y-2 text-cyan-100/70 mb-4">
                <li><span className="text-red-400 font-bold">La santé diminue constamment.</span> Si elle tombe à 0%, vous êtes déconnecté.</li>
                <li>Cliquez sur les nœuds infectés et répondez correctement aux défis pour les sécuriser.</li>
              </ul>

              <div className="bg-cyan-950/30 border border-cyan-800/50 p-3 sm:p-4 rounded-md space-y-3">
                <strong className="text-cyan-400 text-sm border-b border-cyan-800/50 pb-1 block tracking-wider">MÉCANIQUE DES NŒUDS :</strong>
                <ul className="list-none space-y-2 text-sm text-cyan-100/80">
                  <li><span className="text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.8)] mr-1">●</span> <strong>Nœuds extérieurs :</strong> Questions faciles.</li>
                  <li><span className="text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.8)] mr-1">●●</span> <strong>Nœuds intermédiaires :</strong> Questions moyennes.</li>
                  <li><span className="text-red-500 font-bold drop-shadow-[0_0_2px_rgba(239,68,68,0.8)] mr-1">●●●</span> <strong>Nœud central (Noyau) :</strong> Question difficile. (Nécessite de nettoyer les virus autour d'abord).</li>
                </ul>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-800/50 p-3 sm:p-4 rounded-md space-y-3">
                <strong className="text-cyan-400 text-sm border-b border-cyan-800/50 pb-1 block tracking-wider">IMPACT DES RÉPONSES SUR LA SANTÉ :</strong>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.3)] text-green-400 font-bold">✓</span>
                    <span><strong className="text-green-400 tracking-wider">SUCCÈS :</strong> +5% Santé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.3)] text-red-500 font-bold">✗</span>
                    <span><strong className="text-red-400 tracking-wider">ÉCHEC :</strong> -10% Santé</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => { playSound("/abort.mp3"); setShowInstructions(false) }}
              className="mt-6 w-full py-2 bg-cyan-950/30 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50 transition-colors uppercase tracking-widest text-sm"
            >
              COMPRIS
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>
    </div>
  );
}