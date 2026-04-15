"use client";

import { useEffect, useState } from "react";
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
  const [lang, setLang] = useState("EN");
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

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem("factLang") || "EN";
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
      const res = await fetch(`/api/fun-facts/list?page=${pageNum}&limit=6&tab=random`);
      const data = await res.json();
      if (res.ok) {
        setRecommended(prev => pageNum === 1 ? data.facts : [...prev, ...data.facts]);
        setHasMoreRec(data.pagination.page < data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingRec(false);
  };

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

  const handleDownload = () => {
    if (!fact?.image) return toast.error("No image available to download.");
    fetch(fact.image)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `factify-${fact.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Download started!");
      })
      .catch(() => toast.error("Failed to download image"));
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
    <div className="bg-slate-950 text-white font-sans min-h-screen h-[100svh] md:h-auto overflow-y-auto md:overflow-visible scroll-snap-y-mandatory md:scroll-snap-none">
      
      {/* Top Progress Bar (Persistent Gamification) */}
      {isMounted && (
        <>
          <div className="fixed top-0 left-0 w-full h-[5px] z-[2000] bg-slate-900/50 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500 shadow-[0_0_20px_rgba(34,211,238,1)] transition-all duration-1000 ease-out"
              style={{ width: `${(streak % milestone === 0 && streak > 0) ? 100 : ((streak % milestone) / milestone) * 100}%` }}
            />
          </div>

          {/* Milestone Floating Badge - Adjusted for better visibility */}
          <div className="fixed top-20 right-6 z-[2000] pointer-events-auto">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-4 duration-500">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest text-white/50 uppercase leading-none mb-1">
                   RANK: EXPLORER
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">LEVEL {Math.floor(streak / 10) + 1}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-xs font-black text-cyan-400">
                    {streak % milestone}/{milestone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Voyager Hero Section (100vh viewport) */}
      <div className="relative h-[100svh] md:min-h-[100svh] flex flex-col overflow-hidden shrink-0 scroll-snap-align-start">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
         {fact.image ? (
            <>
              {/* Blurred background filling edges */}
              <img src={fact.image} alt="Background Fill" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" />
              {/* Centered contained original image */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <img src={fact.image} alt="Fact Visual" className="w-full h-full object-contain opacity-50" />
              </div>
            </>
         ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-40" />
         )}
         {/* Dark overlay for text legibility */}
         <div className="absolute inset-0 bg-slate-950/70" />
        </div>

      {/* Top Navigation */}
      <div className={`relative z-10 p-6 flex justify-between items-center max-w-6xl mx-auto w-full transition-opacity duration-300 ${isFullScreen ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <Link href="/fun-facts" className="flex items-center text-slate-300 hover:text-white transition">
           <ChevronLeft className="mr-1" /> Back to Hub
        </Link>
        <div className="flex items-center gap-4">
           {isFullScreen && (
              <button 
                 onClick={handleFullscreenToggle} 
                 className="bg-slate-800/80 text-xs px-4 py-1.5 rounded-full text-slate-300 hover:text-white border border-slate-600 hidden md:block"
              >
                 Exit Fullscreen
              </button>
           )}
           <div className="flex gap-2 bg-slate-900/80 p-1 rounded-full border border-slate-700">
              <button onClick={() => toggleLang("EN")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${lang === "EN" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>EN</button>
              <button onClick={() => toggleLang("HI")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${lang === "HI" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>HI</button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 md:px-12 max-w-5xl mx-auto w-full">
        
        {/* Voyager Category Badge */}
        <div className="bg-slate-800/80 border border-slate-600 px-6 py-2 rounded-full mb-10 flex items-center gap-3 backdrop-blur-md">
           <span className="text-amber-400 text-sm">⚡ VOYAGER STREAM:</span>
           <span className="text-white font-bold">{fact.category?.name}</span>
        </div>

        {/* Fact Text */}
        <div className="text-center relative max-w-4xl px-4 md:px-0">
           <span className="absolute -top-10 -left-6 md:-left-12 text-7xl md:text-9xl text-slate-400/30 font-serif leading-none">&ldquo;</span>
           <h1 className={`text-2xl md:text-4xl lg:text-5xl font-extrabold leading-relaxed tracking-wide drop-shadow-2xl ${lang === 'HI' ? 'font-serif' : ''}`}>
             {highlightFactText(displayText, true)}
           </h1>
           <span className="absolute -bottom-10 -right-6 md:-right-12 text-7xl md:text-9xl text-slate-400/30 font-serif leading-none">&rdquo;</span>
        </div>

            👁️ {fact.views + 1} explorers have read this
         </div>

         {/* Swipe Up Hint (Mobile Only) */}
         <div className="md:hidden absolute bottom-24 flex flex-col items-center animate-bounce opacity-40">
            <span className="text-[10px] font-black tracking-widest uppercase mb-1">Swipe Up</span>
            <ChevronLeft className="-rotate-90" size={16} />
         </div>

      </div>

      {/* Center Navigation Controls (Desktop Only) - Now centered relative to card */}
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full max-w-7xl hidden md:flex justify-between px-6 pointer-events-none z-20">
         {prevId ? (
           <button onClick={() => router.push(`/fun-facts/read/${prevId}`)} className="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition hover:scale-110">
             <ArrowLeft strokeWidth={3} />
           </button>
         ) : <div /> }
         
         {nextId ? (
            <button onClick={() => router.push(`/fun-facts/read/${nextId}`)} className="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition hover:scale-110">
              <ArrowRight strokeWidth={3} />
            </button>
         ) : <div /> }
      </div>

      {/* Floating Action Menu (Right Side - Desktop Only for most items) */}
      <div className="absolute bottom-24 md:bottom-32 right-4 md:right-6 lg:right-8 flex flex-col gap-4 z-20">
        <button onClick={() => setIsPlaying(!isPlaying)} className={`p-3 rounded-full backdrop-blur-md border ${isPlaying ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800/60 border-slate-600 text-white'} hover:bg-slate-700 transition shadow-lg hidden md:flex items-center justify-center`} title="Autoplay 10s">
           {isPlaying ? <Pause size={20} /> : <Play size={20} />} 
        </button>
        {isPlaying && <div className="hidden md:block text-[10px] font-bold text-amber-500 text-center -mt-3 drop-shadow-md">10s</div>}
        
        <button onClick={handleShare} className="p-3 rounded-full backdrop-blur-md bg-slate-800/60 border border-slate-600 text-white hover:bg-slate-700 transition shadow-lg hidden md:block" title="Share via Link or Native">
           <Share2 size={20} />
        </button>
        <button onClick={handleWhatsApp} className="p-3 rounded-full backdrop-blur-md bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/40 transition shadow-lg hidden md:block" title="Share on WhatsApp">
           <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </button>
        <button onClick={handleFullscreenToggle} className={`p-3 rounded-full backdrop-blur-md border ${isFullScreen ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/60 border-slate-600 text-white'} hover:bg-slate-700 transition shadow-lg hidden md:block`} title="Fullscreen Mode">
           <Maximize2 size={20} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="relative z-20 bg-slate-900/80 border-t border-slate-800 backdrop-blur-xl p-4 mt-auto">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
           <div className="flex gap-2 md:gap-6">
              <button onClick={() => toggleInteraction('like')} className="flex items-center gap-2 px-4 py-2 rounded-xl transition hover:bg-slate-800">
                <Heart className={hasLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
                <span className={hasLiked ? "text-rose-500 font-bold" : "text-slate-300"}>{likes}</span>
              </button>
              
              <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition hover:bg-slate-800 text-slate-300">
                <MessageCircle /> <span>{comments.length}</span>
              </button>
              
              <button onClick={() => toggleInteraction('favorite')} className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition hover:bg-slate-800">
                <Star className={hasFavorited ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                <span className={hasFavorited ? "text-amber-400 font-bold" : "text-slate-300 hidden md:inline"}>Save</span>
              </button>

              {/* Mobile-Only Actions Area */}
              <div className="flex md:hidden items-center gap-1 border-l border-slate-700/50 pl-1 ml-1">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-xl transition ${isPlaying ? 'text-amber-500' : 'text-slate-400'}`}>
                   {isPlaying ? <Pause size={20} /> : <Play size={20} />} 
                </button>
                <button onClick={handleWhatsApp} className="p-2 rounded-xl text-[#25D366] transition">
                   <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
                <button onClick={handleShare} className="p-2 rounded-xl text-slate-400 transition">
                   <Share2 size={20} />
                </button>
              </div>

           </div>
           
           <div>
             {fact.image && (
               <button onClick={handleDownload} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl font-bold transition">
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



      {/* Recommended Scrolling Feed Section */}
      <div className="max-w-6xl mx-auto p-6 md:p-12 w-full pt-20">
         <h2 className="text-2xl font-bold mb-8 text-slate-100 flex items-center gap-2">
            <Sparkles className="text-amber-400" /> Keep Exploring
         </h2>
         
         <div className={`${styles.wallGrid} h-auto md:h-initial`}>
            {recommended.map((recFact, index) => {
              const recText = lang === "HI" && recFact.descriptionHi ? recFact.descriptionHi : recFact.description;
              const hasImg = recFact.image;
              return (
                <Link href={`/fun-facts/read/${recFact.id}`} key={recFact.id + index} className="block h-[100svh] md:h-auto shrink-0 scroll-snap-align-start">
                  <div className={`${hasImg ? '' : styles.wallFactCard} h-full md:h-auto hover:-translate-y-1 transition-transform cursor-pointer relative`}>
                    {hasImg && recFact.image.startsWith('/uploads') ? (
                        <div className="relative w-full h-full min-h-[300px]">
                           <img src={recFact.image} alt="Fun Fact" className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                              <span className="text-sm font-bold uppercase text-amber-400">• {recFact.category?.name}</span>
                           </div>
                        </div>
                    ) : (
                        <div 
                          className={styles.wallFactText}
                          style={hasImg ? { 
                            backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 100%), url('${recFact.image}')`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center', 
                            color: 'white', 
                            minHeight: '350px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-end', 
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                          } : {
                            background: '#1e293b',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#f8fafc'
                          }}
                        >
                          <div className="font-bold text-lg leading-tight">{recText}</div>
                          <div className={`mt-6 text-xs font-bold uppercase flex items-center justify-between gap-2 ${hasImg ? 'text-amber-400' : 'text-indigo-400'}`}>
                             <div className="flex items-center gap-1"><span>•</span> {recFact.category?.name}</div>
                          </div>
                        </div>
                    )}
                  </div>
                </Link>
              );
            })}
         </div>

         {hasMoreRec && (
           <div className="flex justify-center mt-12">
              <button onClick={() => fetchRecommended(recPage + 1)} disabled={loadingRec} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-bold transition flex items-center gap-2">
                 {loadingRec ? "Loading..." : "Load More"}
              </button>
           </div>
         )}
      </div>

    </div>
  );
}
