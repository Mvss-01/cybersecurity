"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShieldAlert, Lock, Terminal as TerminalIcon, ChevronRight, Clock, Trophy, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

import EASY_QUESTIONS from '../data/easy.json';
import MEDIUM_QUESTIONS from '../data/medium.json';
import HARD_QUESTIONS from '../data/hard.json';
import { supabase } from '../lib/supabase';

type NodeStatus = 'secure' | 'virus';
type NodeDifficulty = 'easy' | 'medium' | 'hard';

interface MapNode {
    id: string;
    status: NodeStatus;
    difficulty: NodeDifficulty;
    isBoss?: boolean;
}

type HexMap = MapNode[][];

const INITIAL_MAP: HexMap = [
    [{ id: 'node-0', status: 'virus', difficulty: 'easy' }, { id: 'node-1', status: 'virus', difficulty: 'easy' }, { id: 'node-2', status: 'virus', difficulty: 'easy' }],
    [{ id: 'node-3', status: 'virus', difficulty: 'easy' }, { id: 'node-4', status: 'virus', difficulty: 'medium' }, { id: 'node-5', status: 'virus', difficulty: 'medium' }, { id: 'node-6', status: 'virus', difficulty: 'easy' }],
    [{ id: 'node-7', status: 'virus', difficulty: 'easy' }, { id: 'node-8', status: 'virus', difficulty: 'medium' }, { id: 'node-9', status: 'virus', difficulty: 'hard', isBoss: true }, { id: 'node-10', status: 'virus', difficulty: 'medium' }, { id: 'node-11', status: 'virus', difficulty: 'easy' }],
    [{ id: 'node-12', status: 'virus', difficulty: 'easy' }, { id: 'node-13', status: 'virus', difficulty: 'medium' }, { id: 'node-14', status: 'virus', difficulty: 'medium' }, { id: 'node-15', status: 'virus', difficulty: 'easy' }],
    [{ id: 'node-16', status: 'virus', difficulty: 'easy' }, { id: 'node-17', status: 'virus', difficulty: 'easy' }, { id: 'node-18', status: 'virus', difficulty: 'easy' }]
];

