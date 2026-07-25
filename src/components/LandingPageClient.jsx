"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Clock, BookOpen, User, ArrowRight, Share2, Heart, Filter, SlidersHorizontal, ChevronDown, ChevronUp, Star, LayoutGrid, List, Sparkles, Trophy, Radio } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useSession, signIn } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import styles from "@/styles/LandingPage.module.css";
import WelcomePromoPopup from "@/components/WelcomePromoPopup";
import LiveStudyButton from "@/components/engine/LiveStudyButton";
import MixPlayCard from "@/components/MixPlayCard";
import MixQuizModal from "@/components/MixQuizModal";
import ExamModeSwitcher from "@/components/govt-exam/ExamModeSwitcher";
import SubjectIndexTree from "@/components/govt-exam/SubjectIndexTree";
import DigitalBookReader from "@/components/govt-exam/DigitalBookReader";

// Import safe JSON parsing utility
function safeJsonParse(json, fallback = []) {
  if (!json) return fallback;
  if (typeof json !== 'string') return json;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("JSON parse error in home page:", error, "on string:", json);
    return fallback;
  }
}


function getRelevantImage(topic, emoji) {
  const topicLower = topic.toLowerCase();
  
  // Science related topics
  if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology') || topicLower.includes('astronomy')) {
    return '🔬';
  }
  
  // History related topics
  if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('medieval') || topicLower.includes('war') || topicLower.includes('civilization')) {
    return '📚';
  }
  
  // Geography related topics
  if (topicLower.includes('geography') || topicLower.includes('country') || topicLower.includes('capital') || topicLower.includes('world') || topicLower.includes('map')) {
    return '🌍';
  }
  
  // Technology/Computer topics
  if (topicLower.includes('computer') || topicLower.includes('technology') || topicLower.includes('programming') || topicLower.includes('software') || topicLower.includes('internet')) {
    return '💻';
  }
  
  // Mathematics topics
  if (topicLower.includes('math') || topicLower.includes('mathematics') || topicLower.includes('algebra') || topicLower.includes('geometry') || topicLower.includes('calculation')) {
    return '🔢';
  }
  
  // Sports topics
  if (topicLower.includes('sport') || topicLower.includes('football') || topicLower.includes('cricket') || topicLower.includes('basketball') || topicLower.includes('tennis')) {
    return '⚽';
  }
  
  // Entertainment/Movies topics
  if (topicLower.includes('movie') || topicLower.includes('film') || topicLower.includes('cinema') || topicLower.includes('bollywood') || topicLower.includes('hollywood')) {
    return '🎬';
  }
  
  // Music topics
  if (topicLower.includes('music') || topicLower.includes('song') || topicLower.includes('instrument') || topicLower.includes('singer') || topicLower.includes('melody')) {
    return '🎵';
  }
  
  // Literature/Books topics
  if (topicLower.includes('book') || topicLower.includes('literature') || topicLower.includes('novel') || topicLower.includes('author') || topicLower.includes('poem')) {
    return '📖';
  }
  
  // Art topics
  if (topicLower.includes('art') || topicLower.includes('painting') || topicLower.includes('drawing') || topicLower.includes('sculpture') || topicLower.includes('museum')) {
    return '🎨';
  }
  
  // Food/Cooking topics
  if (topicLower.includes('food') || topicLower.includes('cook') || topicLower.includes('recipe') || topicLower.includes('cuisine') || topicLower.includes('dish')) {
    return '🍳';
  }
  
  // Animals/Nature topics
  if (topicLower.includes('animal') || topicLower.includes('wildlife') || topicLower.includes('nature') || topicLower.includes('forest') || topicLower.includes('ocean')) {
    return '🦁';
  }
  
  // Health/Medical topics
  if (topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('disease') || topicLower.includes('body') || topicLower.includes('medicine')) {
    return '⚕️';
  }
  
  // Business/Economy topics
  if (topicLower.includes('business') || topicLower.includes('economy') || topicLower.includes('finance') || topicLower.includes('money') || topicLower.includes('market')) {
    return '💰';
  }
  
  // Politics/Government topics
  if (topicLower.includes('politics') || topicLower.includes('government') || topicLower.includes('election') || topicLower.includes('democracy') || topicLower.includes('parliament')) {
    return '🏛️';
  }
  
  // Space/Universe topics
  if (topicLower.includes('space') || topicLower.includes('universe') || topicLower.includes('planet') || topicLower.includes('galaxy') || topicLower.includes('astronaut')) {
    return '🚀';
  }
  
  // Religion/Mythology topics
  if (topicLower.includes('religion') || topicLower.includes('mythology') || topicLower.includes('god') || topicLower.includes('temple') || topicLower.includes('church')) {
    return '⛪';
  }
  
  // Language topics
  if (topicLower.includes('language') || topicLower.includes('english') || topicLower.includes('grammar') || topicLower.includes('vocabulary') || topicLower.includes('speaking')) {
    return '💬';
  }
  
  // Indian / Specific Regional topics
  if (topicLower.includes('india') || topicLower.includes('indian') || topicLower.includes('kingdom')) {
    return '🇮🇳';
  }

  // Time / Important Days topics
  if (topicLower.includes('day') || topicLower.includes('date') || topicLower.includes('calendar') || topicLower.includes('important days')) {
    return '📅';
  }

  // General Knowledge topics
  if (topicLower.includes('general') || topicLower.includes('gk') || topicLower.includes('knowledge') || topicLower.includes('trivia') || topicLower.includes('facts')) {
    return '🧠';
  }
  
  // Current Affairs topics
  if (topicLower.includes('current') || topicLower.includes('affairs') || topicLower.includes('news') || topicLower.includes('latest') || topicLower.includes('recent')) {
    return '📰';
  }
  
  // Default fallback to provided emoji or a general quiz emoji
  return emoji || '📝';
}

const HOME_CHIPS = ["General Knowledge", "Others"];

// Helper function to identify daily categories dynamically
const getDailyCategoryIds = (quizzes) => {
  const dailyIds = new Set();
  
  quizzes.forEach(category => {
    // Identify Quiz of the Day by topic or specific properties
    if (category.topic.toLowerCase().includes('quiz of the day') || 
        category.topic.toLowerCase().includes('daily quiz') ||
        category.categoryClass?.includes('daily-quiz')) {
      dailyIds.add(category.id);
    }
    
    // Identify Daily Current Affairs by topic or specific properties
    if (category.topic.toLowerCase().includes('current affairs') || 
        category.topic.toLowerCase().includes('daily current') ||
        category.categoryClass?.includes('current-affairs')) {
      dailyIds.add(category.id);
    }
  });
  
  return dailyIds;
};

const estimateTime = (numQuestions) => {
  const seconds = numQuestions * 18; // Avg 18s per question
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "< 1 min" : `~${minutes} mins`;
};

// Calculate progress for a category
const calculateProgress = (categoryId, totalQuestions) => {
  // This would normally come from user data/API
  // For demo, we'll use localStorage to simulate progress (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`quiz-progress-${categoryId}`);
      if (saved) {
        const { completed = 0, total = totalQuestions } = JSON.parse(saved);
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
  }
  return 0; // Default to 0% progress
};

