import React, { useState } from 'react';
import { ShieldAlert, Lock, Terminal as TerminalIcon, ChevronRight } from 'lucide-react';
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

export default function HexGrid() {
    const [mapNodes, setMapNodes] = useState<HexMap>(INITIAL_MAP);
    const [activeQuiz, setActiveQuiz] = useState<{ node: MapNode, questionData: any } | null>(null);

    const [clearedQuestions, setClearedQuestions] = useState<string[]>([]);

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
                return newMap;
            });
        } else {
            console.log("Incorrect answer. Node remains infected.");
        }

        setActiveQuiz(null);
    };

    return (
        <div className="flex-1 relative border border-cyan-800 bg-slate-950/80 rounded overflow-hidden flex items-center justify-center p-2 min-h-[500px] font-mono">

            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

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
        </div>
    );
}