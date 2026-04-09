import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Lock, Terminal as TerminalIcon, ChevronRight, Clock, Trophy, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export default function HexGrid() {
    const router = useRouter();
    const [mapNodes, setMapNodes] = useState<HexMap>(INITIAL_MAP);
    const [activeQuiz, setActiveQuiz] = useState<{ node: MapNode, questionData: any } | null>(null);
    const [clearedQuestions, setClearedQuestions] = useState<string[]>([]);

    // Timer state
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [finalTime, setFinalTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Start timer on mount
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Check for win condition
    const checkWinCondition = useCallback((map: HexMap) => {
        const allSecure = map.flat().every(node => node.status === 'secure');
        if (allSecure) {
            setFinalTime(elapsedSeconds);
            setGameComplete(true);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [elapsedSeconds]);

    const handleNodeClick = (node: MapNode): void => {
        if (node.status === 'secure') {
            console.log(`Node ${node.id} is secure. No action required.`);
            return;
        }

        if (node.isBoss) {
            const virusCount = mapNodes.flat().filter(n => n.status === 'virus' && !n.isBoss).length;
            if (virusCount !== 0) {
                console.log(`ACCESS DENIED. Core Node is heavily shielded. Clear surrounding threats first.`);
                return;
            }
        }

        const questions = node.difficulty === 'easy' ? EASY_QUESTIONS : node.difficulty === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS;

        // Filter out questions that are already in the clearedQuestions array
        let availableQuestions = questions.filter(q => !clearedQuestions.includes(q.question));

        // If they play so much they run out of questions, reset the pool to prevent a crash
        if (availableQuestions.length === 0) {
            availableQuestions = questions;
        }

        // Pick a random question from the remaining available ones
        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        setActiveQuiz({ node, questionData: randomQuestion });
    };

    const handleAnswerSelection = (selectedOption: string) => {
        if (!activeQuiz) return;

        if (selectedOption === activeQuiz.questionData.correct_answer) {

            // Add the question to the cleared list so it doesn't appear again
            setClearedQuestions(prev => [...prev, activeQuiz.questionData.question]);
            console.log(clearedQuestions);

            setMapNodes(prevMap => {
                const newMap = prevMap.map(row =>
                    row.map((n): MapNode => n.id === activeQuiz.node.id ? { ...n, status: 'secure' } : n)
                );
                // Check win after updating
                checkWinCondition(newMap);
                return newMap;
            });
        } else {
            console.log("Incorrect answer. Node remains infected.");
        }

        setActiveQuiz(null);
    };

    const handlePlayAgain = () => {
        setMapNodes(INITIAL_MAP);
        setClearedQuestions([]);
        setGameComplete(false);
        setElapsedSeconds(0);
        setFinalTime(0);
        timerRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    };

    const username = typeof window !== 'undefined' ? localStorage.getItem('neural_heist_user') || 'OPERATIVE' : 'OPERATIVE';

    // Calculate progress
    const totalNodes = mapNodes.flat().length;
    const securedNodes = mapNodes.flat().filter(n => n.status === 'secure').length;

    return (
        <div className="flex-1 relative border border-cyan-800 bg-slate-950/80 rounded overflow-hidden flex items-center justify-center p-2 min-h-[500px] font-mono">

            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Timer & Progress HUD */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-cyan-600 text-[10px] uppercase tracking-widest">Nodes</span>
                    <span className="text-cyan-300 font-bold text-sm">{securedNodes}/{totalNodes}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-800/50 rounded px-3 py-1.5 backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span className="text-cyan-300 font-bold text-sm tabular-nums tracking-wider">{formatTime(elapsedSeconds)}</span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
                {mapNodes.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center -mb-5 md:-mb-7 relative z-10" style={{ zIndex: 10 - rowIndex }}>
                        {row.map((node) => {
                            const isVirus = node.status === 'virus';
                            const isBoss = node.isBoss;

                            // Determine colors based on difficulty
                            let bgColor = '#10a62bff';
                            let shadowColor = 'rgba(40, 174, 65, 0.5)';
                            let iconColorClass = 'text-cyan-600';
                            let textColorClass = 'text-cyan-600';
                            let label = 'SECURE';
                            if (isVirus) {
                                label = isBoss ? 'CORE' : 'VIRUS';

                                if (node.difficulty === 'easy') {
                                    bgColor = '#891919ff'; // Tailwind red-950: Very dark, almost black-red (low threat)
                                    shadowColor = 'rgba(248, 113, 113, 0.15)'; // Faint, subtle glow
                                    iconColorClass = 'text-red-400 opacity-50';
                                    textColorClass = 'text-red-400 opacity-80';

                                } else if (node.difficulty === 'medium') {
                                    bgColor = '#7f1d1d'; // Tailwind red-900: Standard dark red (moderate threat)
                                    shadowColor = 'rgba(239, 68, 68, 0.5)'; // Medium red glow
                                    iconColorClass = 'text-red-400';
                                    textColorClass = 'text-red-300';

                                } else if (node.difficulty === 'hard') {
                                    bgColor = '#991b1b'; // Tailwind red-800: Brighter, aggressive red base (high threat)
                                    shadowColor = 'rgba(220, 38, 38, 0.9)'; // Intense, harsh red glow
                                    iconColorClass = 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
                                    textColorClass = 'text-red-200 font-bold';
                                }
                            }

                            return (
                                <div
                                    key={node.id}
                                    onClick={() => handleNodeClick(node)}
                                    className={`
                                        relative w-16 h-20 md:w-24 md:h-28 mx-1 md:mx-2 cursor-pointer transition-all duration-300 hover:scale-105 group
                                        flex items-center justify-center text-center
                                    `}
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
                                        <div className="flex flex-col items-center justify-center opacity-80 group-hover:opacity-100">
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
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* Quiz Modal */}
            {activeQuiz && (
                <div className="absolute inset-4 md:inset-8 border-2 border-cyan-500 bg-slate-950/95 z-[100] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-md rounded-lg overflow-hidden">

                    <div className="bg-cyan-900/50 border-b border-cyan-500 p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="w-5 h-5 text-cyan-400" />
                            <span className="text-cyan-300 font-bold tracking-widest text-sm md:text-base">NODE {activeQuiz.node.id.replace('node-', '')}</span>
                        </div>
                        <button
                            onClick={() => setActiveQuiz(null)}
                            className="text-cyan-500 hover:text-cyan-300 font-bold px-2"
                        >
                            [X] ABORT
                        </button>
                    </div>

                    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">

                        <div className="bg-[#0f172a] border border-cyan-800/50 rounded p-6 relative shadow-inner">
                            <div className="text-cyan-100 text-lg md:text-xl font-bold">
                                <ChevronRight className="inline text-purple-500 mr-2" />
                                {activeQuiz.questionData.question}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                            {activeQuiz.questionData.options.map((option: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerSelection(option)}
                                    className="p-4 border border-slate-600 bg-slate-800 text-slate-300 rounded text-sm md:text-base text-left transition-all hover:translate-x-2 hover:border-cyan-500 hover:text-cyan-400 hover:bg-slate-800/80"
                                >
                                    <span className="mr-3 font-bold text-cyan-700">[{String.fromCharCode(65 + idx)}]</span>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Success / Victory Screen */}
            {gameComplete && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center backdrop-blur-md bg-black/80">

                    {/* Animated background glow */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/10 via-green-500/10 to-cyan-500/10 animate-pulse blur-3xl"></div>
                    </div>

                    <div className="relative border-2 border-green-500/70 bg-slate-950/95 rounded-xl shadow-[0_0_80px_rgba(34,197,94,0.3)] p-8 md:p-12 max-w-lg w-full mx-4 text-center">

                        {/* Scan lines overlay */}
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-30"></div>

                        {/* Trophy icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Trophy className="w-20 h-20 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                                <div className="absolute inset-0 animate-ping">
                                    <Trophy className="w-20 h-20 text-green-400 opacity-20" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 mb-2">
                            NETWORK SECURED
                        </h2>
                        <p className="text-green-500/80 text-sm mb-8 tracking-widest uppercase">
                            All threats eliminated
                        </p>

                        {/* Stats card */}
                        <div className="bg-slate-900/80 border border-green-800/50 rounded-lg p-6 mb-8 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">Operative</span>
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

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handlePlayAgain}
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