// Helper function to extract or generate multiple topic-relevant questions for auto-refreshing preview
export function getCardQuestionsList(quiz, isHindi) {
  if (quiz?.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
    const formatted = quiz.questions.map(q => {
      const text = (isHindi && q.textHi) ? q.textHi : q.text;
      const opts = (isHindi && q.optionsHi && q.optionsHi.length > 0) ? q.optionsHi : q.options;
      if (text && opts && Array.isArray(opts) && opts.length >= 2) {
        return { text, options: opts };
      }
      return null;
    }).filter(Boolean);
    if (formatted.length > 0) return formatted;
  }

  const topicLower = (quiz?.topic || "").toLowerCase();
  
  if (topicLower.includes('bollywood') || topicLower.includes('movie') || topicLower.includes('cinema') || topicLower.includes('film')) {
    return isHindi ? [
      { text: "भारत की पहली मूक (Silent) फिल्म कौन सी थी?", options: ["आलम आरा", "राजा हरिश्चंद्र", "पुंडलिक", "किस्सा कुर्सी का"] },
      { text: "भारत की पहली बोलती फिल्म कौन सी थी?", options: ["आलम आरा", "राजा हरिश्चंद्र", "शोले", "मदर इंडिया"] },
      { text: "ऑस्कर पुरस्कार जीतने वाले प्रथम भारतीय कौन थे?", options: ["भानु अथैया", "सत्यजीत रे", "ए.आर. रहमान", "गुलजार"] },
      { text: "फिल्म 'शोले' के निर्देशक कौन थे?", options: ["रमेश सिप्पी", "यश चोपड़ा", "सुभाष घई", "करण जौहर"] }
    ] : [
      { text: "Which was India's first silent feature film?", options: ["Alam Ara", "Raja Harishchandra", "Pundalik", "Kissa Kursi Ka"] },
      { text: "Which was India's first sound motion picture?", options: ["Alam Ara", "Raja Harishchandra", "Sholay", "Mother India"] },
      { text: "Who was the first Indian to win an Oscar award?", options: ["Bhanu Athaiya", "Satyajit Ray", "A.R. Rahman", "Gulzar"] },
      { text: "Who directed the legendary movie 'Sholay'?", options: ["Ramesh Sippy", "Yash Chopra", "Subhash Ghai", "Karan Johar"] }
    ];
  }

  if (topicLower.includes('computer') || topicLower.includes('tech')) {
    return isHindi ? [
      { text: "कंप्यूटर सिस्टम में 'Cache' क्या है?", options: ["डेटा स्टोरेज", "तेज मेमोरी", "वायरस", "इनपुट डिवाइस"] },
      { text: "बाइनरी सिस्टम में कितने अंक होते हैं?", options: ["10", "8", "2", "16"] },
      { text: "कंप्यूटर के संदर्भ में 'ALU' का क्या अर्थ है?", options: ["Arithmetic Logic Unit", "Array Logic Unit", "Access List Unit", "All Logic Unit"] },
      { text: "कंप्यूटर में RAM की मुख्य भूमिका क्या है?", options: ["अस्थाई स्टोरेज", "स्थाई डेटा", "प्रोसेसिंग चिप", "डिस्प्ले कार्ड"] }
    ] : [
      { text: "What is 'Cache' in a computer system?", options: ["Data Storage", "High-speed Memory", "Virus", "Input Device"] },
      { text: "How many digits are used in the Binary System?", options: ["10", "8", "2", "16"] },
      { text: "What does 'ALU' stand for in computers?", options: ["Arithmetic Logic Unit", "Array Logic Unit", "Access List Unit", "All Logic Unit"] },
      { text: "What is the main function of RAM in a computer?", options: ["Temporary Storage", "Permanent Data", "Processing Unit", "Display Controller"] }
    ];
  }

  if (topicLower.includes('bio') || topicLower.includes('science') || topicLower.includes('chem') || topicLower.includes('phys')) {
    return isHindi ? [
      { text: "जीव जगत की मूलभूत क्रियात्मक इकाई क्या है?", options: ["कोशिका (Cell)", "ऊतक (Tissue)", "अंग (Organ)", "डीएनए (DNA)"] },
      { text: "मानव शरीर में सबसे बड़ी ग्रंथि कौन सी है?", options: ["यकृत (Liver)", "अग्न्याशय (Pancreas)", "थायरॉयड", "पीयूष ग्रंथि"] },
      { text: "प्रकाश संश्लेषण किस रंग के प्रकाश में सर्वाधिक होता है?", options: ["लाल प्रकाश", "हरा प्रकाश", "नीला प्रकाश", "पीला प्रकाश"] }
    ] : [
      { text: "What is the structural and functional unit of life?", options: ["Cell", "Tissue", "Organ", "DNA"] },
      { text: "Which is the largest gland in the human body?", options: ["Liver", "Pancreas", "Thyroid", "Pituitary"] },
      { text: "In which light color is photosynthesis most active?", options: ["Red Light", "Green Light", "Blue Light", "Yellow Light"] }
    ];
  }

  if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('medieval')) {
    return isHindi ? [
      { text: "भारत में प्रथम स्वतंत्रता संग्राम किस वर्ष हुआ था?", options: ["1857", "1947", "1920", "1942"] },
      { text: "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह नगर कौन सा था?", options: ["लोथल", "कालीबंगा", "हड़प्पा", "मोहनजोदड़ो"] },
      { text: "अशोक महान किस वंश के सम्राट थे?", options: ["मौर्य वंश", "गुप्त वंश", "कुषाण वंश", "शुंग वंश"] }
    ] : [
      { text: "In which year did the First War of Independence take place?", options: ["1857", "1947", "1920", "1942"] },
      { text: "Which was the major port town of Indus Valley Civilization?", options: ["Lothal", "Kalibangan", "Harappa", "Mohenjo-daro"] },
      { text: "Emperor Ashoka belonged to which dynasty?", options: ["Mauryan", "Gupta", "Kushan", "Shunga"] }
    ];
  }

  if (topicLower.includes('geography') || topicLower.includes('capital') || topicLower.includes('world') || topicLower.includes('map')) {
    return isHindi ? [
      { text: "क्षेत्रफल की दृष्टि से विश्व का सबसे बड़ा देश कौन सा है?", options: ["रूस (Russia)", "कनाडा (Canada)", "चीन (China)", "अमेरिका (USA)"] },
      { text: "भारत की सबसे लंबी नदी कौन सी है?", options: ["गंगा", "यमुना", "गोदावरी", "नर्मदा"] },
      { text: "विश्व का सबसे गहरा महासागर कौन सा है?", options: ["प्रशांत महासागर", "अटलांटिक महासागर", "हिंद महासागर", "आर्कटिक महासागर"] }
    ] : [
      { text: "Which is the largest country in the world by area?", options: ["Russia", "Canada", "China", "USA"] },
      { text: "Which is the longest river flowing in India?", options: ["Ganga", "Yamuna", "Godavari", "Narmada"] },
      { text: "Which is the deepest ocean in the world?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] }
    ];
  }

  if (topicLower.includes('math') || topicLower.includes('algebra') || topicLower.includes('number')) {
    return isHindi ? [
      { text: "संख्या 144 का वर्गमूल (Square Root) क्या होगा?", options: ["12", "14", "16", "144"] },
      { text: "पाई (π) का लगभग मान कितना होता है?", options: ["3.14", "2.14", "4.14", "1.41"] },
      { text: "सबसे छोटी अभाज्य संख्या (Prime Number) कौन सी है?", options: ["2", "1", "3", "0"] }
    ] : [
      { text: "What is the square root of 144?", options: ["12", "14", "16", "144"] },
      { text: "What is the approximate value of Pi (π)?", options: ["3.14", "2.14", "4.14", "1.41"] },
      { text: "Which is the smallest Prime Number?", options: ["2", "1", "3", "0"] }
    ];
  }

  if (topicLower.includes('sport') || topicLower.includes('cricket') || topicLower.includes('football')) {
    return isHindi ? [
      { text: "भारत ने पहला क्रिकेट विश्व कप किस वर्ष जीता था?", options: ["1983", "2011", "1975", "1992"] },
      { text: "ओलंपिक खेलों के प्रतीक चिन्ह में कितने छल्ले होते हैं?", options: ["5", "4", "6", "7"] },
      { text: "हॉकी के जादूगर के नाम से किसे जाना जाता है?", options: ["मेजर ध्यानचंद", "केडी सिंह", "बलबीर सिंह", "धनराज पिल्लै"] }
    ] : [
      { text: "In which year did India win its first Cricket World Cup?", options: ["1983", "2011", "1975", "1992"] },
      { text: "How many rings are there in the Olympic logo?", options: ["5", "4", "6", "7"] },
      { text: "Who is known as the Wizard of Hockey?", options: ["Major Dhyan Chand", "K.D. Singh", "Balbir Singh", "Dhanraj Pillay"] }
    ];
  }

  if (topicLower.includes('india') || topicLower.includes('bharat') || topicLower.includes('empire') || topicLower.includes('साम्राज्य') || topicLower.includes('भारत')) {
    return isHindi ? [
      { text: "मौर्य साम्राज्य की स्थापना किसने की थी?", options: ["चंद्रगुप्त मौर्य", "अशोक महान", "बिंदुसार", "चाणक्य"] },
      { text: "भारत का राष्ट्रीय प्रतीक कहाँ से लिया गया है?", options: ["सारनाथ", "सांची", "अजंता", "एलोरा"] },
      { text: "भारत में प्रथम जनगणना किस वर्ष हुई थी?", options: ["1872", "1901", "1947", "1951"] }
    ] : [
      { text: "Who founded the Mauryan Empire?", options: ["Chandragupta Maurya", "Ashoka", "Bindusara", "Chanakya"] },
      { text: "Where was the National Emblem of India adopted from?", options: ["Sarnath", "Sanchi", "Ajanta", "Ellora"] },
      { text: "In which year was the first Census conducted in India?", options: ["1872", "1901", "1947", "1951"] }
    ];
  }

  if (topicLower.includes('madhya pradesh') || topicLower.includes('mp gk') || topicLower.includes('state') || topicLower.includes('rajasthan') || topicLower.includes('up gk')) {
    return isHindi ? [
      { text: "मध्य प्रदेश की राजधानी क्या है?", options: ["भोपाल", "इंदौर", "ग्वालियर", "जबलपुर"] },
      { text: "सांची का स्तूप किस राज्य में स्थित है?", options: ["मध्य प्रदेश", "उत्तर प्रदेश", "बिहार", "गुजरात"] },
      { text: "खजुराहो के मंदिर किस वंश के शासकों ने बनवाए थे?", options: ["चंदेल वंश", "गुप्त वंश", "मौर्य वंश", "परमार वंश"] }
    ] : [
      { text: "What is the capital city of Madhya Pradesh?", options: ["Bhopal", "Indore", "Gwalior", "Jabalpur"] },
      { text: "In which state is the famous Sanchi Stupa located?", options: ["Madhya Pradesh", "Uttar Pradesh", "Bihar", "Gujarat"] },
      { text: "Which dynasty built the famous Khajuraho temples?", options: ["Chandela Dynasty", "Gupta Dynasty", "Mauryan Dynasty", "Paramara Dynasty"] }
    ];
  }

  if (topicLower.includes('mahabharat') || topicLower.includes('ramayan') || topicLower.includes('mythology') || topicLower.includes('वेद') || topicLower.includes('महाभारत')) {
    return isHindi ? [
      { text: "महाभारत का युद्ध कुरुक्षेत्र में कितने दिनों तक चला था?", options: ["18 दिन", "14 दिन", "21 दिन", "10 दिन"] },
      { text: "भगवद्गीता महाभारत के किस पर्व का अंश है?", options: ["भीष्म पर्व", "द्रोण पर्व", "कर्ण पर्व", "शांति पर्व"] },
      { text: "महाभारत के रचयिता कौन माने जाते हैं?", options: ["महर्षि वेदव्यास", "महर्षि वाल्मीकि", "तुलसीदास", "कालिदास"] }
    ] : [
      { text: "For how many days was the Kurukshetra War fought in Mahabharata?", options: ["18 Days", "14 Days", "21 Days", "10 Days"] },
      { text: "Bhagavad Gita is a part of which Parva of Mahabharata?", options: ["Bhishma Parva", "Drona Parva", "Karna Parva", "Shanti Parva"] },
      { text: "Who is considered the author of the great epic Mahabharata?", options: ["Sage Ved Vyasa", "Sage Valmiki", "Tulsidas", "Kalidasa"] }
    ];
  }

  return isHindi ? [
    { text: `${quiz?.topicHi || quiz?.topic || 'सामान्य ज्ञान'} से संबंधित महत्वपूर्ण प्रश्न: सही उत्तर क्या है?`, options: ["सत्य (True)", "असत्य (False)", "दोनों (Both)", "इनमें से कोई नहीं"] },
    { text: `${quiz?.topicHi || quiz?.topic || 'विषय'} का मुख्य और सबसे प्रसिद्ध तथ्य क्या है?`, options: ["तथ्य 1", "तथ्य 2", "तथ्य 3", "तथ्य 4"] }
  ] : [
    { text: `Key knowledge question from ${quiz?.topic || 'General Knowledge'}: Which statement is accurate?`, options: ["True", "False", "Both A & B", "None of these"] },
    { text: `Essential fact regarding ${quiz?.topic || 'this topic'}: Identify the correct option.`, options: ["Fact 1", "Fact 2", "Fact 3", "Fact 4"] }
  ];
}

