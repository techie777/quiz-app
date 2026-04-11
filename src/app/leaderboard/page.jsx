"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Search, TrendingUp, Zap, Brain, BookOpen } from 'lucide-react';

export default function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch('/api/leaderboard');
                const data = await res.json();
                if (data.leaderboard) {
                    setUsers(data.leaderboard);
                }
            } catch (error) {
                console.error("Failed to load leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const topThree = users.slice(0, 3);
    const theRest = filteredUsers.slice(3);

    return (
        <main className="min-h-screen bg-slate-50 py-16 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                    >
                        <Trophy size={14} /> Global Intelligence Ranking
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">The World's <span className="text-indigo-600">Smartest</span> Players</h1>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                        Ranked by cumulative Intelligence Score: Quiz Points + Facts Discovered + Challenges Conquered.
                    </p>
                </div>

                {/* Top 3 Podiums */}
                {!loading && users.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
                        {/* 2nd Place */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center order-2 md:order-1 h-fit"
                        >
                            <Medal size={40} className="text-slate-400 mx-auto mb-4" />
                            <div className="w-20 h-20 rounded-3xl mx-auto mb-4 overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                {topThree[1].image ? <img src={topThree[1].image} alt="" /> : <span className="text-2xl">🥈</span>}
                            </div>
                            <h3 className="font-black text-slate-900 text-lg mb-1 flex items-center justify-center gap-1">
                                {topThree[1].name} {topThree[1].isPro && <Crown size={14} className="text-amber-500" />}
                            </h3>
                            <div className="text-indigo-600 font-black text-2xl">{topThree[1].totalScore}</div>
                            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Knowledge Score</div>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl text-center order-1 md:order-2 scale-110 relative z-10"
                        >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">CHAMPION</div>
                            <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
                            <div className="w-24 h-24 rounded-[2.5rem] mx-auto mb-4 overflow-hidden border-4 border-slate-700 shadow-inner bg-slate-800 flex items-center justify-center">
                                {topThree[0].image ? <img src={topThree[0].image} alt="" /> : <span className="text-3xl">🥇</span>}
                            </div>
                            <h3 className="font-black text-white text-xl mb-1 flex items-center justify-center gap-2">
                                {topThree[0].name} {topThree[0].isPro && <Crown size={18} className="text-amber-400" />}
                            </h3>
                            <div className="text-amber-400 font-black text-4xl mb-2">{topThree[0].totalScore}</div>
                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Grandmaster Rank</div>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg text-center order-3 h-fit"
                        >
                            <Medal size={40} className="text-amber-600/60 mx-auto mb-4" />
                            <div className="w-20 h-20 rounded-3xl mx-auto mb-4 overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                {topThree[2].image ? <img src={topThree[2].image} alt="" /> : <span className="text-2xl">🥉</span>}
                            </div>
                            <h3 className="font-black text-slate-900 text-lg mb-1 flex items-center justify-center gap-1">
                                {topThree[2].name} {topThree[2].isPro && <Crown size={14} className="text-amber-500" />}
                            </h3>
                            <div className="text-indigo-600 font-black text-2xl">{topThree[2].totalScore}</div>
                            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Knowledge Score</div>
                        </motion.div>
                    </div>
                )}

                {/* Search & List */}
                <div className="bg-white rounded-[3rem] p-4 md:p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-50 pb-8">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search high-rankers..." 
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Explorers</div>
                                <div className="text-xl font-black text-slate-900">{users.length} Active</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Syncing Global Datastream...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {theRest.length === 0 && searchTerm && (
                                <div className="py-10 text-center text-slate-400 font-bold italic">No explorers found matching your search.</div>
                            )}
                            {filteredUsers.length === 0 && !searchTerm && (
                                <div className="py-10 text-center text-slate-400 font-bold italic">The leaderboard is currently empty. Be the first!</div>
                            )}

                            {filteredUsers.map((user, idx) => {
                                // Find overall rank
                                const rank = users.findIndex(u => u.id === user.id) + 1;
                                
                                return (
                                    <motion.div 
                                        key={user.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-6 px-8 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all border border-transparent hover:border-slate-100 group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 text-center font-black text-slate-300 group-hover:text-indigo-600 transition-colors">
                                                #{rank}
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center border border-slate-100">
                                                {user.image ? <img src={user.image} alt="" /> : <span className="text-xl">👤</span>}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                    {user.name} {user.isPro && <Crown size={14} className="text-amber-500" />}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        <Zap size={10} className="text-amber-500" /> {user.quizPoints} Pts
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        <Brain size={10} className="text-cyan-500" /> {user.factsRead} Facts
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        <BookOpen size={10} className="text-purple-500" /> {user.tfAnswered} T/F
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 md:mt-0 text-right">
                                            <div className="text-2xl font-black text-slate-900 leading-none mb-1">{user.totalScore}</div>
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Intelligence Pts</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

