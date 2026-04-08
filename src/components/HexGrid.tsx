import React, { useState } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

type NodeStatus = 'secure' | 'virus';

interface MapNode {
    id: string;
    status: NodeStatus;
    isBoss?: boolean;
}

type HexMap = MapNode[][];

const INITIAL_MAP: HexMap = [
    [{ id: 'node-0', status: 'secure' }, { id: 'node-1', status: 'virus' }, { id: 'node-2', status: 'secure' }],
    [{ id: 'node-3', status: 'virus' }, { id: 'node-4', status: 'virus' }, { id: 'node-5', status: 'secure' }, { id: 'node-6', status: 'virus' }],
    [{ id: 'node-7', status: 'secure' }, { id: 'node-8', status: 'secure' }, { id: 'node-9', status: 'virus', isBoss: true }, { id: 'node-10', status: 'virus' }, { id: 'node-11', status: 'secure' }],
    [{ id: 'node-12', status: 'secure' }, { id: 'node-13', status: 'virus' }, { id: 'node-14', status: 'secure' }, { id: 'node-15', status: 'virus' }],
    [{ id: 'node-16', status: 'virus' }, { id: 'node-17', status: 'secure' }, { id: 'node-18', status: 'virus' }]
];

export default function HexGrid() {
    const [mapNodes, setMapNodes] = useState<HexMap>(INITIAL_MAP);

    const handleNodeClick = (node: MapNode): void => {
        if (node.status === 'secure') {
            console.log(`Node ${node.id} is secure. No action required.`);
            return;
        }

        if (node.isBoss) {
            const virusCount = mapNodes.flat().filter(n => n.status === 'virus' && !n.isBoss).length;
            if (virusCount > 2) {
                console.log(`ACCESS DENIED. Core Node is heavily shielded. Clear surrounding threats first.`);
                return;
            }
        }

        setMapNodes(prevMap => {
            const newMap = prevMap.map(row =>
                row.map((n): MapNode => n.id === node.id ? { ...n, status: 'secure' } : n)
            );
            return newMap;
        });
    };

    return (
        <div className="flex-1 relative border border-cyan-800 bg-slate-950/80 rounded overflow-hidden flex items-center justify-center p-2 min-h-[500px]">

            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <div className="flex flex-col items-center justify-center scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
                {mapNodes.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center -mb-5 md:-mb-7 relative z-10" style={{ zIndex: 10 - rowIndex }}>
                        {row.map((node) => {
                            const isVirus = node.status === 'virus';
                            const isBoss = node.isBoss;

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
                                        backgroundColor: isVirus ? (isBoss ? '#450a0a' : '#7f1d1d') : '#083344',
                                        boxShadow: isVirus ? 'inset 0 0 20px rgba(220, 38, 38, 0.5)' : 'inset 0 0 20px rgba(6, 182, 212, 0.5)'
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
                                                    <ShieldAlert className={`w-6 h-6 md:w-8 md:h-8 mb-1 ${isBoss ? 'text-purple-500 animate-pulse' : 'text-red-500'}`} />
                                                    <span className={`text-[10px] md:text-xs font-bold ${isBoss ? 'text-purple-400' : 'text-red-400'}`}>{isBoss ? 'CORE' : 'VIRUS'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-6 h-6 md:w-8 md:h-8 text-cyan-600 mb-1" />
                                                    <span className="text-[10px] md:text-xs font-bold text-cyan-600">SECURE</span>
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
        </div>
    );
}