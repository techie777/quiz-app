"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Search, X, Zap, Brain, BookOpen, Sparkles } from 'lucide-react';
import { useTier } from '@/context/TierContext';
import { useLanguage } from '@/context/LanguageContext';

// Safe deterministic gradient avatar colors
const AVATAR_GRADIENTS = [
    "from-indigo-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-fuchsia-600",
];

function getGradient(name = "") {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
}

function UserAvatar({ user, size = "md", className = "" }) {
    const [imageError, setImageError] = useState(false);
    const initial = (user?.name?.trim()?.[0] || "A").toUpperCase();
    const gradient = useMemo(() => getGradient(user?.name || ""), [user?.name]);

    const sizeClasses = {
        sm: "w-9 h-9 text-xs",
        md: "w-11 h-11 text-sm",
        lg: "w-14 h-14 text-base",
        xl: "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl",
    };

    const hasValidImage = user?.image && typeof user.image === "string" && user.image.trim() !== "" && !imageError;

    return (
        <div className={`relative shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
            <div className={`w-full h-full rounded-2xl overflow-hidden flex items-center justify-center font-black text-white shadow-sm border border-white/60 bg-gradient-to-br ${gradient}`}>
                {hasValidImage ? (
                    <img 
                        src={user.image} 
                        alt={user.name || "User"} 
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    <span className="drop-shadow-sm select-none">{initial}</span>
                )}
            </div>
            {user?.isPro && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border border-white text-[9px]">
                    ★
                </span>
            )}
        </div>
    );
}

export default function LeaderboardPage() {
    const { tier, studentGrade } = useTier();
    const { isHindi } = useLanguage();
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

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        return users.filter(u => 
            (u.name || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
    }, [users, searchTerm]);

    const topThree = useMemo(() => users.slice(0, 3), [users]);
    // When searching, show all matched users. When not searching, only show rank 4+ (podium has 1, 2, 3)
    const listUsers = useMemo(() => {
        if (searchTerm.trim()) return filteredUsers;
        return filteredUsers.slice(3);
    }, [filteredUsers, searchTerm]);

    return (
        <main className="min-h-screen bg-slate-50/70 py-4 sm:py-10 px-3 sm:px-6 pb-36">
            <div className="max-w-4xl mx-auto">
                {/* ── HEADER ── */}
                <div className="text-center mb-6 sm:mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-800 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider mb-2.5 shadow-2xs"
                    >
                        <Trophy size={13} className="text-amber-600" />
                        <span>{isHindi ? "वैश्विक इंटेलिजेंस रैंकिंग" : "Global Intelligence Ranking"}</span>
                    </motion.div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        {isHindi ? (
                            <>विश्व के <span className="text-indigo-600">शीर्ष प्रतियोगी</span></>
                        ) : (
                            <>The World&apos;s <span className="text-indigo-600">Smartest</span> Players</>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-xl mx-auto mt-1 sm:mt-2">
                        {isHindi 
                            ? "क्विज़ अंक + खोजे गए फैक्ट्स + जीती गई चुनौतियों के कुल इंटेलिजेंस स्कोर पर आधारित।"
                            : "Ranked by cumulative score: Quiz Points + Facts Read + Challenges Conquered."}
                    </p>
                </div>

                {/* ── STUDENTS TIER BANNER ── */}
                {tier === "students" && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-md flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                                🎓
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xs sm:text-sm font-black">
                                        {isHindi ? "कक्षा व स्कूल लीडरबोर्ड" : "Class & School Leaderboards"}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                                        {isHindi ? "जल्द आ रहा है" : "Soon"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/90 line-clamp-1 sm:line-clamp-none">
                                    {isHindi
                                        ? `आपके बोर्ड (${studentGrade}) के सहपाठियों के साथ 1v1 मुकाबला जल्द लाइव होगा!`
                                        : `Classmate rankings for ${studentGrade} launching soon! Enjoy global ranks.`}
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block px-3 py-1 rounded-lg bg-white/10 text-[11px] font-bold whitespace-nowrap">
                            ⚡ {studentGrade} Active
                        </div>
                    </motion.div>
                )}

                {/* ── TOP 3 OLYMPIC PODIUM (Side-by-side on all screens) ── */}
                {!loading && users.length >= 3 && !searchTerm && (
                    <div className="mb-6 sm:mb-10 pt-4">
                        <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-xl mx-auto px-1">
                            
                            {/* 🥈 2nd Place (Silver) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex-1 max-w-[170px] flex flex-col items-center"
                            >
                                <div className="relative mb-2 flex flex-col items-center">
                                    <span className="text-xs sm:text-sm font-black text-slate-400 mb-1">🥈 #2</span>
                                    <UserAvatar user={topThree[1]} size="lg" className="ring-4 ring-slate-300 ring-offset-2 ring-offset-slate-50" />
                                </div>
                                <div className="w-full bg-gradient-to-t from-slate-200 via-slate-100 to-white border border-slate-300/80 rounded-t-2xl sm:rounded-t-3xl pt-3 pb-3 px-2 text-center shadow-sm h-32 sm:h-36 flex flex-col justify-between">
                                    <div className="min-w-0 px-1">
                                        <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate" title={topThree[1].name}>
                                            {topThree[1].name}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Silver</span>
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-black text-base sm:text-xl leading-none">
                                            {topThree[1].totalScore}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">PTS</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* 🥇 1st Place (Gold Champion) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-1 max-w-[190px] flex flex-col items-center z-10"
                            >
                                <div className="relative mb-2 flex flex-col items-center">
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-xs mb-1 flex items-center gap-1">
                                        👑 CHAMPION
                                    </span>
                                    <UserAvatar user={topThree[0]} size="xl" className="ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-50 shadow-md" />
                                </div>
                                <div className="w-full bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 border-2 border-amber-400/80 rounded-t-2xl sm:rounded-t-3xl pt-3.5 pb-4 px-2 text-center shadow-lg shadow-amber-500/10 h-40 sm:h-48 flex flex-col justify-between">
                                    <div className="min-w-0 px-1">
                                        <p className="font-black text-xs sm:text-base text-slate-900 truncate" title={topThree[0].name}>
                                            {topThree[0].name}
                                        </p>
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Grandmaster</span>
                                    </div>
                                    <div>
                                        <div className="text-amber-900 font-black text-xl sm:text-2xl leading-none">
                                            {topThree[0].totalScore}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">PTS</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* 🥉 3rd Place (Bronze) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex-1 max-w-[170px] flex flex-col items-center"
                            >
                                <div className="relative mb-2 flex flex-col items-center">
                                    <span className="text-xs sm:text-sm font-black text-amber-700/80 mb-1">🥉 #3</span>
                                    <UserAvatar user={topThree[2]} size="lg" className="ring-4 ring-amber-600/40 ring-offset-2 ring-offset-slate-50" />
                                </div>
                                <div className="w-full bg-gradient-to-t from-amber-100/70 via-orange-50 to-white border border-amber-300/60 rounded-t-2xl sm:rounded-t-3xl pt-3 pb-3 px-2 text-center shadow-sm h-28 sm:h-32 flex flex-col justify-between">
                                    <div className="min-w-0 px-1">
                                        <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate" title={topThree[2].name}>
                                            {topThree[2].name}
                                        </p>
                                        <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-tight">Bronze</span>
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-black text-base sm:text-xl leading-none">
                                            {topThree[2].totalScore}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">PTS</span>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                )}

                {/* ── SEARCH & LEADERBOARD LIST ── */}
                <div className="bg-white rounded-3xl p-3 sm:p-6 shadow-sm border border-slate-100">
                    {/* Search & Counter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder={isHindi ? "प्रतियोगी खोजें..." : "Search players..."}
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 px-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {isHindi ? "कुल प्रतियोगी:" : "Total Explorers:"}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                                {users.length} {isHindi ? "सक्रिय" : "Active"}
                            </span>
                        </div>
                    </div>

                    {/* List Items */}
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="inline-block w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                                {isHindi ? "डेटा सिंक हो रहा है..." : "Syncing leaderboard..."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {listUsers.length === 0 && searchTerm && (
                                <div className="py-10 text-center text-slate-400 text-xs sm:text-sm font-medium">
                                    {isHindi ? `"${searchTerm}" से मेल खाता कोई प्रतियोगी नहीं मिला।` : `No players found matching "${searchTerm}".`}
                                </div>
                            )}

                            {listUsers.length === 0 && !searchTerm && users.length <= 3 && (
                                <div className="py-8 text-center text-slate-400 text-xs sm:text-sm font-medium">
                                    {isHindi 
                                        ? "शीर्ष 3 खिलाड़ी ऊपर पोडियम पर प्रदर्शित हैं! अधिक खिलाड़ियों को आमंत्रित करें।" 
                                        : "Top 3 champions are featured on the podium above! Invite more friends to compete."}
                                </div>
                            )}

                            {listUsers.map((user, idx) => {
                                // Find overall global rank
                                const rank = users.findIndex(u => u.id === user.id) + 1;
                                
                                return (
                                    <motion.div 
                                        key={user.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                        className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-100 transition-all border border-slate-100/80 group"
                                    >
                                        {/* Rank + Avatar + Name */}
                                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                            {/* Rank Number */}
                                            <div className="w-7 sm:w-8 text-center font-black text-xs sm:text-sm text-slate-400 group-hover:text-indigo-600 shrink-0">
                                                #{rank}
                                            </div>

                                            {/* Avatar with fallback */}
                                            <UserAvatar user={user} size="md" />

                                            {/* Name and Micro Stats */}
                                            <div className="min-w-0 flex-1 pr-2">
                                                <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                                                    <span>{user.name}</span>
                                                    {user.isPro && <Crown size={12} className="text-amber-500 shrink-0" />}
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] font-semibold text-slate-400">
                                                    <span className="flex items-center gap-0.5">
                                                        <Zap size={10} className="text-amber-500 shrink-0" />
                                                        <span>{user.quizPoints}</span>
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Brain size={10} className="text-cyan-500 shrink-0" />
                                                        <span>{user.factsRead}</span>
                                                    </span>
                                                    <span className="hidden sm:flex items-center gap-0.5">
                                                        <BookOpen size={10} className="text-purple-500 shrink-0" />
                                                        <span>{user.tfAnswered} T/F</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right shrink-0 pl-2">
                                            <div className="text-sm sm:text-lg font-black text-slate-900 leading-none">
                                                {user.totalScore}
                                            </div>
                                            <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">
                                                PTS
                                            </div>
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
