"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Users, Crown, Sparkles, Star, Globe, Download, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProPricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    const benefits = [
        { icon: <Shield size={20} className="text-emerald-400" />, title: "Ad-Free Experience", desc: "Pure learning, no distractions." },
        { icon: <Award size={20} className="text-amber-400" />, title: "Pro User Badge", desc: "Stand out in the global leaderboard." },
        { icon: <Users size={20} className="text-blue-400" />, title: "Multiplayer Mode", desc: "Host rooms with up to 100 friends." },
        { icon: <Zap size={20} className="text-purple-400" />, title: "Infinite Lifelines", desc: "No ad-gates for 50/50 or Polls." },
        { icon: <Download size={20} className="text-rose-400" />, title: "Premium Exports", desc: "Export results in PDF/CSV anytime." },
        { icon: <Globe size={20} className="text-cyan-400" />, title: "All Mock Access", desc: "Unlock every SSC, IBPS, and Govt exam." }
    ];

    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-xl shadow-indigo-200"
                    >
                        <Crown size={14} /> Premium Membership
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">QUIZWEB PRO</span></h1>
                    <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Join the elite circle of learners. Unlock exclusive features, support the platform, and accelerate your exam preparation journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                    {/* Benefits List */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((benefit, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="p-4 bg-slate-50 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">{benefit.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pricing Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/10"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <Star className="text-amber-400 fill-amber-400 animate-pulse" size={32} />
                        </div>
                        
                        <div className="mb-10">
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Standard Pro</h3>
                            <p className="text-slate-400 text-sm font-medium">Limited time introductory offer</p>
                        </div>

                        <div className="flex items-end gap-2 mb-10">
                            <span className="text-6xl font-black">₹11</span>
                            <span className="text-slate-400 font-bold mb-2">/ month</span>
                        </div>

                        <ul className="space-y-4 mb-10">
                            {["Everything in Free", "No Ads Anywhere", "Pro Badge + Rank", "Unlock All Mocks", "Unlimited Lifelines", "100 Player Live Lobbys"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <div className="bg-emerald-500/20 p-1 rounded-full">
                                        <Check size={14} className="text-emerald-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button 
                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-950/50 mb-6"
                            onClick={() => window.location.href = '/donate?action=pro'}
                        >
                            Get Pro Access Now
                        </button>

                        <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Secure payment via Razorpay
                        </p>
                    </motion.div>
                </div>

                {/* FAQ/Trust Section */}
                <div className="mt-24 text-center">
                    <div className="flex flex-wrap justify-center gap-12 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                         <div className="flex items-center gap-3 font-black text-slate-400 text-xl tracking-tighter">
                            <div className="bg-slate-400 w-8 h-8 rounded-lg" /> SECURE PAY
                         </div>
                         <div className="flex items-center gap-3 font-black text-slate-400 text-xl tracking-tighter">
                            <div className="bg-slate-400 w-8 h-8 rounded-lg" /> RAZORPAY
                         </div>
                         <div className="flex items-center gap-3 font-black text-slate-400 text-xl tracking-tighter">
                            <div className="bg-slate-400 w-8 h-8 rounded-lg" /> 256-BIT SSL
                         </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

