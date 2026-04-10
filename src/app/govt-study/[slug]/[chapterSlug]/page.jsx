"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/GovtStudy.module.css'; // I can reuse some styles or add new ones inline

export default function StudyChapterDetail() {
  const { slug, chapterSlug } = useParams();
  const router = useRouter();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChapter() {
      try {
        const res = await fetch(`/api/govt-study/${slug}/${chapterSlug}`);
        const data = await res.json();
        if (data && !data.error) {
          setChapter(data);
        }
      } catch (error) {
        console.error("Failed to fetch chapter:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [slug, chapterSlug]);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto p-4 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="max-w-[1200px] mx-auto p-4 min-h-screen bg-slate-50">
         <div className="max-w-2xl mx-auto py-20 px-6 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Chapter Not Found</h2>
            <Link href={`/govt-study/${slug}`} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest">
              Back to Book
            </Link>
         </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      
      {/* Top Reading Navigation Bar */}
      <header className="bg-[#eef2f6] border-b border-[#cbd5e1] p-4 flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-4">
             <Link href={`/govt-study/${slug}`}>
                 <div className="w-10 h-10 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="12" x2="3" y2="12"></line><line x1="3" y1="12" x2="10" y2="5"></line><line x1="3" y1="12" x2="10" y2="19"></line></svg>
                 </div>
             </Link>
             <h2 className="text-xl font-bold text-slate-800 hidden md:block">{chapter.title}</h2>
         </div>
         <div>
            {chapter.practiceId && (
                <Link href={`/mock-tests/paper/${chapter.practiceId}/instructions`} className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                    Start Practice 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </Link>
            )}
         </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-6">
          
          {/* Breadcrumbs */}
          <div className="text-sm font-bold text-[#059669] mb-6 flex items-center gap-2 flex-wrap">
              <Link href="/govt-study" className="hover:underline">Library</Link> <span>&gt;</span>
              <Link href={`/govt-study/${slug}`} className="hover:underline">{chapter.subject?.material?.name}</Link> <span>&gt;</span>
              <span className="text-slate-500">{chapter.title}</span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-300">{chapter.title}</h1>
          
          {chapter.videoId && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-10 shadow-lg">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${chapter.videoId}`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                  ></iframe>
              </div>
          )}

          {/* Prose Content */}
          <article className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-a:text-[#059669] prose-img:rounded-xl">
             <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
          </article>
          
          {/* Bottom Practice CTA */}
          {chapter.practiceId && (
          <div className="mt-20 flex justify-end">
              <Link href={`/mock-tests/paper/${chapter.practiceId}/instructions`} className="bg-[#059669] hover:bg-[#047857] text-white px-8 py-4 rounded-xl font-black uppercase flex items-center gap-3 transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl">
                  <span>Start Practice Test</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
          </div>
          )}
      </div>

    </main>
  );
}