// Stateful component that stays STATIC on desktop/website and ROTATES QUESTIONS ONLY ON MOBILE VIEW
const CardQuestionPreview = React.memo(({ quiz, isHindi }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const questionsList = useMemo(() => {
    return getCardQuestionsList(quiz, isHindi);
  }, [quiz, isHindi]);

  // AUTO ROTATE ONLY ON MOBILE VIEW! (Static on Desktop)
  useEffect(() => {
    if (!isMobile || questionsList.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % questionsList.length);
    }, 3600);

    return () => clearInterval(interval);
  }, [isMobile, questionsList.length]);

  const currentQ = questionsList[currentIndex] || questionsList[0];
  if (!currentQ) return null;

  return (
    <div style={{ margin: '8px 0 10px 0', minHeight: '106px', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isMobile ? currentIndex : "static-desktop"}
          initial={isMobile ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: -6 } : false}
          transition={{ duration: 0.35 }}
        >
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.45',
            fontWeight: '600'
          }}>
            {currentQ.text}
          </p>
          {currentQ.options && Array.isArray(currentQ.options) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {currentQ.options.slice(0, 4).map((opt, i) => (
                <div key={i} style={{
                  fontSize: '0.85rem',
                  padding: '8px 10px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
CardQuestionPreview.displayName = "CardQuestionPreview";

// Sub-section component for categorized quizzes
const SubSection = React.memo(({ title, quizzes, onViewAll, showMixCard, sectionName, onOpenMixModal, id, examMode, onModeChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const { data: session } = useSession();
  const { t, isHindi } = useLanguage();
  const [localSearch, setLocalSearch] = useState("");
  const [showAllChips, setShowAllChips] = useState(false);
  const [viewMode, setViewMode] = useState("compact");

  const filteredQuizzes = useMemo(() => {
    if (!localSearch.trim()) return quizzes || [];
    return (quizzes || []).filter(q => 
      (q.topic || "").toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.topicHi && q.topicHi.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [quizzes, localSearch]);

  const handleShare = useCallback((e, quiz) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/category/${quiz.slug || quiz.id}`;
    const text = `${quiz.topic} - ${quiz.questionCount || 0} questions`;

    async function shareLinkOnly() {
      if (navigator.share) {
        await navigator.share({ title: quiz.topic, text, url });
        return true;
      }
      await navigator.clipboard?.writeText(url);
      toast.success("Link copied");
      return true;
    }

    async function shareImageIfPossible() {
      if (!navigator.canShare) return false;
      // Minimal, reliable fallback: do not attempt image generation without a dedicated renderer
      return false;
    }

    (async () => {
      try {
        const didImage = await shareImageIfPossible();
        if (didImage) return;
        await shareLinkOnly();
      } catch {
        try {
          await shareLinkOnly();
        } catch {}
      }
    })();
  }, []);

  // Load favorites from server (signed-in users) or localStorage (guests)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (session?.user && !session.user.isAdmin) {
          const res = await fetch("/api/category-favourites?ids=1", { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          const ids = Array.isArray(data?.ids) ? data.ids : [];
          if (!cancelled) setFavorites(new Set(ids));
          return;
        }
      } catch {}

      try {
        const saved = localStorage.getItem("favorite_quizzes");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && !cancelled) setFavorites(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [session]);

  const toggleFavorite = useCallback((e, quizId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || session.user.isAdmin) {
      setShowSignInModal(true);
      return;
    }

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) next.delete(quizId);
      else next.add(quizId);
      return next;
    });

    fetch("/api/category-favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: quizId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.favourited === "boolean") {
          setFavorites((prev) => {
            const next = new Set(prev);
            if (data.favourited) next.add(quizId);
            else next.delete(quizId);
            return next;
          });
        }
      })
      .catch(() => {});
  }, [session]);

  // Get relevant icon for the sub-section
  const getTranslatedTopic = useCallback((topic, topicHi) => {
    let finalTopic = topic;
    if (isHindi && topicHi) {
      finalTopic = topicHi;
    } else if (isHindi) {
      // Fallback dictionary for common topics if topicHi is missing
      const fallbacks = {
        "General Knowledge": "सामान्य ज्ञान",
        "GK": "सामान्य ज्ञान",
        "India": "भारत",
        "World": "विश्व",
        "History": "इतिहास",
        "Sports": "खेल",
        "Computer": "कंप्यूटर",
        "Technology": "तकनीक",
        "Economy": "अर्थव्यवस्था",
        "Polity": "राजव्यवस्था",
        "Chemistry": "रसायन विज्ञान",
        "Physics": "भौतिकी",
        "Biology": "जीव विज्ञान",
        "Bollywood": "बॉलीवुड",
        "Entertainment": "मनोरंजन",
        "Others": "अन्य"
      };
      finalTopic = fallbacks[topic] || topic;
    }
    
    // Clean redundant "Section A: " prefixes
    return finalTopic ? finalTopic.replace(/^Section\s+[A-Z0-9]+:\s*/i, '').trim() : '';
  }, [isHindi]);

  const getSubSectionIcon = useCallback((title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('general knowledge') || titleLower.includes('gk')) return '🧠';
    if (titleLower.includes('india')) return '🇮🇳';
    if (titleLower.includes('world')) return '🌍';
    if (titleLower.includes('history')) return '📚';
    if (titleLower.includes('sports')) return '⚽';
    if (titleLower.includes('computer') || titleLower.includes('technology')) return '💻';
    if (titleLower.includes('economy')) return '💰';
    if (titleLower.includes('polity')) return '🏛️';
    if (titleLower.includes('chemistry')) return '⚗️';
    if (titleLower.includes('physics')) return '⚛️';
    if (titleLower.includes('biology')) return '🧬';
    if (titleLower.includes('bollywood') || titleLower.includes('entertainment')) return '🎬';
    if (titleLower.includes('company') || titleLower.includes('ceo')) return '🏢';
    if (titleLower.includes('others')) return '📋';
    
    return '📝'; // Default icon
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const router = useRouter();
  const handleLivePlay = useCallback((e, quizId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room...");
    router.push(`/live/${sessionId}?is_host=true${quizId ? `&categoryId=${quizId}` : ''}`);
  }, [router]);

  if (!quizzes || quizzes.length === 0) return null;

  return (
    <div className={styles.subSection} id={id}>
      <div 
        className={styles.subSectionContentWrapper}
        style={sectionName && sectionName !== "All Categories" ? { border: 'none', background: 'transparent', boxShadow: 'none', padding: '0', marginTop: '16px' } : {}}
      >
        
        {onModeChange && (
          <div className="flex justify-center w-full mb-4">
             <ExamModeSwitcher mode={examMode} onModeChange={onModeChange} isHindi={isHindi} compact={true} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          {String(title || "").trim().toLowerCase() !== "topics" && title !== sectionName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={styles.subSectionIcon}>{getSubSectionIcon(title)}</span>
              <h3 className={styles.subSectionTitle} style={{ fontSize: '1.1rem', margin: 0 }}>
                {getTranslatedTopic(title, null)}
                <span className={styles.subSectionCount}>({quizzes.length} {isHindi ? 'क्विज़' : 'Quizzes'})</span>
              </h3>
            </div>
          ) : <div />}

          {/* View Mode Switcher: Compact List vs Detailed Cards */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === "compact"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={isHindi ? "सूची दृश्य" : "Compact List View"}
            >
              <span>☰</span>
              <span>{isHindi ? "सूची" : "List"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === "detailed"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={isHindi ? "विस्तृत दृश्य" : "Detailed Preview Cards"}
            >
              <span>🎴</span>
              <span>{isHindi ? "विस्तृत" : "Cards"}</span>
            </button>
          </div>
        </div>

        {viewMode === "compact" ? (
          /* Compact Row Design System (Design 1 with Right-Side Play CTA) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
            {showMixCard && <MixPlayCard sectionName={sectionName} quizzes={quizzes} onOpenModal={onOpenMixModal} isCompact={true} />}
            {(filteredQuizzes || []).map((quiz) => {
              const fullTopicName = getTranslatedTopic(quiz.topic, quiz.topicHi);
              return (
                  <motion.div
                  key={quiz.id}
                  id={`quiz-card-${quiz.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
                  onClick={() => {
                    router.push(`/category/${quiz.slug || quiz.id}`);
                  }}
                  title={fullTopicName}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                      {quiz.image ? (
                        <img src={quiz.image} alt={quiz.topic} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        getRelevantImage(quiz.topic, quiz.emoji) || "📖"
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate"
                        title={fullTopicName}
                      >
                        {fullTopicName}
                      </h4>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                        {sectionName || title || "Topics"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                      {quiz.questionCount || 0} Qs
                    </span>

                    <button
                      type="button"
                      className="px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-indigo-500/25 hover:scale-105 transition-all flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/category/${quiz.slug || quiz.id}`);
                      }}
                    >
                      <span>{isHindi ? "क्विज़ खेलें" : "Play Quiz"}</span>
                      <span className="text-xs font-bold">→</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Detailed Preview Card Grid */
          <div className={styles.subSectionGrid}>
            {showMixCard && <MixPlayCard sectionName={sectionName} quizzes={quizzes} onOpenModal={onOpenMixModal} />}
            {(filteredQuizzes || []).map((quiz) => (
              <motion.div
                key={quiz.id}
                id={`quiz-card-${quiz.id}`}
                className={styles.subSectionCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  onClick={(e) => {
                    // Prevent navigation if clicking on buttons
                    if (e.target.closest('button')) return;
                    router.push(`/category/${quiz.slug || quiz.id}`);
                  }}
                  className={styles.subSectionCardLink}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.subSectionCardImage}>
                    {quiz.image ? (
                      <img 
                        src={quiz.image} 
                        alt={quiz.topic} 
                        className={styles.subSectionCardImg}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.subSectionCardEmoji}>
                        {getRelevantImage(quiz.topic, quiz.emoji)}
                      </span>
                    )}
                    <div className={styles.cardActions}>
                      <button 
                        className={`${styles.favoriteBtn} ${favorites.has(quiz.id) ? styles.isFavorite : ''}`}
                        onClick={(e) => toggleFavorite(e, quiz.id)}
                        title={favorites.has(quiz.id) ? (t('common.removeFav') || "Remove from favorites") : (t('common.addFav') || "Add to favorites")}
                      >
                        <Heart size={16} fill={favorites.has(quiz.id) ? "currentColor" : "none"} />
                      </button>
                      <button
                        className={styles.shareBtn}
                        onClick={(e) => handleShare(e, quiz)}
                        title={t('common.share') || "Share"}
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.subSectionCardContent}>
                    <h4 className={styles.subSectionCardTitle}>{getTranslatedTopic(quiz.topic, quiz.topicHi)}</h4>
                    
                    <div className={styles.subSectionCardFooter}>
                      <span className={styles.subSectionCardCount}>
                        📝 {quiz.questionCount || 0}+ {isHindi ? 'प्रश्न' : 'Questions'}
                      </span>
                    </div>

                    {/* Featured Question & 4 Options Preview */}
                    <CardQuestionPreview quiz={quiz} isHindi={isHindi} />

                    <div className={styles.setCardActions}>
                      <button
                        className={styles.playQuizButton}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/category/${quiz.slug || quiz.id}`;
                        }}
                        aria-label={`${t('quizzes.cards.playQuiz')} ${quiz.topic}`}
                      >
                        {t('quizzes.cards.playQuiz')}
                      </button>
                      <button
                        className={`${styles.liveButtonStyle} ${styles.liveButtonOutline}`}
                        onClick={(e) => handleLivePlay(e, quiz.id)}
                        title={t('quizzes.cards.playWithFriends') || "Play with friends"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        {t('quizzes.cards.playLive')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
SubSection.displayName = "SubSection";

// Function to categorize quizzes based on sections
function categorizeQuizzes(quizzes, sections) {
  const sectionMap = new Map();
  const matchedQuizIds = new Set();
  
  (sections || []).forEach(section => {
    const nameKey = (section.name || "").trim();
    if (!nameKey) return;

    if (!sectionMap.has(nameKey)) {
      sectionMap.set(nameKey, {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        subSections: []
      });
    }

    const sectionData = sectionMap.get(nameKey);
    
    (section.subSections || []).forEach(subSection => {
      const quizIds = subSection.quizIds || [];
      const subSectionQuizzes = quizzes.filter(quiz => quizIds.includes(quiz.id));
      
      if (subSectionQuizzes.length > 0) {
        subSectionQuizzes.forEach(q => matchedQuizIds.add(q.id));

        const subTitleKey = (subSection.name || "").trim();
        const existingSub = sectionData.subSections.find(s => (s.title || "").trim() === subTitleKey);
        
        if (existingSub) {
          const existingIds = new Set(existingSub.quizzes.map(q => q.id));
          subSectionQuizzes.forEach(q => {
            if (!existingIds.has(q.id)) existingSub.quizzes.push(q);
          });
        } else {
          sectionData.subSections.push({
            title: subSection.name,
            titleHi: subSection.nameHi,
            quizzes: [...subSectionQuizzes],
            order: subSection.order
          });
        }
      }
    });
  });

  const categorized = Array.from(sectionMap.values()).filter(s => s.subSections.length > 0);
  categorized.forEach(s => s.subSections.sort((a, b) => a.order - b.order));

  // Collect quizzes that are not in any section
  const uncategorized = quizzes.filter(quiz => !matchedQuizIds.has(quiz.id));
  if (uncategorized.length > 0) {
    const imageQuizzes = uncategorized.filter(q => q.categoryClass?.includes("image-quiz"));
    const govtQuizzes = uncategorized.filter(q => q.categoryClass?.includes("govt-exam"));
    const others = uncategorized.filter(q => !q.categoryClass?.includes("image-quiz") && !q.categoryClass?.includes("govt-exam"));

    if (imageQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_image",
        name: "Image Quizzes",
        nameHi: "चित्र क्विज़",
        subSections: [{
          title: "Image Categories",
          titleHi: "चित्र श्रेणियां",
          quizzes: imageQuizzes,
          order: 998
        }]
      });
    }

    if (govtQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_govt",
        name: "Govt Exam Preparation",
        nameHi: "सरकारी परीक्षा की तैयारी",
        subSections: [{
          title: "Govt Exams",
          titleHi: "सरकारी परीक्षा",
          quizzes: govtQuizzes,
          order: 999
        }]
      });
    }

    if (others.length > 0) {
      categorized.push({
        id: "uncategorized_others",
        name: "Indian State GK",
        nameHi: "भारतीय राज्य जीके",
        subSections: [{
          title: "Indian State GK",
          titleHi: "भारतीय राज्य जीके",
          quizzes: others,
          order: 1000
        }]
      });
    }
  }
  
  return categorized;
}

// Main Category Section component
const MainCategorySection = React.memo(({ section, sectionIds, onOpenMixModal, isFirstSection, examMode, onModeChange, index }) => {
  const { isHindi } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const subSections = section.subSections || [];
  
  if (subSections.length === 0) return null;

  const totalQuizzesCount = subSections.reduce((acc, sub) => acc + (sub.quizzes?.length || 0), 0);
  const sectionDisplayName = isHindi && section.nameHi ? section.nameHi : section.name;

  const totalQuestions = subSections.reduce((acc, sub) => acc + (sub.quizzes?.reduce((qAcc, q) => qAcc + (q.questionCount || 0), 0) || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-6" id={sectionIds?.[section.name] || undefined}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-lg flex-shrink-0">
            {(index !== undefined ? index + 1 : 1)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {sectionDisplayName}
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {subSections.length} {isHindi ? "अध्याय" : "Chapters"} • ~
              {totalQuizzesCount} {isHindi ? "क्विज़" : "Quizzes"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-900">
            {totalQuizzesCount} {isHindi ? "क्विज़" : "Quizzes"}
          </span>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`text-slate-400 transition-transform duration-300 ${!isExpanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 p-4 sm:p-6">
          {subSections.map((subSection, idx) => (
            <SubSection
              key={subSection.title}
              id={sectionIds?.[subSection.title] || undefined}
              title={isHindi && subSection.titleHi ? subSection.titleHi : subSection.title}
              quizzes={subSection.quizzes}
              showMixCard={isFirstSection && idx === 0}
              sectionName={section.name}
              onOpenMixModal={onOpenMixModal}
              examMode={idx === 0 ? examMode : undefined}
              onModeChange={idx === 0 ? onModeChange : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
});
MainCategorySection.displayName = "MainCategorySection";

export default function LandingPage({ initialCategories = [], defaultAudienceTab = "regular", defaultExamMode = "read" }) {
  const { data: session } = useSession();
  const { settings, loaded, quizzes } = useData();
  const { openOnboarding } = useUI();
  const { t, isHindi } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams?.get("tab");
  const modeQuery = searchParams?.get("mode");
  const catQuery = searchParams?.get("cat") || searchParams?.get("chapter") || searchParams?.get("topic");

  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const initialAudienceTab = tabQuery || defaultAudienceTab;
  const [audienceTab, setAudienceTab] = useState(initialAudienceTab); // "regular" | "govt" | "image"
  const [examMode, setExamMode] = useState(modeQuery || (initialAudienceTab === "regular" ? "quiz" : "read")); // "read" | "quiz"
  const [selectedReadChapter, setSelectedReadChapter] = useState(null);
  const [selectedChipFilter, setSelectedChipFilter] = useState("all");
  const quizSectionRef = useRef(null);

  const scrollToQuizzes = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select chapter in Read Mode if cat parameter is present in URL
  useEffect(() => {
    if (catQuery) {
      const targetQuery = catQuery.toLowerCase().trim();
      const allSource = Array.isArray(quizzes) && quizzes.length > 0 ? quizzes : (initialCategories || []);

      let matched = null;
      for (const cat of allSource) {
        if (
          (cat.slug && cat.slug.toLowerCase() === targetQuery) ||
          (cat.id && cat.id.toLowerCase() === targetQuery) ||
          (cat.topic && cat.topic.toLowerCase() === targetQuery) ||
          (cat.name && cat.name.toLowerCase() === targetQuery)
        ) {
          matched = cat;
          break;
        }
        if (Array.isArray(cat.subCategories)) {
          const subMatch = cat.subCategories.find(sub => 
            (sub.slug && sub.slug.toLowerCase() === targetQuery) ||
            (sub.id && sub.id.toLowerCase() === targetQuery) ||
            (sub.topic && sub.topic.toLowerCase() === targetQuery) ||
            (sub.name && sub.name.toLowerCase() === targetQuery) ||
            (sub.title && sub.title.toLowerCase() === targetQuery)
          );
          if (subMatch) {
            matched = subMatch;
            break;
          }
        }
      }

      if (matched) {
        setSelectedReadChapter(matched);
        setExamMode("read");
      } else {
        // Fallback: Fetch category details directly from API if missing from initial SSR bundle
        fetch(`/api/categories/${encodeURIComponent(catQuery)}?full=true`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && !data.error) {
              setSelectedReadChapter(data);
              setExamMode("read");
            }
          })
          .catch(err => console.error("Failed to fetch read chapter:", err));
      }
    }
  }, [catQuery, quizzes, initialCategories]);
  
  // New state for paginated data
  const [visibleCategories, setVisibleCategories] = useState(initialCategories);
  const [totalCategories, setTotalCategories] = useState(initialCategories.length || 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 12;

  // Debounced search logic
  const debouncedSearchHandler = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 500),
    []
  );

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    debouncedSearchHandler(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.trim().length > 0);
  }, [debouncedSearchHandler]);

  // Fetch sections from DB
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections', { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setSectionsLoaded(true);
      }
    };
    fetchSections();
  }, []);

  const [activeFilters, setActiveFilters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sortBy, setSortBy] = useState("default"); // default, newest, popular, alphabetical
  const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, easy, medium, hard
  const [questionCountFilter, setQuestionCountFilter] = useState("all"); // all, small, medium, large
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [userInterestsCount, setUserInterestsCount] = useState(0);
  const [userInterests, setUserInterests] = useState([]);

  // Check for interests on load
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/interests")
        .then(r => r.json())
        .then(data => {
          const interests = data.interestedCategories || [];
          setUserInterests(interests);
          setUserInterestsCount(interests.length);
          if (interests.length > 0) {
            setIsPersonalized(true); // Default to personalized if they have interests
          } else {
            const hasSeen = localStorage.getItem(`has_seen_onboarding_${session.user.id}`);
            if (!hasSeen) {
              openOnboarding();
              localStorage.setItem(`has_seen_onboarding_${session.user.id}`, "true");
            }
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id, openOnboarding]);

  const [userProgress, setUserProgress] = useState({});
  const [previewCategory, setPreviewCategory] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Mixed Mode State
  const [showMixModal, setShowMixModal] = useState(false);
  const [activeMixSection, setActiveMixSection] = useState(null);

  const handleOpenMixModal = useCallback((sectionName) => {
    setActiveMixSection(sectionName);
    setShowMixModal(true);
  }, []);

  // Fetch paginated categories
  const fetchCategories = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setVisibleCategories([]); // Clear immediately for visual feedback
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const skip = (currentPage - 1) * itemsPerPage;
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        search: debouncedSearch,
        sortBy: sortBy,
        difficulty: difficultyFilter,
        questionCount: questionCountFilter,
        chips: activeFilters.join(","),
        personalized: isPersonalized.toString()
      });

      const res = await fetch(`/api/categories?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setVisibleCategories(data.categories || []);
        } else {
          setVisibleCategories(prev => [...prev, ...(data.categories || [])]);
        }
        setTotalCategories(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  useEffect(() => {
    fetchCategories(true);
  }, [debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchCategories(false);
    }
  }, [page]);

  // Cleanup effect for any timers or animations
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector(`.${styles.heroSearchWrapper}`);
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
      
      const advancedFiltersPanel = document.querySelector(`.${styles.advancedFiltersPanel}`);
      if (advancedFiltersPanel && showAdvancedFilters && !advancedFiltersPanel.contains(event.target)) {
        const advancedFiltersToggle = document.querySelector(`.${styles.advancedFiltersToggle}`);
        if (advancedFiltersToggle && !advancedFiltersToggle.contains(event.target)) {
          setShowAdvancedFilters(false);
        }
      }
    };

    // Keyboard navigation handler
    const handleKeyDown = (event) => {
      // Escape key closes dropdowns and filters
      if (event.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        if (showAdvancedFilters) {
          setShowAdvancedFilters(false);
        }
      }
      
      // Tab navigation for cards
      if (event.key === 'Tab' && !event.shiftKey) {
        const focusableElements = document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAdvancedFilters]);

  // Debounced search effect
  useEffect(() => {
    if (!search.trim()) {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      // Generate search suggestions from available categories
      const suggestions = quizzes
        .filter(cat => 
          cat.topic.toLowerCase().includes(search.toLowerCase()) ||
          cat.description.toLowerCase().includes(search.toLowerCase()) ||
          (Array.isArray(cat.chips) && cat.chips.some((chip) => String(chip || "").toLowerCase().includes(search.toLowerCase())))
        )
        .slice(0, 12) // Limit to 12 suggestions
        .map(cat => ({
          id: cat.id,
          slug: cat.slug,
          topic: cat.topic,
          description: cat.description,
          emoji: cat.emoji
        }));
      
      setSearchSuggestions(suggestions);
      setIsSearching(false);
    }, 300); // Debounce search for 300ms

    return () => clearTimeout(timer);
  }, [search, quizzes]);

  const handleFilterClick = useCallback((filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = searchSuggestions[selectedSuggestionIndex];
          setSearch(selectedSuggestion.topic);
          setDebouncedSearch(selectedSuggestion.topic);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          router.push(`/category/${selectedSuggestion.slug || selectedSuggestion.id}`);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex, router]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearch(suggestion.topic);
    setDebouncedSearch(suggestion.topic);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    router.push(`/category/${suggestion.slug || suggestion.id}`);
  }, [router]);

  const handlePreviewClick = useCallback((category) => {
    setPreviewCategory(category);
    setShowPreviewModal(true);
  }, []);

  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewCategory(null);
  }, []);

  const chips = useMemo(() => HOME_CHIPS, []);



  const allQuizzesSource = useMemo(() => {
    return Array.isArray(quizzes) && quizzes.length > 0 ? quizzes : (initialCategories || []);
  }, [quizzes, initialCategories]);

  const dailyCategoryIds = useMemo(() => getDailyCategoryIds(allQuizzesSource), [allQuizzesSource]);
  
  const baseFilteredCategories = useMemo(() => {
    const activeQuizzes = allQuizzesSource;
    let list = activeQuizzes.filter((c) => !c.hidden && !dailyCategoryIds.has(c.id));
    
    // Apply Personalization to the base list if active
    if (isPersonalized && userInterests.length > 0) {
      list = list.filter(c => userInterests.includes(c.id));
    } else {
      // First, find all parent IDs that have showSubCategoriesOnHome set to true
      const parentIdsShowingSubCategories = new Set(
        activeQuizzes.filter(q => q.showSubCategoriesOnHome).map(q => q.id)
      );
      // If not personalized, only show top-level categories, those marked for home, OR subcategories whose parent is marked
      list = list.filter(c => !c.parentId || c.showSubCategoriesOnHome || parentIdsShowingSubCategories.has(c.parentId));
    }

    // Apply Advanced Filters to the main view as well
    if (difficultyFilter !== "all") {
      list = list.filter(c => c.questions?.some(q => q.difficulty === difficultyFilter));
    }
    
    if (questionCountFilter !== "all") {
      list = list.filter(c => {
        const count = c.questions?.length || 0;
        if (questionCountFilter === "small") return count >= 1 && count <= 10;
        if (questionCountFilter === "medium") return count >= 11 && count <= 25;
        if (questionCountFilter === "large") return count >= 26;
        return true;
      });
    }

    if (sortBy === "alphabetical") {
      list = [...list].sort((a, b) => a.topic.localeCompare(b.topic));
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    }

    return list;
  }, [allQuizzesSource, dailyCategoryIds, difficultyFilter, questionCountFilter, sortBy, isPersonalized, userInterests]);

  const isGovtSection = useCallback((section) => {
    if (!section) return false;
    const nameStr = typeof section === 'string' ? section : (section.name || "");
    const name = String(nameStr).toLowerCase();
    
    if (name.includes("govt") || name.includes("exam") || name.includes("सरकारी") || name.includes("परीक्षा")) {
      return true;
    }

    if (typeof section === 'object' && section.subSections) {
      for (const sub of section.subSections) {
        const subName = String(sub.title || "").toLowerCase();
        if (subName.includes("govt") || subName.includes("exam") || subName.includes("सरकारी") || subName.includes("परीक्षा")) {
          return true;
        }
        if (sub.quizzes) {
          for (const q of sub.quizzes) {
            if (q.categoryClass && q.categoryClass.includes("govt-exam")) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, []);

  const isImageSection = useCallback((sectionName) => {
    if (!sectionName) return false;
    const name = String(sectionName).toLowerCase();
    return name.includes("image") || name.includes("चित्र");
  }, []);

  const allCategorizedQuizzes = useMemo(() => {
    const list = categorizeQuizzes(baseFilteredCategories, sections);
    const othersIndex = list.findIndex(s => 
      s.name && (
        s.name.toLowerCase() === 'others' || 
        s.name.toLowerCase().includes('others') ||
        s.name.includes('अन्य')
      )
    );
    if (othersIndex > -1) {
      const [othersSection] = list.splice(othersIndex, 1);
      list.push(othersSection);
    }
    return list;
  }, [baseFilteredCategories, sections]);

  const sectionIds = useMemo(() => {
    const ids = {};
    (allCategorizedQuizzes || []).forEach((s) => {
      const key = String(s?.name || "").trim();
      if (!key) return;
      ids[key] = `section-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    });
    return ids;
  }, [allCategorizedQuizzes]);

  const scrollToSection = useCallback((sectionName) => {
    const id = sectionIds[sectionName];
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    // Add offset for fixed header if present
    const headerOffset = 100;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
    return true;
  }, [sectionIds]);

  const handleHomeChipClick = useCallback((chip) => {
    const list = (sections || []).map((s) => String(s?.name || "")).filter(Boolean);
    if (list.length === 0) return;

    const isGk = (name) => {
      const n = String(name || "").toLowerCase();
      return n.includes("general knowledge") || n === "gk" || n.includes(" gk") || n.includes("gk ");
    };

    let target = null;
    if (chip === "General Knowledge") {
      target = list.find(isGk) || null;
    } else {
      target = list.find((n) => !isGk(n)) || null;
    }

    if (target) {
      const ok = scrollToSection(target);
      if (!ok) {
        // fallback: jump near main list
        document.querySelector(`.${styles.allSubSections}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [sections, scrollToSection]);

  const categorizedQuizzes = useMemo(() => {
    if (audienceTab === "govt") {
      return allCategorizedQuizzes.filter(s => isGovtSection(s));
    }
    if (audienceTab === "image") {
      return allCategorizedQuizzes.filter(s => isImageSection(s.name));
    }
    return allCategorizedQuizzes.filter(s => !isGovtSection(s) && !isImageSection(s.name));
  }, [allCategorizedQuizzes, audienceTab, isGovtSection, isImageSection]);

  const regularCount = useMemo(() => {
    const regularSections = allCategorizedQuizzes.filter(s => !isGovtSection(s) && !isImageSection(s.name));
    return regularSections.reduce((acc, sec) => acc + sec.subSections.reduce((sAcc, sub) => sAcc + (sub.quizzes?.length || 0), 0), 0);
  }, [allCategorizedQuizzes, isGovtSection, isImageSection]);

  const govtCount = useMemo(() => {
    const govtSections = allCategorizedQuizzes.filter(s => isGovtSection(s));
    return govtSections.reduce((acc, sec) => acc + sec.subSections.reduce((sAcc, sub) => sAcc + (sub.quizzes?.length || 0), 0), 0);
  }, [allCategorizedQuizzes, isGovtSection]);

  const imageCount = useMemo(() => {
    const imageSections = allCategorizedQuizzes.filter(s => isImageSection(s.name));
    return imageSections.reduce((acc, sec) => acc + sec.subSections.reduce((sAcc, sub) => sAcc + (sub.quizzes?.length || 0), 0), 0);
  }, [allCategorizedQuizzes, isImageSection]);

  const sectionChipsData = useMemo(() => {
    const allAvailable = (quizzes && quizzes.length > 0) ? quizzes : (initialCategories || []);
    
    // Count image quizzes with at least 1 question
    const imageCountVal = allAvailable.filter(c => 
      !c.hidden &&
      (c.isImageQuiz || c.categoryClass?.includes("image-quiz") || c.topic?.toLowerCase().includes("image") || c.name?.toLowerCase().includes("image")) &&
      ((c.questionCount ?? c.questions?.length ?? 0) > 0)
    ).length;

    let baseChips = categorizedQuizzes.map(section => {
      const validQuizzes = section.subSections.reduce((acc, sub) => {
        const subValid = (sub.quizzes || []).filter(q => (q.questionCount ?? q.questions?.length ?? 0) > 0);
        return acc + subValid.length;
      }, 0);
      return {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        count: validQuizzes
      };
    }).filter(s => s.count > 0);

    // Insert Image Quiz chip right before "Others" (or at the end if Others doesn't exist)
    const imageChip = {
      id: "Image Quiz",
      name: "Image Quiz",
      nameHi: "चित्र क्विज़",
      count: imageCountVal
    };

    const othersIndex = baseChips.findIndex(s => s.name?.toLowerCase().includes("others") || s.nameHi?.includes("अन्य"));
    if (othersIndex > -1) {
      baseChips.splice(othersIndex, 0, imageChip);
    } else {
      baseChips.push(imageChip);
    }

    return baseChips;
  }, [categorizedQuizzes, quizzes, initialCategories]);

  const govtChaptersList = useMemo(() => {
    if (audienceTab !== "govt") return [];
    const list = [];
    categorizedQuizzes.forEach((sec) => {
      (sec.subSections || []).forEach((sub) => {
        if (sub.quizzes && sub.quizzes.length > 0) {
          sub.quizzes.forEach((q) => {
            if ((q.questionCount ?? q.questions?.length ?? 0) > 0) list.push(q);
          });
        } else if ((sub.questionCount ?? sub.questions?.length ?? 0) > 0) {
          list.push(sub);
        }
      });
    });
    return list;
  }, [categorizedQuizzes, audienceTab]);

  const displayedMasterCategories = useMemo(() => {
    const allAvailable = (quizzes && quizzes.length > 0) ? quizzes : (initialCategories || []);
    
    // MANDATORY RULE: Hide categories that have 0 questions by default
    let list = allAvailable.filter(c => {
      if (c.hidden) return false;
      const qCount = c.questionCount ?? c.questions?.length ?? 0;
      return qCount > 0;
    });

    if (selectedChipFilter === "Image Quiz") {
      list = list.filter(q => 
        q.isImageQuiz || 
        q.categoryClass?.includes("image-quiz") || 
        (q.topic && q.topic.toLowerCase().includes("image")) ||
        (q.name && q.name.toLowerCase().includes("image"))
      );
    } else if (selectedChipFilter !== "all") {
      const targetSection = (categorizedQuizzes || []).find(s => s.name === selectedChipFilter || s.id === selectedChipFilter);
      if (targetSection && Array.isArray(targetSection.subSections)) {
        const sectionQuizzes = [];
        targetSection.subSections.forEach(sub => {
          if (Array.isArray(sub.quizzes)) {
            sectionQuizzes.push(...sub.quizzes.filter(q => (q.questionCount ?? q.questions?.length ?? 0) > 0));
          }
        });
        if (sectionQuizzes.length > 0) list = sectionQuizzes;
      } else {
        const query = selectedChipFilter.toLowerCase();
        list = list.filter(q => 
          (q.topic && q.topic.toLowerCase().includes(query)) || 
          (q.topicHi && q.topicHi.toLowerCase().includes(query))
        );
      }
    }

    if (search && search.trim()) {
      const sQuery = search.toLowerCase().trim();
      list = list.filter(q => 
        (q.topic && q.topic.toLowerCase().includes(sQuery)) ||
        (q.topicHi && q.topicHi.toLowerCase().includes(sQuery)) ||
        (q.description && q.description.toLowerCase().includes(sQuery))
      );
    }

    return list;
  }, [quizzes, initialCategories, categorizedQuizzes, selectedChipFilter, search]);

  return (
    <main className={styles.page}>
      {/* Background Glowing Ambient Light Orbs */}
      <div className={styles.bgOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.orb} ${styles.orb4}`} />
      </div>

      {/* ONE BIG MASTER CONTAINER - DATA EXPERT DESIGN OVERHAUL */}
      <motion.section 
        className="w-full max-w-6xl mx-auto my-6 px-3 sm:px-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* 1. Header Bar */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">
                <Sparkles size={14} />
                <span>{isHindi ? "मास्टर क्विज़ सूचकांक" : "Master Quiz Index"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isHindi ? "सभी क्विज़ एवं अध्ययन विषय" : "All Quizzes & Study Index"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                ✨ {displayedMasterCategories.length} {isHindi ? "विषय उपलब्ध" : "Topics Available"}
              </span>
              {session?.user && (
                <button 
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  onClick={openOnboarding}
                  title={t('banners.personalized.btn') || "Personalize"}
                >
                  <SlidersHorizontal size={18} />
                </button>
              )}
            </div>
          </div>

          {/* 2. STICKY CONTROL BAR: SEARCH BAR + QUIZ MODE / READ MODE TAB (FIXED ON SCROLL) */}
          <div className="sticky top-14 sm:top-16 z-50 py-3 px-3 sm:px-6 -mx-6 sm:-mx-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y border-slate-200/80 dark:border-slate-800 shadow-sm transition-all mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
              
              {/* Search Bar (Left / Center) */}
              <div className="relative flex-1 w-full z-50">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400" />
                  <input
                    id="search-box"
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setShowSuggestions(search.trim().length > 0 && searchSuggestions.length > 0)}
                    disabled={loading}
                    placeholder={
                      loading 
                        ? (t('common.searching') || "Searching...") 
                        : (isHindi ? "विषय या क्विज़ का नाम खोजें (उदा. एमपी जीके, इतिहास, रसायन)..." : "Search quiz name or topic (e.g. Madhya Pradesh, History)...")
                    }
                    className="w-full pl-12 pr-20 py-3 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500/60 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 rounded-2xl text-sm font-bold shadow-inner transition-all"
                  />
                  {search.trim() ? (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300/50 dark:border-slate-700">
                      ⌘K
                    </span>
                  )}

                  {/* Autocomplete Dropdown - Z-50 Layer OVER Everything */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="text-2xl">{suggestion.emoji || "📝"}</span>
                          <div className="flex-1 min-w-0">
                            <strong className="block text-sm font-bold text-slate-900 dark:text-white truncate">
                              {isHindi && suggestion.topicHi ? suggestion.topicHi : suggestion.topic}
                            </strong>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {suggestion.questionCount || 0} {isHindi ? 'प्रश्न' : 'Questions'}
                            </span>
                          </div>
                          <ArrowRight size={16} className="text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Mode vs Read Mode Switcher (Right) */}
              <div className="w-full md:w-auto flex-shrink-0">
                <ExamModeSwitcher 
                  mode={examMode} 
                  onModeChange={(newMode) => {
                    setExamMode(newMode);
                    setSelectedReadChapter(null);
                  }}
                  isHindi={isHindi} 
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* 3. Section Chips Directly Below Search Bar (Z-20 layer below z-50 search dropdown) */}
          <div className="relative z-20 max-w-4xl mx-auto mb-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 justify-center flex-wrap">
              <button
                onClick={() => setSelectedChipFilter("all")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex-shrink-0 ${
                  selectedChipFilter === "all"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                <span>🌟 {isHindi ? "सभी विषय" : "All Topics"}</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                  selectedChipFilter === "all" ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300"
                }`}>
                  {displayedMasterCategories.length}
                </span>
              </button>

              {sectionChipsData.map((s) => {
                const rawName = isHindi && s.nameHi ? s.nameHi : s.name;
                const cleanName = rawName ? rawName.replace(/^Section\s+[A-Z0-9]+:\s*/i, '').trim() : '';
                const isSelected = selectedChipFilter === s.name;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedChipFilter(isSelected ? "all" : s.name)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex-shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200/60 dark:border-slate-700"
                    }`}
                  >
                    <span>{s.id === "Image Quiz" ? "🖼️ " : ""}{cleanName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                      isSelected ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300"
                    }`}>
                      {s.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Organised Categories Inside The Big Card */}
          {examMode === "read" ? (
            <div className="relative z-10 mt-6">
              {selectedReadChapter ? (
                <DigitalBookReader
                  chapter={selectedReadChapter}
                  subject={selectedReadSubject}
                  initialPage={Number(searchParams?.get("set") || searchParams?.get("page")) || 1}
                  onBackToIndex={() => setSelectedReadChapter(null)}
                  isHindi={isHindi}
                  allChapters={govtChaptersList}
                  onSelectChapter={(chap, subj) => {
                    setSelectedReadChapter(chap);
                    if (subj) setSelectedReadSubject(subj);
                  }}
                />
              ) : (
                <SubjectIndexTree
                  sections={categorizedQuizzes}
                  onSelectChapter={(chap, subj) => {
                    setSelectedReadChapter(chap);
                    setSelectedReadSubject(subj);
                  }}
                  isHindi={isHindi}
                  examMode={examMode}
                  onModeChange={(newMode) => {
                    setExamMode(newMode);
                    setSelectedReadChapter(null);
                  }}
                  searchTerm={search}
                />
              )}
            </div>
          ) : (
            <div className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                {displayedMasterCategories.map((cat) => {
                  const title = (isHindi && cat.topicHi) ? cat.topicHi : cat.topic;
                  const desc = (isHindi && cat.descriptionHi) ? cat.descriptionHi : cat.description;
                  const qCount = cat.questionCount || cat.questions?.length || 0;
                  const setCount = Math.max(1, Math.ceil(qCount / 20));

                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => router.push(`/category/${cat.slug || cat.id}`)}
                      className="group cursor-pointer bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="w-12 h-12 rounded-2xl bg-indigo-100/60 dark:bg-indigo-900/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            {cat.emoji || getRelevantImage(cat.topic || "", "") || "📝"}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black border border-indigo-100 dark:border-indigo-900/50">
                            {qCount} {isHindi ? 'प्रश्न' : 'Qs'}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {title}
                        </h3>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {desc || (isHindi ? "अभ्यास करें और अपनी तैयारी को बेहतर बनाएं।" : "Practice now to boost your test score.")}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          🧩 {setCount} {isHindi ? 'सेट्स उपलब्ध' : 'Sets Available'}
                        </span>
                        
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 group-hover:translate-x-1 transition-all">
                          <span>{isHindi ? "खेलें" : "Play"}</span>
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {displayedMasterCategories.length === 0 && (
                <div className="text-center py-16">
                  <span className="text-4xl">🔍</span>
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-3">
                    {isHindi ? "कोई क्विज़ श्रेणी नहीं मिली" : "No matching quiz categories found"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHindi ? "कृपया कोई अन्य खोज शब्द या फ़िल्टर आज़माएं।" : "Try searching for a different keyword or reset filters."}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.section>

      <MixQuizModal 
        isOpen={showMixModal} 
        onClose={() => setShowMixModal(false)} 
        sectionName={activeMixSection} 
      />

      {!loading && visibleCategories.length === 0 && (search || activeFilters.length > 0) && (
        <p className={styles.empty}>
          {t('quizzes.sections.noMatch')}
        </p>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewCategory && (
        <div className={styles.modalOverlay} onClick={closePreviewModal}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.modalEmoji}>{previewCategory.emoji || '📝'}</span>
                {isHindi && previewCategory.topicHi ? previewCategory.topicHi : previewCategory.topic}
              </h3>
              <button 
                className={styles.modalClose}
                onClick={closePreviewModal}
                aria-label="Close preview modal"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📊 {t('modals.preview.stats')}</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Questions</span>
                    <span className={styles.statValue}>{previewCategory.questions?.length || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Est. Time</span>
                    <span className={styles.statValue}>{estimateTime(previewCategory.questions?.length || 0)}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Progress</span>
                    <span className={styles.statValue}>
                      {calculateProgress(previewCategory.id, previewCategory.questions?.length || 0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📝 {t('modals.preview.description') || 'Description'}</h4>
                <p className={styles.modalDescription}>
                  {(isHindi && previewCategory.descriptionHi) ? previewCategory.descriptionHi : (previewCategory.description || t('modals.preview.noDesc') || 'No description available for this category.')}
                </p>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>🎯 Difficulty</h4>
                <div className={styles.difficultyBadges}>
                  {['easy', 'medium', 'hard'].map(difficulty => {
                    const hasDifficulty = previewCategory.difficulty?.toLowerCase() === difficulty;
                    return (
                      <span
                        key={difficulty}
                        className={`${styles.difficultyBadge} ${hasDifficulty ? styles.difficultyBadgeActive : ''}`}
                      >
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <Link 
                href={`/category/${previewCategory.slug || previewCategory.id}`}
                className={styles.modalPrimaryButton}
                onClick={closePreviewModal}
              >
                Start Quiz
              </Link>
              <button 
                className={styles.modalSecondaryButton}
                onClick={closePreviewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sign In Modal */}
      {showSignInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignInModal(false)}>
          <div className={styles.signInModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('modals.signin.title')}</h3>
              <button className={styles.modalClose} onClick={() => setShowSignInModal(false)}>✕</button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                {t('modals.signin.desc')}
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl mb-6 text-sm text-indigo-700 dark:text-indigo-300">
                <strong>{t('modals.signin.why')}</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  {(t('modals.signin.benefits') || []).map((benefit, bIdx) => (
                    <li key={bIdx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalPrimaryButton}
                onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
              >
                {t('modals.signin.btn')}
              </button>
              <button 
                className={styles.modalSecondaryButton}
                onClick={() => setShowSignInModal(false)}
              >
                {t('modals.signin.later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
