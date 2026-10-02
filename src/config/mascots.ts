export type CharacterMood = 'idle' | 'thinking' | 'clapping' | 'disappointed' | 'celebrating';

export interface MascotProfile {
  id: string;
  name: string;
  nameHi: string;
  subject: string;
  tagline: string;
  folder: string;
  color: string;
  badgeBg: string;
  dialogues: Record<CharacterMood, string>;
  ttsPitch: number;
  ttsRate: number;
}

export const MASCOTS: Record<string, MascotProfile> = {
  'sharma-sir': {
    id: 'sharma-sir',
    name: 'Sharma Sir',
    nameHi: 'शर्मा सर',
    subject: 'इतिहास & राजनीति',
    tagline: 'इतिहास और संविधान के पक्के गुरु',
    folder: 'sharma-sir',
    color: '#2F4B7C',
    badgeBg: 'rgba(47, 75, 124, 0.12)',
    dialogues: {
      idle: 'तैयार हो? आज अपना सर्वश्रेष्ठ प्रदर्शन दो!',
      thinking: 'हड़बड़ी मत करो, सवाल को ध्यान से समझो।',
      clapping: 'शाबाश! तुम्हारी तैयारी पक्की दिख रही है।',
      disappointed: 'अरेरे! कोई बात नहीं, स्पष्टीकरण ध्यान से पढ़ो।',
      celebrating: 'अद्भुत! लगातार सही उत्तर — गर्व है तुम पर!',
    },
    ttsPitch: 0.90, // Deeper mature voice
    ttsRate: 0.95,
  },
  'coach-vikram': {
    id: 'coach-vikram',
    name: 'Coach Vikram',
    nameHi: 'कोच विक्रम',
    subject: 'मॉक टेस्ट & खेल',
    tagline: 'स्पीड और एक्यूरेसी के उस्ताद',
    folder: 'coach-vikram',
    color: '#D85A30',
    badgeBg: 'rgba(216, 90, 48, 0.12)',
    dialogues: {
      idle: 'टाइमर चालू होने वाला है, ध्यान बनाए रखो!',
      thinking: 'तेज़ सोचो! हर सेकंड कीमती है!',
      clapping: 'शानदार शॉट! गति बनाए रखो!',
      disappointed: 'गलती से ही सीख मिलती है, अगला सवाल फोड़ो!',
      celebrating: 'हैट्रिक! तुम तो चैंपियन बन गए!',
    },
    ttsPitch: 1.0,
    ttsRate: 1.05,
  },
  'filmy-raj': {
    id: 'filmy-raj',
    name: 'Filmy Raj',
    nameHi: 'फिल्मी राज',
    subject: 'मनोरंजन & सिनेमा',
    tagline: 'फिल्मी ज्ञान के सुपरस्टार',
    folder: 'filmy-raj',
    color: '#B83280',
    badgeBg: 'rgba(184, 50, 128, 0.12)',
    dialogues: {
      idle: 'लाईट, कैमरा, एक्शन! क्विज़ शुरू करें!',
      thinking: 'दिमाग के धागे खोलो... सही जवाब क्या है?',
      clapping: 'एकदम सुपरहिट जवाब!',
      disappointed: 'अरे यार, थोड़ा सा चूक गए!',
      celebrating: 'धमाकेदार परफॉरमेंस! ब्लॉकबस्टर स्कोर!',
    },
    ttsPitch: 1.1,
    ttsRate: 1.0,
  },
  'dr-cosmo': {
    id: 'dr-cosmo',
    name: 'Dr. Cosmo',
    nameHi: 'डॉ. कॉस्मो',
    subject: 'विज्ञान & स्पेस',
    tagline: 'तथ्यों और प्रयोगों के वैज्ञानिक',
    folder: 'dr-cosmo',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    dialogues: {
      idle: 'आओ देखें विज्ञान का कौन सा रहस्य सुलझाते हो!',
      thinking: 'हर पहलू का तार्किक विश्लेषण करो...',
      clapping: 'वैज्ञानिक रूप से सटीक उत्तर!',
      disappointed: 'प्रयोग असफल रहा, पर नया ज्ञान मिला!',
      celebrating: 'युरेका! अद्भुत प्रतिभा!',
    },
    ttsPitch: 0.95,
    ttsRate: 0.95,
  },
  'didi': {
    id: 'didi',
    name: 'Didi',
    nameHi: 'दीदी',
    subject: 'बाल ज्ञान & सामान्य अध्ययन',
    tagline: 'सरल और रोचक ज्ञान मार्गदर्शक',
    folder: 'didi',
    color: '#1D9E75',
    badgeBg: 'rgba(29, 158, 117, 0.12)',
    dialogues: {
      idle: 'नमस्ते बच्चों! आज कुछ नया सीखते हैं।',
      thinking: 'आराम से सोचो, तुम्हें आता है ये!',
      clapping: 'बहुत अच्छे! बहुत सुंदर!',
      disappointed: 'कोई बात नहीं, मिलकर दोबारा कोशिश करेंगे।',
      celebrating: 'शाबाशी! पाँच सितारा प्रदर्शन!',
    },
    ttsPitch: 1.15,
    ttsRate: 0.92,
  },
};

