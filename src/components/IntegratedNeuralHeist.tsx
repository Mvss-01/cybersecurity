"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Lock, Terminal as TerminalIcon, ChevronRight, Clock, Trophy, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Ensure these point to your actual JSON data paths
import EASY_QUESTIONS from '../data/easy.json';
import MEDIUM_QUESTIONS from '../data/medium.json';
import HARD_QUESTIONS from '../data/hard.json';

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

export default function IntegratedNeuralHeist() {
    const router = useRouter();

    // --- Dashboard State ---
    const [health, setHealth] = useState<number>(100);
    const [nodeName, setNodeName] = useState<string>("NODE 01-B [MAINFRAME]");
    const [logMessage, setLogMessage] = useState<string>("Awaiting Node Selection...");
    const [isGameOver, setIsGameOver] = useState<boolean>(false);

    // --- Grid & Game State ---
    const [mapNodes, setMapNodes] = useState<HexMap>(INITIAL_MAP);
    const [activeQuiz, setActiveQuiz] = useState<{ node: MapNode, questionData: any } | null>(null);
    const [clearedQuestions, setClearedQuestions] = useState<string[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [finalTime, setFinalTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Derived state
    const totalNodes = mapNodes.flat().length;
    const securedNodes = mapNodes.flat().filter(n => n.status === 'secure').length;
    const activeThreats = mapNodes.flat().filter(n => n.status === 'virus').length;

    // --- Effects ---

    // Main game timer
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

    // Automatic health drain
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
        }, 1500); // Slightly slower drain so it's playable with quizzes

        return () => clearInterval(healthDrainTimer);
    }, [isGameOver, gameComplete]);

    // Check for win condition
    const checkWinCondition = useCallback((map: HexMap) => {
        const allSecure = map.flat().every(node => node.status === 'secure');
        if (allSecure) {
            setFinalTime(elapsedSeconds);
            setGameComplete(true);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [elapsedSeconds]);

    // --- Handlers ---

    const handleNodeClick = (node: MapNode): void => {
        if (node.status === 'secure') {
            setLogMessage(`NODE ${node.id.replace('node-', '')} ALREADY SECURE.`);
            return;
        }

        if (node.isBoss) {
            const virusCount = mapNodes.flat().filter(n => n.status === 'virus' && !n.isBoss).length;
            if (virusCount !== 0) {
                setLogMessage("ACCESS DENIED: CLEAR SURROUNDING THREATS FIRST.");
                return;
            }
        }

        setNodeName(`TARGETING: ${node.id.toUpperCase()}`);
        setLogMessage("DECRYPTING CHALLENGE DATA...");

        const questions = node.difficulty === 'easy' ? EASY_QUESTIONS : node.difficulty === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS;

        let availableQuestions = questions.filter(q => !clearedQuestions.includes(q.question));
        if (availableQuestions.length === 0) {
            availableQuestions = questions;
        }

        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        setActiveQuiz({ node, questionData: randomQuestion });
    };

    const handleAnswerSelection = (selectedOption: string) => {
        if (!activeQuiz) return;

        if (selectedOption === activeQuiz.questionData.correct_answer) {
            setLogMessage(`NODE ${activeQuiz.node.id.replace('node-', '')} SECURED SUCCESSFULLY.`);
            setClearedQuestions(prev => [...prev, activeQuiz.questionData.question]);
            setHealth(prev => {
                const newHealth = prev + 5;
                if (newHealth > 100) {
                    return 100;
                }
                return newHealth;
            })

            setMapNodes(prevMap => {
                const newMap = prevMap.map(row =>
                    row.map((n): MapNode => n.id === activeQuiz.node.id ? { ...n, status: 'secure' } : n)
                );
                checkWinCondition(newMap);
                return newMap;
            });
        } else {
            setLogMessage(`INCORRECT OVERRIDE. INTEGRITY COMPROMISED.`);
            // Deduct health penalty for wrong answer
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
    };

    const rebootSystem = () => {
        setMapNodes(INITIAL_MAP);
        setClearedQuestions([]);
        setHealth(100);
        setNodeName("NODE 01-B [MAINFRAME]");
        setLogMessage("SYSTEM REBOOTED. AWAITING INPUT...");
        setGameComplete(false);
        setIsGameOver(false);
        setElapsedSeconds(0);
        setFinalTime(0);
        router.push("/");
    };

    const username = typeof window !== 'undefined' ? localStorage.getItem('neural_heist_user') || 'OPERATIVE' : 'OPERATIVE';

    // --- UI Colors ---
    let healthStateText = "STABLE";
    let healthColor = "#29d36a";

    if (health > 70) {
        healthStateText = "STABLE";
        healthColor = "#29d36a";
    } else if (health > 30) {
        healthStateText = "WARNING";
        healthColor = "#ffb000";
    } else if (health > 0) {
        healthStateText = "CRITICAL";
        healthColor = "#d9434f";
    } else {
        healthStateText = "FLATLINE";
        healthColor = "#d9434f";
    }

    return (
        <div className="min-h-screen bg-[#090d18] font-mono m-0 p-4 lg:p-8 select-none flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6">

            {/* LEFT PANEL: NEURAL LINK DASHBOARD */}
            <div className="w-[360px] shrink-0 flex flex-col gap-5">

                {/* Panel 1: Integrity */}
                <div className="p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)]">
                    <div className="text-[#0d7ea0] text-sm tracking-[3px] uppercase mb-4 text-center">
                        NEURAL LINK INTEGRITY
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="text-[46px] text-[#d9434f] shrink-0 w-[50px] flex justify-center">
                            <img src="brain.png" alt="Brain Icon" className="max-w-full" />
                        </div>
                        <div className="m-0 p-0 flex-grow">
                            <div className="flex items-baseline gap-3">
                                <div
                                    className="text-[58px] font-bold leading-none transition-colors duration-300"
                                    style={{ color: healthColor }}
                                >
                                    {health}%
                                </div>
                                <div
                                    className="text-lg tracking-[2px] uppercase transition-colors duration-300"
                                    style={{ color: healthColor }}
                                >
                                    {healthStateText}
                                </div>
                            </div>
                            <div className="w-full h-3 bg-[#2a2331] rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] mt-2">
                                <div
                                    className="h-full transition-all duration-[350ms] ease-in-out shadow-[0_0_10px_rgba(217,67,79,0.2)]"
                                    style={{ width: `${health}%`, backgroundColor: healthColor }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Server Architecture Status */}
                <div className="p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)]">
                    <div className="text-[#0d7ea0] text-sm tracking-[3px] uppercase mb-4 text-center">
                        SERVER ARCHITECTURE
                    </div>
                    <div className="text-[#95e6fee4] text-lg font-bold tracking-[3px] uppercase mb-4 text-center">
                        {nodeName}
                    </div>
                    <div>
                        <div className={`rounded-lg p-3 text-sm text-center font-bold tracking-wider transition-colors ${activeThreats > 0 ? 'bg-[#ab131332] text-red-500' : 'bg-green-900/30 text-green-400'}`}>
                            {activeThreats > 0 ? `HOSTILE CODE DETECTED: ${activeThreats} ACTIVE THREATS` : 'ALL THREATS ELIMINATED'}
                        </div>
                    </div>
                </div>

                {/* Panel 3: Challenge Log */}
                <div className="flex-1 p-3 pb-4 bg-gradient-to-b from-[#11101a] to-[#120d18] border border-[rgba(0,180,255,0.18)] rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,0,80,0.05),0_0_18px_rgba(0,180,255,0.06)]">
                    <div className="text-[#0d7ea0] text-sm tracking-[3px] uppercase text-center mt-2">
                        SYSTEM LOG
                    </div>
                    <div className="bg-[#163849] h-[2px] my-[15px] mx-0" />
                    <div className="text-[#95e6fee4] text-sm tracking-[1px] uppercase text-center mb-2 leading-relaxed">
                        {logMessage}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: HEX GRID SERVER MAP */}
            <div className="flex-1 w-full max-w-4xl relative border border-cyan-800 bg-slate-950/80 rounded-lg overflow-hidden flex items-center justify-center p-2 min-h-[500px] lg:min-h-full shadow-[0_0_30px_rgba(0,180,255,0.1)]">

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                {/* Timer HUD */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50 pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-3 py-1.5 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <span className="text-cyan-600 text-[10px] uppercase tracking-widest">Nodes</span>
                        <span className="text-cyan-300 font-bold text-sm">{securedNodes}/{totalNodes}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-3 py-1.5 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <Clock className="w-4 h-4 text-cyan-500" />
                        <span className="text-cyan-300 font-bold text-sm tabular-nums tracking-wider">{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>

                {/* Hex Map */}
                <div className="flex flex-col items-center justify-center scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
                    {mapNodes.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center -mb-5 md:-mb-7 relative z-10" style={{ zIndex: 10 - rowIndex }}>
                            {row.map((node) => {
                                const isVirus = node.status === 'virus';
                                const isBoss = node.isBoss;

                                let bgColor = '#10a62bff';
                                let shadowColor = 'rgba(40, 174, 65, 0.5)';
                                let iconColorClass = 'text-cyan-600';
                                let textColorClass = 'text-cyan-600';
                                let label = 'SECURE';

                                if (isVirus) {
                                    label = isBoss ? 'CORE' : 'VIRUS';

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
                                        key={node.id}
                                        onClick={() => handleNodeClick(node)}
                                        className="relative w-16 h-20 md:w-24 md:h-28 mx-1 md:mx-2 cursor-pointer transition-all duration-300 hover:scale-105 group flex items-center justify-center text-center"
                                        style={{
                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                            backgroundColor: bgColor,
                                            boxShadow: `inset 0 0 20px ${shadowColor}`
                                        }}
                                    >
                                        <div
                                            className="absolute inset-[2px] md:inset-[3px] flex flex-col items-center justify-center z-10"
                                            style={{
                                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                backgroundColor: '#020617',
                                            }}
                                        >
                                            <div className="flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                                {isVirus ? (
                                                    <>
                                                        <ShieldAlert className={`w-6 h-6 md:w-8 md:h-8 mb-1 ${iconColorClass}`} />
                                                        <span className={`text-[10px] md:text-xs font-bold ${textColorClass}`}>{label}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-6 h-6 md:w-8 md:h-8 text-green-600 mb-1" />
                                                        <span className="text-[10px] md:text-xs font-bold text-green-600">SECURE</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* MODAL: Active Quiz */}
                {activeQuiz && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
                        <div className="relative w-full max-w-xl border border-cyan-500/70 bg-slate-950/98 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(6,182,212,0.1)]"
                            style={{ animation: 'modalSlideIn 0.3s ease-out' }}
                        >
                            <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] opacity-20 z-[5]"></div>

                            <div className="relative bg-gradient-to-r from-cyan-950/80 via-slate-900/80 to-cyan-950/80 border-b border-cyan-500/40 px-5 py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded px-2.5 py-1">
                                        <TerminalIcon className="w-4 h-4 text-cyan-400" />
                                        <span className="text-cyan-300 font-bold tracking-widest text-xs md:text-sm">NODE {activeQuiz.node.id.replace('node-', '')}</span>
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${activeQuiz.node.difficulty === 'easy'
                                        ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                                        : activeQuiz.node.difficulty === 'medium'
                                            ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                                            : 'text-red-400 border-red-500/40 bg-red-500/10'
                                        }`}>
                                        {activeQuiz.node.difficulty === 'easy' ? '● LOW THREAT' : activeQuiz.node.difficulty === 'medium' ? '●● MED THREAT' : '●●● HIGH THREAT'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveQuiz(null)}
                                    className="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold tracking-wider px-2 py-1 rounded hover:bg-red-500/10"
                                >
                                    [X] ABORT
                                </button>
                            </div>

                            <div className="p-5 md:p-8 flex flex-col gap-5">
                                <div className="relative bg-gradient-to-br from-[#0c1425] to-[#0f172a] border border-cyan-800/40 rounded-lg p-5 md:p-6 shadow-[inset_0_2px_20px_rgba(6,182,212,0.05)]">
                                    <div className="absolute top-3 left-3 text-cyan-700/50 text-[10px] uppercase tracking-[0.2em] font-bold">Decrypt Query</div>
                                    <div className="text-cyan-100 text-base md:text-lg font-semibold leading-relaxed mt-4">
                                        <ChevronRight className="inline text-cyan-500 mr-2 w-5 h-5" />
                                        {activeQuiz.questionData.question}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    {activeQuiz.questionData.options.map((option: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSelection(option)}
                                            className="group relative p-4 border border-slate-700/60 bg-slate-900/60 text-slate-300 rounded-lg text-sm md:text-base text-left transition-all duration-200 hover:translate-x-1.5 hover:border-cyan-500/70 hover:text-cyan-300 hover:bg-cyan-950/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1),inset_0_0_20px_rgba(6,182,212,0.05)] active:scale-[0.99]"
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-cyan-400 rounded-full transition-all duration-300 group-hover:h-3/4 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                                            <span className="mr-3 font-bold text-cyan-600 group-hover:text-cyan-400 transition-colors text-xs md:text-sm">[{String.fromCharCode(65 + idx)}]</span>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* OVERLAY: GAME OVER / FLATLINE */}
            {isGameOver && (
                <div className="fixed inset-0 bg-gradient-to-b from-[#2a0000] to-[#120000] flex flex-col justify-center items-center z-[999] text-[#ff4d4d] text-center font-mono">
                    <div className="w-[120px] mb-5">
                        <img src="cardiogram.png" alt="Cardiogram Flatline" className="max-w-full" />
                    </div>
                    <div className="text-6xl tracking-[4px] mb-5 font-bold animate-pulse">
                        FLATLINE
                    </div>
                    <div className="w-4/5 md:w-1/2 max-w-[600px] text-[#ffd6d6] text-xl leading-relaxed mb-10">
                        Neural integrity depleted. Your consciousness has been permanently fragmented on the server.
                    </div>
                    <button
                        className="bg-transparent border border-[#ff4d4d] text-[#ff4d4d] px-[30px] py-[14px] text-xl cursor-pointer transition-colors hover:bg-[rgba(255,77,77,0.1)] focus:outline-none focus:ring-2 focus:ring-[#ff4d4d]"
                        onClick={rebootSystem}
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            )}

            {/* OVERLAY: WIN SCREEN */}
            {gameComplete && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-md bg-black/80 font-mono">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/10 via-green-500/10 to-cyan-500/10 animate-pulse blur-3xl"></div>
                    </div>
                    <div className="relative border-2 border-green-500/70 bg-slate-950/95 rounded-xl shadow-[0_0_80px_rgba(34,197,94,0.3)] p-8 md:p-12 max-w-lg w-full mx-4 text-center">
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-30"></div>

                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Trophy className="w-20 h-20 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                                <div className="absolute inset-0 animate-ping">
                                    <Trophy className="w-20 h-20 text-green-400 opacity-20" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 mb-2">
                            NETWORK SECURED
                        </h2>
                        <p className="text-green-500/80 text-sm mb-8 tracking-widest uppercase">
                            All threats eliminated
                        </p>

                        <div className="bg-slate-900/80 border border-green-800/50 rounded-lg p-6 mb-8 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Username</span>
                                <span className="text-cyan-300 font-bold">{username}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Nodes Secured</span>
                                <span className="text-green-400 font-bold">{totalNodes}/{totalNodes}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Time Elapsed</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-cyan-500" />
                                    <span className="text-cyan-300 font-bold text-lg tabular-nums">{formatTime(finalTime)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={rebootSystem}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-950/50 border border-green-500 text-green-400 hover:bg-green-900/50 hover:text-green-200 transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Play Again
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200 transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded"
                            >
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}