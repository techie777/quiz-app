"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, MessageCircle, Share2, Star, Download, Maximize2, Pause, Play, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { highlightFactText } from "@/lib/textUtils";
import styles from "@/styles/FunFacts.module.css";

export default function FunFactVoyager({ params }) {
  const router = useRouter();
  const [fact, setFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("HI");
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Social states
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [favorites, setFavorites] = useState(0);
  const [hasFavorited, setHasFavorited] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSignOutConfirm, setIsSignOutConfirm] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Gamification states
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState(10);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Recommended feed
  const [recommended, setRecommended] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [loadingRec, setLoadingRec] = useState(false);
  const [hasMoreRec, setHasMoreRec] = useState(true);

  // Neighbors
  const [nextId, setNextId] = useState(null);
  const [prevId, setPrevId] = useState(null);
  
  // Observer ref for infinite scroll
  const observerRef = useRef();

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem("factLang") || "HI";
    setLang(savedLang);
    
    // Load gamification state
    const savedStreak = parseInt(localStorage.getItem("factStreak") || "0");
    setStreak(savedStreak);

    fetchFactData();
    fetchRecommended(1);
  }, [params.id]);

  // Update streak when fact is loaded - ensuring we don't count same fact twice in same load
  useEffect(() => {
    if (fact && !hasCelebrated) {
      const currentStreak = parseInt(localStorage.getItem("factStreak") || "0");
      const lastFactId = localStorage.getItem("lastFactId");
      
      if (lastFactId !== params.id) {
        const newStreak = currentStreak + 1;
        setStreak(newStreak);
        localStorage.setItem("factStreak", newStreak.toString());
        localStorage.setItem("lastFactId", params.id);
        
        // Check for milestone
        if (newStreak % milestone === 0 && newStreak > 0) {
          triggerMilestone();
        }
      }
    }
  }, [fact]);

  const triggerMilestone = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#818cf8', '#f472b6']
    });
    toast.success(`Incredible! You just reached Level ${Math.floor(streak / 10) + 1}!`, {
      icon: '🧠',
      duration: 5000,
      style: {
        borderRadius: '10px',
        background: '#1e293b',
        color: '#fff',
        border: '1px solid #334155'
      }
    });
  };

  useEffect(() => {
    let interval;
    if (isPlaying && nextId) {
      interval = setInterval(() => {
        router.push(`/fun-facts/read/${nextId}`);
      }, 10000); // 10s auto-play
    }
    return () => clearInterval(interval);
  }, [isPlaying, nextId]);

  const fetchFactData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fun-facts/single?id=${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      
      setFact(data.fact);
      setNextId(data.nextId);
      setPrevId(data.prevId);
      
      setLikes(data.fact._count?.likes || 0);
      setFavorites(data.fact._count?.favorites || 0);
      setHasLiked(data.hasLiked);
      setHasFavorited(data.hasFavorited);
      
      fetchComments();
    } catch (err) {
      toast.error("Fact not found");
      router.push("/fun-facts");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/fun-facts/comments?factId=${params.id}`);
    const data = await res.json();
    if (res.ok) setComments(data.comments || []);
  };

  const fetchRecommended = async (pageNum) => {
    if (loadingRec) return;
    setLoadingRec(true);
    try {
      const res = await fetch(`/api/fun-facts/list?page=${pageNum}&limit=6&tab=random&excludeId=${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setRecommended(prev => pageNum === 1 ? data.facts : [...prev, ...data.facts]);
        setHasMoreRec(data.pagination.page < data.pagination.totalPages);
        setRecPage(pageNum);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingRec(false);
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (loading || !hasMoreRec) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRec) {
        fetchRecommended(recPage + 1);
      }
    }, { threshold: 0.1 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [recPage, hasMoreRec, loadingRec, loading]);

  const toggleInteraction = async (action) => {
    const res = await fetch("/api/fun-facts/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factId: params.id, action })
    });
    
    if (res.status === 401) return toast.error("Please sign in to interact!");
    const data = await res.json();
    
    if (res.ok) {
      if (action === "like") {
        setHasLiked(data.liked);
        setLikes(prev => data.liked ? prev + 1 : prev - 1);
        if (data.liked) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        setHasFavorited(data.favorited);
        setFavorites(prev => data.favorited ? prev + 1 : prev - 1);
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    const res = await fetch("/api/fun-facts/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factId: params.id, content: newComment })
    });
    setSubmittingComment(false);
    if (res.status === 401) return toast.error("Please sign in to comment!");
    if (res.ok) {
      setNewComment("");
      fetchComments();
      toast.success("Comment posted!");
    } else {
      toast.error("Failed to post comment");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Factify | Mind Blowing Fact',
        text: fact?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownload = async () => {
    if (!fact?.image) return toast.error("No image available to download.");
    
    toast.loading("Generating high-quality card...", { id: "download" });
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fact.image;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Fixed 1080x1080 for social media optimization
      canvas.width = 1080;
      canvas.height = 1080;
      
      // 1. Draw Background (Aspect Fill)
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      // 2. Add Immersive Overlay (Gradient from bottom)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.1)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.4)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 3. Draw Fact Text
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      
      const fontSize = lang === "HI" ? 54 : 48;
      ctx.font = `900 ${fontSize}px "Inter", "system-ui", sans-serif`;
      
      const maxWidth = 900;
      const words = displayText.split(" ");
      let line = "";
      const lines = [];
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const lineHeight = fontSize * (lang === "HI" ? 1.6 : 1.4);
      let startY = 540 - (lines.length * lineHeight) / 2;
      
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), 540, startY + i * lineHeight);
      });
      
      // 4. Branding & Category Watermark
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(34, 211, 238, 0.9)"; // Cyan-400
      ctx.font = "bold 20px 'Inter', sans-serif";
      // Letter spacing not supported in older canvas, we'll just use bold
      ctx.fillText(fact.category?.name?.toUpperCase() || "FUN FACT", 540, 950);
      
      ctx.fillStyle = "white";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText("QUIZWEB • FACTIFY", 540, 1000);

      // Trigger Download
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `Factify_${fact.id}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Ready for sharing!", { id: "download" });
    } catch (err) {
      console.error(err);
      toast.error("Generation failed. Check connection.", { id: "download" });
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fact.description + '\n\nRead more at: ' + window.location.href)}`;
    window.open(url, '_blank');
  };

  const toggleLang = (l) => {
    setLang(l);
    localStorage.setItem("factLang", l);
  };

  const handleFullscreenToggle = () => {
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  if (loading || !fact) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const displayText = lang === "HI" && fact.descriptionHi ? fact.descriptionHi : fact.description;

  return (
    <div className="bg-slate-950 text-white font-sans min-h-screen">
      
      {/* Top Progress Bar (Persistent Gamification) */}
      {isMounted && (
        <>
          <div className="fixed top-0 left-0 w-full h-[5px] z-[2000] bg-slate-900/50 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500 shadow-[0_0_20px_rgba(34,211,238,1)] transition-all duration-1000 ease-out"
              style={{ width: `${(streak % milestone === 0 && streak > 0) ? 100 : ((streak % milestone) / milestone) * 100}%` }}
            />
          </div>

        </>
      )}
      
      {/* Voyager Hero Section (100vh viewport) */}
      <div className="relative h-[100svh] md:min-h-[100svh] flex flex-col shrink-0 overflow-hidden">
        {/* Background Layer - High Fidelity Object Cover for Full Immersion */}
        <div className="absolute inset-0 z-0">
         {(fact.image || fact.category?.image) ? (
            <img 
              src={fact.image || fact.category?.image} 
              alt="Background Visual" 
              className="absolute inset-0 w-full h-full object-cover opacity-60" 
            />
         ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black" />
         )}
         {/* Advanced Multi-Stage Overlays for Depth and Legibility */}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
         <div className="absolute inset-0 bg-black/20" />
        </div>

      {/* Immersive Top Bar - Glass Header - Unified Command Center - Now scrolls with content */}
      <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-7xl h-auto transition-opacity duration-300 ${isFullScreen ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-1.5">
            <Link href="/fun-facts" className="group flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-slate-300 transition-all">
               <ChevronLeft className="mr-0.5 group-hover:-translate-x-1 transition-transform" size={14} /> 
               <span className="text-[9px] font-bold tracking-wider uppercase">Hub</span>
            </Link>
            
            {fact.image && (
              <button 
                onClick={handleDownload} 
                className="p-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-full border border-white/10 transition-all"
                title="Download Card"
              >
                <Download size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
             {/* Integrated Interaction Block - Visible on all screens */}
             <div className="flex items-center bg-white/10 rounded-full px-2 py-0.5 border border-white/10">
                <button onClick={() => toggleInteraction('like')} className="p-1.5 transition hover:scale-110">
                  <Heart size={14} className={hasLiked ? "fill-rose-500 text-rose-500" : "text-slate-300"} />
                </button>
                <button onClick={() => toggleInteraction('favorite')} className="p-1.5 transition hover:scale-110" title="Save Fact">
                  <Star size={14} className={hasFavorited ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
             </div>

             <div className="flex gap-1 bg-white/5 p-0.5 rounded-full border border-white/10">
                <button onClick={() => toggleLang("EN")} className={`px-2.5 py-1 rounded-full text-[8px] font-black tracking-widest transition-all ${lang === "EN" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>EN</button>
                <button onClick={() => toggleLang("HI")} className={`px-2.5 py-1 rounded-full text-[8px] font-black tracking-widest transition-all ${lang === "HI" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>HI</button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Increased pt to ensures text stays below hub row even when justify-centered */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 md:px-12 max-w-5xl mx-auto w-full pt-36 pb-12 md:pt-48 md:pb-24">
        {/* Fact Text - Clear Frame (Removed semi-transparent layer as requested) */}
        <div className="relative max-w-4xl w-full">
           <div className="relative z-10 rounded-[2.5rem] px-8 md:px-16 py-10 md:py-20 text-center">
              <span className="absolute -top-4 -left-2 md:-top-12 md:-left-12 text-6xl md:text-9xl text-indigo-400/20 font-serif leading-none select-none">&ldquo;</span>
              <h1 
                className={`text-xl md:text-3xl lg:text-5xl font-extrabold leading-[1.6] md:leading-[1.4] tracking-tight ${lang === 'HI' ? 'font-serif' : ''} text-white`}
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 10px 40px rgba(0,0,0,0.7)',
                }}
              >
                {highlightFactText(displayText, true)}
              </h1>
              <span className="absolute -bottom-8 -right-2 md:-bottom-20 md:-right-12 text-6xl md:text-9xl text-indigo-400/20 font-serif leading-none select-none">&rdquo;</span>
           </div>
        </div>

        {/* People Read Count & Mobile Nav - Shifted Lower & Wider Profile */}
        <div className="mt-24 w-fit px-16 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex flex-col items-center gap-1.5 shadow-xl">
           <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold tracking-[0.2em] uppercase">
               <div className="w-3 h-[1px] bg-white/20" />
               <span>{fact.views + 1} People Read</span>
               <div className="w-3 h-[1px] bg-white/20" />
           </div>

           {/* Mobile-only Optimized Navigation - Wide & Compact */}
           <div className="flex md:hidden items-center gap-8 pointer-events-auto">
               {prevId && (
                 <button onClick={() => router.push(`/fun-facts/read/${prevId}`)} className="bg-white/10 text-white/80 p-2 rounded-full border border-white/10 active:scale-90 transition-all">
                   <ArrowLeft strokeWidth={2.5} size={16} />
                 </button>
               )}
               {nextId && (
                 <button onClick={() => router.push(`/fun-facts/read/${nextId}`)} className="bg-white/10 text-white/80 p-2 rounded-full border border-white/10 active:scale-90 transition-all">
                   <ArrowRight strokeWidth={2.5} size={16} />
                 </button>
               )}
           </div>
        </div>
      </div>

      {/* Center Navigation Controls (Desktop Only) */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 w-full justify-between px-8 pointer-events-none z-20">
         {prevId ? (
           <button onClick={() => router.push(`/fun-facts/read/${prevId}`)} className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 md:p-5 rounded-full border border-white/20 transition-all hover:scale-110">
             <ArrowLeft strokeWidth={2.5} size={24} />
           </button>
         ) : <div /> }
         
         {nextId ? (
            <button onClick={() => router.push(`/fun-facts/read/${nextId}`)} className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 md:p-5 rounded-full border border-white/20 transition-all hover:scale-110">
              <ArrowRight strokeWidth={2.5} size={24} />
            </button>
         ) : <div /> }
      </div>

      {/* Bottom Action Bar Hub (Consolidated) */}
      <div className="relative z-20 bg-slate-900/80 border-t border-slate-800 backdrop-blur-xl p-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
              {/* Progress & Rank Indicator (New Location) */}
              <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 shrink-0">
                  <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest leading-tight">LVL. {Math.floor(streak / 10) + 1}</span>
                  <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter">EXPLORER</span>
              </div>

              {/* Interaction Block */}
              <div className="flex items-center bg-white/5 rounded-2xl px-2">
                <button onClick={() => toggleInteraction('like')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition hover:bg-white/10">
                  <Heart size={18} className={hasLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
                  <span className={hasLiked ? "text-rose-500 font-bold" : "text-slate-300"}>{likes}</span>
                </button>
                
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition hover:bg-white/10 text-slate-300">
                  <MessageCircle size={18} /> <span>{comments.length}</span>
                </button>
                
                <button onClick={() => toggleInteraction('favorite')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition hover:bg-white/10" title="Save Fact">
                  <Star size={18} className={hasFavorited ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                  <span className={hasFavorited ? "text-amber-400 font-bold" : "text-slate-300 hidden md:inline"}>Save</span>
                </button>
              </div>

              {/* Utility Block (Consolidated) */}
              <div className="flex items-center bg-white/5 rounded-2xl px-2 gap-1">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2.5 rounded-xl transition ${isPlaying ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:bg-white/10'}`} title="Autoplay">
                   {isPlaying ? <Pause size={20} /> : <Play size={20} />} 
                </button>
                <button onClick={handleWhatsApp} className="p-2.5 rounded-xl text-[#25D366] hover:bg-[#25D366]/10 transition" title="WhatsApp">
                   <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
                <button onClick={handleShare} className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 transition" title="Share Link">
                   <Share2 size={20} />
                </button>
                <button onClick={handleFullscreenToggle} className={`p-2.5 rounded-xl transition ${isFullScreen ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-white/10'}`} title="Fullscreen">
                   <Maximize2 size={20} />
                </button>
              </div>
           </div>
           
           <div>
             {fact.image && (
               <button onClick={handleDownload} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20 active:scale-95">
                 <Download size={18} /> <span className="hidden md:inline">Download Card</span>
               </button>
             )}
           </div>
        </div>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute right-0 bottom-20 top-20 w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-30 flex flex-col shadow-2xl">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center">
             <h3 className="font-bold text-lg">Comments ({comments.length})</h3>
             <button onClick={() => setShowComments(false)} className="text-slate-400 hover:text-white">✕</button>
           </div>
           
           <div className="flex-grow overflow-y-auto p-4 space-y-6">
             {comments.length === 0 ? (
               <p className="text-center text-slate-500 mt-10">No comments yet. Be the first!</p>
             ) : (
               comments.map(c => (
                 <div key={c.id} className="flex gap-3">
                   <img src={c.user.image || c.user.avatar || "/default-avatar.png"} alt="User" className="w-8 h-8 rounded-full border border-slate-700" />
                   <div>
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold text-sm text-indigo-400">{c.user.nickname || c.user.name || "Explorer"}</span>
                       <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm mt-1 text-slate-300">{c.content}</p>
                   </div>
                 </div>
               ))
             )}
           </div>

           <div className="p-4 border-t border-slate-800 bg-slate-900">
             <form onSubmit={submitComment} className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Add a comment..." 
                 value={newComment}
                 onChange={e => setNewComment(e.target.value)}
                 className="flex-grow bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 required
               />
               <button disabled={submittingComment} type="submit" className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl text-white transition disabled:opacity-50">
                 <ArrowRight size={20} />
               </button>
             </form>
           </div>
        </div>
      )}



      </div>
      {/* Recommended Scrolling Feed Section */}
      <div className="max-w-6xl mx-auto p-6 md:p-12 w-full pt-20">
         <h2 className="text-2xl font-bold mb-8 text-slate-100 flex items-center gap-2">
            <Sparkles className="text-amber-400" /> Keep Exploring
         </h2>
         
         <div className={`${styles.wallGrid} h-auto md:h-initial`}>
            {recommended.map((recFact, index) => {
              const recText = lang === "HI" && recFact.descriptionHi ? recFact.descriptionHi : recFact.description;
              const effectiveImg = recFact.image || recFact.category?.image;
              const hasImg = !!effectiveImg;
              return (
                <Link href={`/fun-facts/read/${recFact.id}`} key={recFact.id + index} className="block shrink-0">
                  <div className={`${hasImg ? '' : styles.wallFactCard} h-full md:h-auto hover:-translate-y-1 transition-transform cursor-pointer relative`}>
                        <div 
                          className={styles.wallFactText}
                          style={hasImg ? { 
                            backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.3) 100%), url('${effectiveImg}')`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center', 
                            color: 'white', 
                            minHeight: '280px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-end', 
                            textShadow: '0 0.5px 0 #000, 0 -0.5px 0 #000, 0.5px 0 0 #000, -0.5px 0 0 #000, 0 2px 8px rgba(0,0,0,0.8)',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.15)',
                            ring: '1px solid rgba(255,255,255,0.05)'
                          } : {
                            background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
                            minHeight: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#f8fafc',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}
                        >
                          <div className="font-bold text-lg leading-tight">{recText}</div>
                          <div className={`mt-6 text-xs font-bold uppercase flex items-center justify-between gap-2 ${hasImg ? 'text-amber-400' : 'text-indigo-400'}`}>
                             <div className="flex items-center gap-1"><span>•</span> {recFact.category?.name}</div>
                          </div>
                        </div>
                  </div>
                </Link>
              );
            })}
         </div>

          {/* Infinite Scroll Loader Trigger */}
          <div ref={observerRef} className="h-20 flex items-center justify-center mt-8">
             {loadingRec && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>}
             {!hasMoreRec && recommended.length > 0 && <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">End of the stream</span>}
          </div>
      </div>
    </div>
  );
}
