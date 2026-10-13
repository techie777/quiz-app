"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSessionEngine } from "@/engine/SessionProvider";
import { useLanguage } from "@/context/LanguageContext";
import { Send, X, Smile } from "lucide-react";

export default function ChatOverlayModal({ isOpen, onClose }) {
  const {
    chatMessages,
    sendChatMessage,
    sendReaction,
    session,
    participants,
  } = useSessionEngine();
  const { isHindi } = useLanguage();

  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, chatMessages?.length]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputMsg.trim()) return;
    sendChatMessage(inputMsg.trim());
    setInputMsg("");
  };

  const quickReactions = ["🔥", "👏", "❤️", "💯", "🎯", "🚀"];

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-end sm:items-center justify-center sm:justify-end sm:pr-8 sm:pb-8 p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[380px] bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col h-[75vh] sm:h-[540px] max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-base shadow-xs">
              💬
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                {isHindi ? "लाइव चैट (Live Chat)" : "Live Battle Chat"}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                👥 {(participants || []).length} {isHindi ? "खिलाड़ी रूम में हैं" : "players online"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            title="बंद करें (Close)"
          >
            ✕
          </button>
        </div>

        {/* Quick Reactions Bar */}
        <div className="flex items-center justify-around py-1.5 px-2 bg-slate-50 border-b border-slate-100 shrink-0">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                sendReaction(emoji);
                sendChatMessage(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:scale-125 active:scale-90 transition-all text-base cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar bg-slate-50/50">
          {(!chatMessages || chatMessages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <span className="text-3xl">💭</span>
              <p className="text-xs font-bold text-slate-600">
                {isHindi ? "अभी कोई संदेश नहीं है" : "No messages yet"}
              </p>
              <p className="text-[11px] text-slate-400">
                {isHindi ? "पहला संदेश भेजकर मुकाबला रोमांचक बनाएं!" : "Say hi to your fellow players!"}
              </p>
            </div>
          ) : (
            chatMessages.map((m, idx) => {
              const isYou = m.userId === session?.userId || m.role === session?.role && m.userName === session?.userName;
              const isHost = m.role === "HOST";

              return (
                <div
                  key={m.id || idx}
                  className={`flex flex-col ${isYou ? "items-end" : "items-start"} animate-in fade-in duration-200`}
                >
                  <div className="flex items-center gap-1.5 px-1 mb-0.5 text-[10px] text-slate-400 font-semibold">
                    <span>{isYou ? (isHindi ? "आप (You)" : "You") : m.userName}</span>
                    {isHost && (
                      <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[8px] font-black uppercase">
                        👑 होस्ट
                      </span>
                    )}
                    <span>• {formatTime(m.timestamp)}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold break-words shadow-2xs ${
                      isYou
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <form
          onSubmit={handleSend}
          className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder={isHindi ? "संदेश लिखें..." : "Type a message..."}
            className="flex-1 bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim()}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
            title="भेजें"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