/**
 * Intelligent mapping from category topic / slug / tier to designated Mascot host
 */
export const getMascotForCategory = (categoryOrSlug?: string | { topic?: string; slug?: string; title?: string }, tier?: string): MascotProfile => {
  // If in kids tier, default to Didi
  if (tier === 'kids') {
    return MASCOTS['didi'];
  }

  let text = '';
  if (typeof categoryOrSlug === 'string') {
    text = categoryOrSlug.toLowerCase();
  } else if (categoryOrSlug && typeof categoryOrSlug === 'object') {
    text = `${categoryOrSlug.topic || ''} ${categoryOrSlug.slug || ''} ${categoryOrSlug.title || ''}`.toLowerCase();
  }

  // Science & Tech keywords -> Dr. Cosmo
  if (
    text.includes('science') ||
    text.includes('vigyan') ||
    text.includes('विज्ञान') ||
    text.includes('space') ||
    text.includes('tech') ||
    text.includes('physics') ||
    text.includes('chem') ||
    text.includes('bio') ||
    text.includes('computer') ||
    text.includes('astronomy') ||
    text.includes('invention')
  ) {
    return MASCOTS['dr-cosmo'];
  }

  // Bollywood & Pop Culture -> Filmy Raj
  if (
    text.includes('bollywood') ||
    text.includes('cinema') ||
    text.includes('movie') ||
    text.includes('फिल्म') ||
    text.includes('मनोरंजन') ||
    text.includes('entertainment') ||
    text.includes('pop') ||
    text.includes('music') ||
    text.includes('tv') ||
    text.includes('celebrity') ||
    text.includes('kbc')
  ) {
    return MASCOTS['filmy-raj'];
  }

  // Speed / Mock Test / Sports -> Coach Vikram
  if (
    text.includes('mock') ||
    text.includes('speed') ||
    text.includes('test') ||
    text.includes('daily') ||
    text.includes('दैनिक') ||
    text.includes('sports') ||
    text.includes('cricket') ||
    text.includes('खेल') ||
    text.includes('challenge') ||
    text.includes('ssc') ||
    text.includes('railway') ||
    text.includes('police') ||
    text.includes('banking')
  ) {
    return MASCOTS['coach-vikram'];
  }

  // Kids / Basic GK / Primary School -> Didi
  if (
    text.includes('kid') ||
    text.includes('child') ||
    text.includes('school') ||
    text.includes('bacch') ||
    text.includes('बाल') ||
    text.includes('primary') ||
    text.includes('animal') ||
    text.includes('cartoon') ||
    text.includes('puzzle')
  ) {
    return MASCOTS['didi'];
  }

  // Polity, History, Govt Exams, Default -> Sharma Sir
  return MASCOTS['sharma-sir'];
};

/**
 * Browser-native Hindi / English TTS synthesis with mascot speech controls
 */
export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

export const speakWithMascot = (
  text: string,
  rate = 0.95,
  pitch = 0.90,
  onStart?: () => void,
  onEnd?: () => void,
  lang = 'hi-IN'
): boolean => {
  if (!isSpeechSupported()) {
    onEnd?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Clean text of markdown, asterisks, brackets, or code symbols
    const cleanText = text
      .replace(/<[^>]*>?/gm, '')
      .replace(/[*_#`~[\]]/g, '')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    let hasStarted = false;
    let hasEnded = false;

    const safeStart = () => {
      if (!hasStarted) {
        hasStarted = true;
        onStart?.();
      }
    };

    const safeEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        onEnd?.();
      }
    };

    utterance.onstart = safeStart;
    utterance.onend = safeEnd;
    utterance.onerror = (e) => {
      safeEnd();
    };

    const assignVoiceAndSpeak = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;

        if (lang.startsWith('hi')) {
          targetVoice =
            voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
            voices.find(v => v.lang.startsWith('hi')) ||
            voices.find(v => v.name.toLowerCase().includes('hindi')) ||
            voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) ||
            voices.find(v => v.default);
        } else {
          targetVoice =
            voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
            voices.find(v => v.name.toLowerCase().includes('india')) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices.find(v => v.default);
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
            // Some browsers delay or miss firing onstart for short text; ensure safe start fallback
            setTimeout(() => {
              if (window.speechSynthesis.speaking && !hasStarted) {
                safeStart();
              }
            }, 80);
          } catch (e) {
            safeEnd();
          }
        }, 60);
      } catch (err) {
        safeEnd();
      }
    };

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices && currentVoices.length > 0) {
      assignVoiceAndSpeak();
    } else {
      let resolved = false;
      const onVoices = () => {
        if (!resolved) {
          resolved = true;
          assignVoiceAndSpeak();
        }
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      setTimeout(onVoices, 200);
    }

    return true;
  } catch (err) {
    console.warn('TTS error:', err);
    onEnd?.();
    return false;
  }
};

export const stopMascotSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // Silently catch
    }
  }
};
