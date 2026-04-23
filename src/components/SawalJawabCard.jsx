"use client";

import { useState, useRef, useEffect } from 'react';
import { Share2, Download, RefreshCw, Eye } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';
import styles from '@/styles/SawalJawab.module.css';

export default function SawalJawabCard({ item, lang: initialLang = 'EN' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [localLang, setLocalLang] = useState(initialLang);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  // Sync with global language toggle
  useEffect(() => {
    setLocalLang(initialLang);
  }, [initialLang]);

  const question = localLang === 'HI' && item.questionHi ? item.questionHi : item.question;
  const answer = localLang === 'HI' && item.answerHi ? item.answerHi : item.answer;

  const handleFlip = (e) => {
    // Prevent flip if clicking language toggle
    if (e.target.closest(`.${styles.cardLangToggle}`)) return;
    if (e.target.closest('button') && !e.target.closest(`.${styles.revealBtn}`)) return;
    setIsFlipped(!isFlipped);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    const element = isFlipped ? backRef.current : frontRef.current;
    if (!element) return;
    
    const toastId = toast.loading('Generating your card image...');
    try {
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        // We override the transform to none to prevent mirroring/flipping in the export
        style: {
          transform: 'none',
          position: 'relative',
          top: '0',
          left: '0',
          width: '100%',
          height: 'auto',
          margin: '0',
          borderRadius: '2rem'
        }
      });
      const link = document.createElement('a');
      link.download = `mystery-${isFlipped ? 'jawab' : 'sawal'}-${item.id}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Downloaded!', { id: toastId });
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Export failed', { id: toastId });
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareData = {
      title: 'Sawal Jawab - QuizWeb',
      text: `Sawal: ${question}\n\nCan you solve it?`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Link copied!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className={styles.cardWrapper}>
      <div 
        className={`${styles.card} ${isFlipped ? styles.cardFlipped : ''}`}
        onClick={handleFlip}
      >
        {/* FRONT SIDE */}
        <div ref={frontRef} className={styles.cardFront}>
          <div className="flex justify-between items-start">
             <div className={styles.categoryTag}>{item.category?.name || 'Logical'}</div>
             <div className="flex items-center gap-3">
                <div className={styles.cardLangToggle} onClick={(e) => { e.stopPropagation(); setLocalLang(localLang === 'EN' ? 'HI' : 'EN'); }}>
                  <span className={localLang === 'EN' ? styles.langActive : ''}>EN</span>
                  <span className="opacity-20 mx-0.5">|</span>
                  <span className={localLang === 'HI' ? styles.langActive : ''}>HI</span>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-lg">
                   <Eye className="w-4 h-4 text-purple-400" />
                </div>
             </div>
          </div>

          <div className="mt-6">
            <h3 className={styles.questionText}>{question}</h3>
          </div>

          <button className={styles.revealBtn}>
            View Jawab <RefreshCw className="inline-block ml-2 w-4 h-4" />
          </button>

          <div className={styles.cardFooter}>
            <div className={styles.actions}>
              <button onClick={handleDownload} className={styles.actionBtn} title="Download Image">
                <Download size={16} />
              </button>
              <button onClick={handleShare} className={styles.actionBtn} title="Share with Friends">
                <Share2 size={16} />
              </button>
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-tighter">
              QUIZWEB.CO
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div ref={backRef} className={styles.cardBack}>
          <div className="flex justify-between items-start mb-4">
             <div className="text-[10px] font-black uppercase text-purple-300 tracking-widest opacity-50">
               The Jawab
             </div>
             <div className={styles.cardLangToggle} onClick={(e) => { e.stopPropagation(); setLocalLang(localLang === 'EN' ? 'HI' : 'EN'); }}>
                <span className={localLang === 'EN' ? styles.langActive : ''}>EN</span>
                <span className="opacity-20 mx-0.5">|</span>
                <span className={localLang === 'HI' ? styles.langActive : ''}>HI</span>
             </div>
          </div>
          <div className="flex-grow">
            <p className={styles.answerText}>{answer}</p>
          </div>

          <button className={`${styles.revealBtn} ${styles.backBtn}`}>
            Back to Sawal
          </button>

          <div className={styles.cardFooter}>
            <div className={styles.actions}>
              <button onClick={handleDownload} className={styles.actionBtn}>
                <Download size={16} />
              </button>
              <button onClick={handleShare} className={styles.actionBtn}>
                <Share2 size={16} />
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-bold tracking-tighter">
              QUIZWEB.CO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