function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const HexNode = React.memo(function HexNode({
    node,
    onClick
}: {
    node: MapNode;
    onClick: (node: MapNode) => void;
}) {
    const isVirus = node.status === 'virus';
    const isBoss = node.isBoss;

    let bgColor = '#10a62bff';
    let shadowColor = 'rgba(40, 174, 65, 0.5)';
    let iconColorClass = 'text-cyan-600';
    let textColorClass = 'text-cyan-600';
    let label = 'SÉCURISÉ';

    if (isVirus) {
        label = isBoss ? 'NOYAU' : 'VIRUS';

        if (node.difficulty === 'easy') {
            bgColor = '#891919ff';
            shadowColor = 'rgba(248, 113, 113, 0.15)';
            iconColorClass = 'text-red-400 opacity-50';
            textColorClass = 'text-red-400 opacity-80';
        } else if (node.difficulty === 'medium') {
            bgColor = '#7f1d1d';
            shadowColor = 'rgba(239, 68, 68, 0.5)';
            iconColorClass = 'text-red-400';
            textColorClass = 'text-red-300';
        } else if (node.difficulty === 'hard') {
            bgColor = '#991b1b';
            shadowColor = 'rgba(220, 38, 38, 0.9)';
            iconColorClass = 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
            textColorClass = 'text-red-200 font-bold';
        }
    }

    return (
        <div
            onClick={() => onClick(node)}
            className="relative hex-node cursor-pointer transition-transform duration-200 hover:scale-105 group flex items-center justify-center text-center"
            style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                backgroundColor: bgColor,
                boxShadow: `inset 0 0 20px ${shadowColor}`,
                willChange: 'transform',
            }}
        >
            <div
                className="absolute inset-[2px] sm:inset-[3px] flex flex-col items-center justify-center z-10"
                style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    backgroundColor: '#020617',
                }}
            >
                <div className="flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    {isVirus ? (
                        <>
                            <ShieldAlert className={`hex-icon mb-0.5 sm:mb-1 ${iconColorClass}`} />
                            <span className={`hex-label font-bold ${textColorClass}`}>{label}</span>
                        </>
                    ) : (
                        <>
                            <Lock className="hex-icon text-green-600 mb-0.5 sm:mb-1" />
                            <span className="hex-label font-bold text-green-600">SÉCURISÉ</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export default function IntegratedNeuralHeist() {
    const router = useRouter();

    const [health, setHealth] = useState<number>(100);
    const [logMessage, setLogMessage] = useState<string>("Sélectionnez une cible...");
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const [mapNodes, setMapNodes] = useState<HexMap>(INITIAL_MAP);
    const [activeQuiz, setActiveQuiz] = useState<{ node: MapNode, questionData: any } | null>(null);
    const [clearedQuestions, setClearedQuestions] = useState<string[]>([]);

    const [assignedQuestions, setAssignedQuestions] = useState<Record<string, any>>({});

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [finalTime, setFinalTime] = useState(0);

    // --- NOUVEAU : Verrou pour empêcher les doubles envois ---
    const scoreSavedRef = useRef<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showBossWarning, setShowBossWarning] = useState<boolean>(false);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [username, setUsername] = useState('AGENT');

    const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = (path: string) => {
        const audio = new Audio(path);
        audio.play().catch(err => console.error("Audio play failed:", err));
    };

    useEffect(() => {
        ambientAudioRef.current = new Audio('/ambient sound.mp3');
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = 0.4;

        const playAmbient = () => {
            ambientAudioRef.current?.play().catch(err => {
                console.log("Autoplay blocked, waiting for user interaction");
            });
        };

        playAmbient();

        const handleFirstClick = () => {
            playAmbient();
            window.removeEventListener('click', handleFirstClick);
        };
        window.addEventListener('click', handleFirstClick);

        return () => {
            ambientAudioRef.current?.pause();
            if (ambientAudioRef.current) ambientAudioRef.current.src = "";
            window.removeEventListener('click', handleFirstClick);
        };
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('neural_heist_user');
        if (stored) {
            setUsername(stored);
            setIsAuthorized(true);
        } else {
            router.replace('/');
            setIsAuthorized(false);
        }
    }, [router]);

    useEffect(() => {
        // Usernames persist across games so the user can continue as themselves
        if (isGameOver || gameComplete) {
            // localStorage.removeItem('neural_heist_user');
        }
    }, [isGameOver, gameComplete]);

    const elapsedRef = useRef(elapsedSeconds);
    useEffect(() => {
        elapsedRef.current = elapsedSeconds;
    }, [elapsedSeconds]);

    const { totalNodes, securedNodes, activeThreats } = useMemo(() => {
        const flat = mapNodes.flat();
        return {
            totalNodes: flat.length,
            securedNodes: flat.filter(n => n.status === 'secure').length,
            activeThreats: flat.filter(n => n.status === 'virus').length,
        };
    }, [mapNodes]);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            if (!isGameOver && !gameComplete) {
                setElapsedSeconds(prev => prev + 1);
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isGameOver, gameComplete]);

    useEffect(() => {
        if (isGameOver || gameComplete) return;

        const healthDrainTimer = setInterval(() => {
            setHealth((prevHealth) => {
                const nextHealth = prevHealth - 1;
                if (nextHealth <= 0) {
                    setIsGameOver(true);
                    return 0;
                }
                return nextHealth;
            });
        }, 1500);

        return () => clearInterval(healthDrainTimer);
    }, [isGameOver, gameComplete]);

    // --- MISE À JOUR : Logique de victoire sécurisée avec verrou ---
    const checkWinCondition = useCallback(async (map: HexMap) => {
        const allSecure = map.flat().every(node => node.status === 'secure');

        if (allSecure && !scoreSavedRef.current) {
            scoreSavedRef.current = true; // Verrouille immédiatement

            const finalTimeSeconds = elapsedRef.current;
            setFinalTime(finalTimeSeconds);
            setGameComplete(true);
            playSound("/Network Secured.wav");
            if (timerRef.current) clearInterval(timerRef.current);

            try {
                const { data: existingData, error: fetchError } = await supabase
                    .from('scores')
                    .select('time')
                    .eq('username', username);

                if (fetchError) {
                    console.error('Error fetching score:', fetchError);
                    setLogMessage("ERREUR LORS DE LA VÉRIFICATION DU SCORE.");
                    scoreSavedRef.current = false;
                    return;
                }

                let saveError = null;

                if (existingData && existingData.length > 0) {
                    const bestTime = existingData[0].time;
                    if (finalTimeSeconds < bestTime) {
                        const { error } = await supabase
                            .from('scores')
                            .update({ time: finalTimeSeconds })
                            .eq('username', username);
                        saveError = error;
                    } else {
                        console.log('Score not updated: previous time was better');
                    }
                } else {
                    const { error } = await supabase
                        .from('scores')
                        .insert([
                            {
                                username: username,
                                time: finalTimeSeconds
                            }
                        ]);
                    saveError = error;
                }

                if (saveError) {
                    console.error('Error saving score:', saveError);
                    setLogMessage("ERREUR LORS DE LA SAUVEGARDE DU SCORE.");
                    scoreSavedRef.current = false; // Déverrouille en cas d'erreur
                } else {
                    console.log('Score handled successfully');
                    setLogMessage("RÉSEAU SÉCURISÉ. SCORE ENREGISTRÉ.");
                }
            } catch (err) {
                console.error('Unexpected error saving score:', err);
                setLogMessage("ERREUR CRITIQUE SYSTÈME.");
                scoreSavedRef.current = false; // Déverrouille en cas d'erreur
            }
        }
    }, [username]);

    // --- NOUVEAU : Observer les changements de mapNodes pour déclencher la victoire ---
    useEffect(() => {
        if (!gameComplete && mapNodes.length > 0) {
            const allSecure = mapNodes.flat().every(node => node.status === 'secure');
            if (allSecure) {
                checkWinCondition(mapNodes);
            }
        }
    }, [mapNodes, gameComplete, checkWinCondition]);

    const handleNodeClick = useCallback((node: MapNode): void => {
        if (node.status === 'secure') {
            setLogMessage(`NŒUD ${node.id.replace('node-', '')} DÉJÀ SÉCURISÉ.`);
            return;
        }

        if (node.isBoss) {
            const virusCount = mapNodes.flat().filter(n => n.status === 'virus' && !n.isBoss).length;
            if (virusCount !== 0) {
                setLogMessage("ACCÈS REFUSÉ : DÉTRUISEZ D'ABORD LES VIRUS AUTOUR.");
                setShowBossWarning(true);

                if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
                warningTimeoutRef.current = setTimeout(() => {
                    setShowBossWarning(false);
                }, 3000);

                return;
            }
        }

        if (assignedQuestions[node.id]) {
            setLogMessage("CHARGEMENT DU DÉFI...");
            setActiveQuiz({ node, questionData: assignedQuestions[node.id] });
            return;
        }

        setLogMessage("CHARGEMENT DU DÉFI...");

        const questions = node.isBoss
            ? HARD_QUESTIONS
            : (node.difficulty === 'easy' ? EASY_QUESTIONS : node.difficulty === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS);

        let availableQuestions = questions.filter(q => !clearedQuestions.includes(q.question));
        if (availableQuestions.length === 0) {
            availableQuestions = questions;
        }

        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

        const shuffledQuestion = {
            ...randomQuestion,
            options: shuffleArray(randomQuestion.options)
        };

        setAssignedQuestions(prev => ({ ...prev, [node.id]: shuffledQuestion }));
        setActiveQuiz({ node, questionData: shuffledQuestion });

    }, [clearedQuestions, assignedQuestions, mapNodes]);

    const handleAnswerSelection = useCallback((selectedOption: string) => {
        if (!activeQuiz) return;

        const nodeId = activeQuiz.node.id;

        setAssignedQuestions(prev => {
            const next = { ...prev };
            delete next[nodeId];
            return next;
        });

        if (selectedOption === activeQuiz.questionData.correct_answer) {
            playSound('/secured.mp3');
            setLogMessage(`NŒUD ${nodeId.replace('node-', '')} SÉCURISÉ.`);
            setClearedQuestions(prev => [...prev, activeQuiz.questionData.question]);
            setHealth(prev => {
                const newHealth = prev + 5;
                if (newHealth > 100) {
                    return 100;
                }
                return newHealth;
            });

            // --- MISE À JOUR : On met à jour uniquement l'état, sans effet de bord ---
            setMapNodes(prevMap => {
                return prevMap.map(row =>
                    row.map((n): MapNode => n.id === nodeId ? { ...n, status: 'secure' } : n)
                );
            });
        } else {
            playSound('/error.mp3');
            setLogMessage(`ERREUR. DÉGÂTS SUBIS.`);
            setHealth(prev => {
                const newHealth = prev - 10;
                if (newHealth <= 0) {
                    setIsGameOver(true);
                    return 0;
                }
                return newHealth;
            });
        }

        setActiveQuiz(null);
    }, [activeQuiz]);

    const rebootSystem = useCallback(() => {
        playSound("/abort.mp3");
        setMapNodes(INITIAL_MAP);
        setClearedQuestions([]);
        setAssignedQuestions({});
        setHealth(100);
        setGameComplete(false);
        setIsGameOver(false);
        setElapsedSeconds(0);
        setFinalTime(0);
        setShowBossWarning(false);
        scoreSavedRef.current = false; // --- NOUVEAU : Réinitialiser le verrou ---
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    }, [router]);

    if (isAuthorized === null) {
        return (
            <div className="min-h-screen bg-[#090d18] flex items-center justify-center font-mono p-4">
                <div className="text-cyan-500 animate-pulse tracking-[0.2em] uppercase text-center text-sm sm:text-base">
                    Connexion au réseau en cours...
                </div>
            </div>
        );
    }

    if (isAuthorized === false) return null;

    let healthStateText = "STABLE";
    let healthColor = "#0d7ea0";

    if (health > 70) {
        healthStateText = "STABLE";
        healthColor = "#0d7ea0";
    } else if (health > 30) {
        healthStateText = "ATTENTION";
        healthColor = "#ffb000";
    } else if (health > 0) {
        healthStateText = "DANGER";
        healthColor = "#d9434f";
    } else {
        healthStateText = "DÉCONNECTÉ";
        healthColor = "#d9434f";
    }

    return (
        <>
            <style>{`
                @keyframes warningSlideUpFade {
                    0% { transform: translate(-50%, 20px); opacity: 0; }
                    15% { transform: translate(-50%, 0); opacity: 1; }
                    85% { transform: translate(-50%, 0); opacity: 1; }
                    100% { transform: translate(-50%, -10px); opacity: 0; }
                }
            `}</style>

            <div className={`min-h-screen bg-[#090d18] font-mono m-0 p-3 sm:p-4 lg:p-8 select-none flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-4 lg:gap-6 ${health < 30 && !isGameOver && !gameComplete ? 'screen-glitch' : ''}`}>

                <div className="w-full lg:w-[360px] shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 lg:gap-5">

                    <div className="flex-1 lg:flex-none p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)]">
                        <div className="text-[#0d7ea0] text-[10px] sm:text-sm tracking-[3px] uppercase mb-2 lg:mb-4 text-center">
                            SANTÉ DU SYSTÈME
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mb-2">
                            <div className="text-[#d9434f] shrink-0 w-[36px] sm:w-[50px] flex justify-center">
                                <img src="brain.png" alt="Icône de cerveau" className="max-w-full" />
                            </div>
                            <div className="m-0 p-0 flex-grow min-w-0">
                                <div className="flex items-baseline gap-2 sm:gap-3">
                                    <div
                                        className="text-3xl sm:text-5xl lg:text-[58px] font-bold leading-none transition-colors duration-300"
                                        style={{ color: healthColor }}
                                    >
                                        {health}%
                                    </div>
                                    <div
                                        className="text-xs sm:text-lg tracking-[2px] uppercase transition-colors duration-300 hidden xs:block"
                                        style={{ color: healthColor }}
                                    >
                                        {healthStateText}
                                    </div>
                                </div>
                                <div className="w-full h-2 sm:h-3 bg-[#2a2331] rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] mt-1.5 sm:mt-2">
                                    <div
                                        className="h-full transition-all duration-[350ms] ease-in-out shadow-[0_0_10px_rgba(217,67,79,0.2)]"
                                        style={{ width: `${health}%`, backgroundColor: healthColor }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 lg:flex-none p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)]">
                        <div className="text-[#0d7ea0] text-[10px] sm:text-sm tracking-[2px] sm:tracking-[3px] uppercase mb-2 lg:mb-4 text-center">
                            ÉTAT DU RÉSEAU
                        </div>
                        <div>
                            <div className={`rounded-lg p-2 sm:p-3 text-[10px] sm:text-sm text-center font-bold tracking-wider transition-colors ${activeThreats > 0 ? 'bg-[#ab131332] text-red-500' : 'bg-green-900/30 text-green-400'}`}>
                                {activeThreats > 0 ? `Virus restants : ${activeThreats}` : 'RÉSEAU NETTOYÉ'}
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-1 p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)] flex-col">
                        <div className="text-[#0d7ea0] text-[10px] sm:text-sm tracking-[3px] uppercase text-center mt-2">
                            TERMINAL
                        </div>
                        <div className="bg-[#163849] h-[2px] my-[10px] sm:my-[15px] mx-0" />
                        <div className="text-[#95e6fee4] text-xs sm:text-sm tracking-[1px] uppercase text-center mb-2 leading-relaxed">
                            {logMessage}
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-4xl relative border border-cyan-800 bg-slate-950/80 rounded-lg overflow-hidden flex items-center justify-center p-2 min-h-[320px] sm:min-h-[400px] lg:min-h-full shadow-[0_0_30px_rgba(0,180,255,0.1)]">

                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" style={{ contain: 'strict' }}></div>

                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center z-50 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { playSound("/abort.mp3"); router.push('/') }}
                                className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 border border-red-900/50 hover:border-red-500/80 hover:bg-red-950/50 text-red-500 rounded px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm shadow-[0_0_10px_rgba(220,38,38,0.1)] transition-all pointer-events-auto group"
                                title="Retour à l'accueil"
                            >
                                <Home className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
                                <span className="hidden xs:inline text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">Quitter</span>
                            </button>
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                <span className="text-cyan-600 text-[8px] sm:text-[10px] uppercase tracking-widest">Nœuds</span>
                                <span className="text-cyan-300 font-bold text-xs sm:text-sm">{securedNodes}/{totalNodes}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                            <span className="text-cyan-300 font-bold text-xs sm:text-sm tabular-nums tracking-wider">{formatTime(elapsedSeconds)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center hex-grid-container">
                        {mapNodes.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center hex-row relative z-10" style={{ zIndex: 10 - rowIndex }}>
                                {row.map((node) => (
                                    <HexNode
                                        key={node.id}
                                        node={node}
                                        onClick={handleNodeClick}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {showBossWarning && (
                        <div
                            className="absolute bottom-1/4 left-1/2 z-[200] flex items-center gap-3 px-4 py-3 bg-red-950/95 border border-red-500/80 rounded-md shadow-[0_0_30px_rgba(220,38,38,0.5)] pointer-events-none"
                            style={{ animation: 'warningSlideUpFade 3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                        >
                            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-pulse shrink-0" />
                            <span className="text-red-400 font-bold tracking-widest text-[10px] sm:text-sm uppercase drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">
                                ACCÈS REFUSÉ : DÉTRUISEZ LES VIRUS AUTOUR D'ABORD.
                            </span>
                        </div>
                    )}

                    {activeQuiz && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-2 sm:p-4">
                            <div className="relative w-full max-w-xl border border-cyan-500/70 bg-slate-950/98 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(6,182,212,0.1)] max-h-[90vh] overflow-y-auto"
                                style={{ animation: 'modalSlideIn 0.3s ease-out' }}
                            >
                                <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] opacity-20 z-[5]"></div>

                                <div className="relative bg-gradient-to-r from-cyan-950/80 via-slate-900/80 to-cyan-950/80 border-b border-cyan-500/40 px-3 sm:px-5 py-2 sm:py-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded px-2 sm:px-2.5 py-1">
                                            <TerminalIcon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                                            <span className="text-cyan-300 font-bold tracking-widest text-[10px] sm:text-xs md:text-sm">NŒUD {activeQuiz.node.id.replace('node-', '')}</span>
                                        </div>
                                        <span className={`text-[8px] sm:text-[10px] uppercase tracking-widest font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${activeQuiz.node.difficulty === 'easy'
                                            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                                            : activeQuiz.node.difficulty === 'medium'
                                                ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                                                : 'text-red-400 border-red-500/40 bg-red-500/10'
                                            }`}>
                                            {activeQuiz.node.difficulty === 'easy' ? '● BAS' : activeQuiz.node.difficulty === 'medium' ? '●● MOY' : '●●● HAUT'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('/abort.mp3');
                                            setActiveQuiz(null);
                                        }}
                                        className="text-slate-500 hover:text-red-400 transition-colors text-[10px] sm:text-xs font-bold tracking-wider px-1.5 sm:px-2 py-1 rounded hover:bg-red-500/10 shrink-0"
                                    >
                                        [X]
                                    </button>
                                </div>

                                <div className="p-3 sm:p-5 md:p-10 flex flex-col gap-3 sm:gap-5">
                                    <div className="relative bg-gradient-to-br from-[#0c1425] to-[#0f172a] border border-cyan-800/40 rounded-lg p-3 sm:p-5 md:p-6 shadow-[inset_0_2px_20px_rgba(6,182,212,0.05)]">
                                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 text-cyan-700/50 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-bold">Défi de piratage</div>
                                        <div className="text-cyan-100 text-sm sm:text-base md:text-lg font-semibold leading-relaxed mt-4">
                                            <ChevronRight className="inline text-cyan-500 mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                                            {activeQuiz.questionData.question}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:gap-2.5">
                                        {activeQuiz.questionData.options.map((option: string, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelection(option)}
                                                className="group relative p-2.5 sm:p-4 border border-slate-700/60 bg-slate-900/60 text-slate-300 rounded-lg text-xs sm:text-sm md:text-base text-left transition-all duration-200 hover:translate-x-1.5 hover:border-cyan-500/70 hover:text-cyan-300 hover:bg-cyan-950/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1),inset_0_0_20px_rgba(6,182,212,0.05)] active:scale-[0.99]"
                                            >
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-cyan-400 rounded-full transition-all duration-300 group-hover:h-3/4 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                                                <span className="mr-2 sm:mr-3 font-bold text-cyan-600 group-hover:text-cyan-400 transition-colors text-[10px] sm:text-xs md:text-sm">[{String.fromCharCode(65 + idx)}]</span>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isGameOver && (
                    <div className="fixed inset-0 bg-gradient-to-b from-[#2a0000] to-[#120000] flex flex-col justify-center items-center z-[999] text-[#ff4d4d] text-center font-mono p-4">
                        <div className="w-[80px] sm:w-[120px] mb-5">
                            <img src="cardiogram.png" alt="Encéphalogramme plat" className="max-w-full" />
                        </div>
                        <div className="text-4xl sm:text-6xl tracking-[4px] mb-5 font-bold animate-pulse">
                            Game Over
                        </div>
                        <div className="w-full max-w-[600px] text-[#ffd6d6] text-base sm:text-xl leading-relaxed mb-8 sm:mb-10 px-4">
                            Santé à zéro. Vous avez été éjecté du serveur.
                        </div>
                        <button
                            className="bg-transparent border border-[#ff4d4d] text-[#ff4d4d] px-6 sm:px-[30px] py-3 sm:py-[14px] text-base sm:text-xl cursor-pointer transition-colors hover:bg-[rgba(255,77,77,0.1)] focus:outline-none focus:ring-2 focus:ring-[#ff4d4d]"
                            onClick={() => { playSound("/abort.mp3"); router.push('/') }}
                        >
                            RECOMMENCER
                        </button>
                    </div>
                )}

                {gameComplete && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-md bg-black/80 font-mono p-4">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-gradient-to-r from-cyan-500/10 via-green-500/10 to-cyan-500/10 animate-pulse blur-3xl"></div>
                        </div>
                        <div className="relative border-2 border-green-500/70 bg-slate-950/95 rounded-xl shadow-[0_0_80px_rgba(34,197,94,0.3)] p-6 sm:p-8 md:p-12 max-w-lg w-full mx-4 text-center">
                            <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-30"></div>

                            <div className="flex justify-center mb-4 sm:mb-6">
                                <div className="relative">
                                    <Trophy className="w-14 h-14 sm:w-20 sm:h-20 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                                    <div className="absolute inset-0 animate-ping">
                                        <Trophy className="w-14 h-14 sm:w-20 sm:h-20 text-green-400 opacity-20" />
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 mb-2">
                                RÉSEAU SÉCURISÉ
                            </h2>
                            <p className="text-green-500/80 text-xs sm:text-sm mb-6 sm:mb-8 tracking-widest uppercase">
                                Tous les virus ont été éliminés
                            </p>

                            <div className="bg-slate-900/80 border border-green-800/50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                    <span className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Nom d'utilisateur</span>
                                    <span className="text-cyan-300 font-bold text-sm sm:text-base">{username}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Temps</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                                        <span className="text-cyan-300 font-bold text-base sm:text-lg tabular-nums">{formatTime(finalTime)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={rebootSystem}
                                    className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-green-950/50 border border-green-500 text-green-400 hover:bg-green-900/50 hover:text-green-200 transition-all uppercase tracking-widest text-xs sm:text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Rejouer
                                </button>
                                <button
                                    onClick={() => { playSound("/abort.mp3"); router.push('/'); }}
                                    className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200 transition-all uppercase tracking-widest text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded"
                                >
                                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Menu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}