"use client"
import React, { useState, useEffect, useMemo, FC } from 'react';
import {
    Trophy,
    Timer,
    Search,
    Users,
    TrendingUp,
    Clock,
    ArrowDown,
    ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// --- Types & Interfaces ---
interface UserData {
    id: number | string;
    username: string;
    time: number;
    avatar: string;
    change: 'up' | 'down' | 'same';
    rank?: number;
}

type TabType = 'all-time' | 'weekly' | 'today';

const App: FC = () => {
    const router = useRouter();
    const [data, setData] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeTab, setActiveTab] = useState<TabType>("all-time");

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const { data: scoresData, error } = await supabase
                    .from('scores')
                    .select('username, time');

                if (error) throw error;

                if (scoresData) {
                    const formattedData: UserData[] = scoresData.map((score, index) => ({
                        id: index,
                        username: score.username,
                        time: score.time,
                        avatar: score.username.charAt(0).toUpperCase(),
                        change: 'same'
                    }));
                    setData(formattedData);
                }
            } catch (error) {
                console.error("Error fetching scores:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScores();
    }, []);

    /**
     * Format seconds to MM:SS.ms
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(5, '0')}`;
    };

    /**
     * Derived state for sorting and filtering
     */
    const sortedData = useMemo(() => {
        return [...data]
            .sort((a, b) => a.time - b.time)
            .map((user, index) => ({ ...user, rank: index + 1 }));
    }, [data]);

    const filteredData = useMemo(() => {
        return sortedData.filter((user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sortedData, searchQuery]);

    const topThree = sortedData.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Back Button */}
            <div className="fixed top-4 left-4 md:top-8 md:left-8 z-50">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-blue-500/50 transition-all backdrop-blur-md shadow-lg group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Menu</span>
                </button>
            </div>

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-blue-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                        Top Performers
                    </h1>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-row items-end justify-center gap-2 sm:gap-4 md:gap-6 mb-16 md:mb-20 px-2 md:px-4">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <div className="order-1 flex-1 w-1/3 md:w-auto">
                                    <div className="relative flex flex-col items-center p-3 sm:p-4 md:p-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl md:rounded-3xl backdrop-blur-md transform transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(148,163,184,0.15)] hover:border-slate-500/50">
                                        <div className="absolute -top-3 sm:-top-4 md:-top-5 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm md:text-xl shadow-lg shadow-slate-400/20 border-2 border-slate-900">
                                            2
                                        </div>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-slate-800 flex items-center justify-center text-lg md:text-2xl font-bold mb-2 md:mb-4 border-2 md:border-[3px] border-slate-400/50 shadow-inner mt-2">
                                            {topThree[1].avatar}
                                        </div>
                                        <h3 className="font-bold text-xs sm:text-sm md:text-lg text-slate-200 truncate w-full text-center">{topThree[1].username}</h3>
                                        <div className="flex items-center justify-center gap-1 md:gap-1.5 text-slate-400 font-mono text-[9px] sm:text-xs md:text-sm mt-1 md:mt-2 bg-slate-950/50 px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg w-full">
                                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 hidden sm:block" /> {formatTime(topThree[1].time)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <div className="order-2 flex-1 w-1/3 md:w-auto scale-105 md:scale-110 z-10">
                                    <div className="relative flex flex-col items-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-blue-900/40 to-slate-900/60 border border-blue-500/30 rounded-2xl md:rounded-[2rem] backdrop-blur-lg transform transition-all duration-300 hover:-translate-y-2 md:hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] hover:border-blue-400/50">
                                        <div className="absolute -top-4 sm:-top-5 md:-top-6 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-b from-yellow-300 to-yellow-600 text-slate-900 rounded-full flex items-center justify-center font-bold shadow-xl shadow-yellow-500/30 border-2 md:border-4 border-slate-900">
                                            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-950" />
                                        </div>
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-slate-800 flex items-center justify-center text-xl md:text-3xl font-black mb-2 md:mb-4 border-2 md:border-4 border-yellow-400/80 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] mt-2">
                                            <span className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                                                {topThree[0].avatar}
                                            </span>
                                        </div>
                                        <h3 className="font-extrabold text-sm sm:text-base md:text-2xl text-white mb-1 truncate w-full text-center">{topThree[0].username}</h3>
                                        <div className="flex items-center justify-center gap-1 md:gap-2 text-yellow-400 font-mono text-[10px] sm:text-sm md:text-lg mt-1 md:mt-2 font-bold bg-yellow-400/10 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg md:rounded-xl border border-yellow-400/20 w-full">
                                            <Timer className="w-3 h-3 md:w-4 md:h-4 sm:block" /> {formatTime(topThree[0].time)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <div className="order-3 flex-1 w-1/3 md:w-auto">
                                    <div className="relative flex flex-col items-center p-3 sm:p-4 md:p-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl md:rounded-3xl backdrop-blur-md transform transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(180,83,9,0.15)] hover:border-amber-700/50">
                                        <div className="absolute -top-3 sm:-top-4 md:-top-5 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-b from-amber-600 to-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-xl shadow-lg shadow-amber-900/20 border-2 border-slate-900">
                                            3
                                        </div>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-slate-800 flex items-center justify-center text-lg md:text-2xl font-bold mb-2 md:mb-4 border-2 md:border-[3px] border-amber-700/50 shadow-inner mt-2">
                                            {topThree[2].avatar}
                                        </div>
                                        <h3 className="font-bold text-xs sm:text-sm md:text-lg text-slate-200 truncate w-full text-center">{topThree[2].username}</h3>
                                        <div className="flex items-center justify-center gap-1 md:gap-1.5 text-slate-400 font-mono text-[9px] sm:text-xs md:text-sm mt-1 md:mt-2 bg-slate-950/50 px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg w-full">
                                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 hidden sm:block" /> {formatTime(topThree[2].time)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                            <div className="relative w-full md:w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search challengers..."
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-800/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-md placeholder:text-slate-500 shadow-lg text-slate-200"
                                />
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                            <div className="grid grid-cols-12 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800/80 bg-slate-900/60">
                                <div className="col-span-2 md:col-span-1">Rank</div>
                                <div className="col-span-6 md:col-span-7">Challenger</div>
                                <div className="col-span-4 text-right">Best Time</div>
                            </div>

                            <div className="max-h-[420px] overflow-y-auto pr-1 divide-y divide-slate-800/40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                                {filteredData.length > 0 ? (
                                    filteredData.map((user, index) => (
                                        <div
                                            key={user.id}
                                            className="grid grid-cols-12 px-8 py-4 items-center hover:bg-slate-800/40 transition-colors duration-200 group cursor-default"
                                        >
                                            <div className="col-span-2 md:col-span-1 text-slate-500 font-mono font-bold text-lg">
                                                #{user.rank}
                                            </div>
                                            <div className="col-span-6 md:col-span-7 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-700 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300">
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-200 text-base mb-0.5 group-hover:text-blue-400 transition-colors">
                                                        {user.username}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-right">
                                                <div className="font-mono text-blue-400 font-bold text-lg bg-blue-950/30 inline-block px-3 py-1 rounded-lg border border-blue-900/30">
                                                    {formatTime(user.time)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 text-center text-slate-500 flex flex-col items-center">
                                        <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                                            <Users className="opacity-40" size={48} />
                                        </div>
                                        <p className="text-lg font-medium">No challengers found matching your search.</p>
                                        <p className="text-sm mt-2 opacity-60">Try adjusting your filters or search term.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <footer className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 px-6 py-8 border-t border-slate-800/60 bg-slate-900/20 rounded-[2rem] backdrop-blur-sm">
                    <div className="flex items-center gap-12">
                        <div className="text-center md:text-left">
                            <div className="text-3xl font-black text-white tracking-tight mb-1">{data.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                Total Players
                            </div>
                        </div>
                        <div className="w-px h-12 bg-slate-800 hidden md:block"></div>
                        <div className="text-center md:text-left">
                            <div className="text-3xl font-black text-white tracking-tight mb-1">
                                {data.length > 0 ? (data.reduce((acc, curr) => acc + curr.time, 0) / data.length).toFixed(1) : 0}s
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                Avg. Speed
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;