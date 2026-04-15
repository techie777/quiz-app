"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StarSprinkler({ trigger }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!trigger) return;

        // Generate a burst of stars
        const newParticles = Array.from({ length: 30 }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100, // horizontal position %
            size: Math.random() * 20 + 10, // px
            duration: Math.random() * 2 + 1, // seconds
            delay: Math.random() * 0.5,
            color: ['#fbbf24', '#fcd34d', '#fef3c7', '#ffffff'][Math.floor(Math.random() * 4)]
        }));

        setParticles(prev => [...prev, ...newParticles]);

        // Clean up after 3 seconds
        const timer = setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
        }, 3000);

        return () => clearTimeout(timer);
    }, [trigger]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
            <AnimatePresence>
                {particles.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{ y: -50, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                        animate={{ 
                            y: '110vh', 
                            rotate: 360,
                            opacity: [1, 1, 0]
                        }}
                        transition={{ 
                            duration: p.duration, 
                            delay: p.delay,
                            ease: "easeIn"
                        }}
                        style={{
                            position: 'absolute',
                            fontSize: p.size,
                            color: p.color,
                            textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                        }}
                    >
                        ⭐
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
