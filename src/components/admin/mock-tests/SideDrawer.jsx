"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * SideDrawer Component
 * High-resolution, responsive drawer panel with pure CSS slide animations.
 */
export default function SideDrawer({ isOpen, onClose, title, children, maxWidth = "600px" }) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer Container */}
      <div 
        className="relative h-full bg-white shadow-2xl z-[1000] flex flex-col transition-transform duration-300 ease-out transform translate-x-0"
        style={{ width: '100%', maxWidth }}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
