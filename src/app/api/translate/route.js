import { NextResponse } from "next/server";
import translate from "translate-google-api";

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, to, from } = body;
    if (!text || !to) {
      return NextResponse.json({ error: "Missing text or target language" }, { status: 400 });
    }

    // Auto-detect source language if not provided
    let sourceLang = from;
    if (!sourceLang) {
      // Simple detection: check if any text contains Hindi characters
      const textSample = Array.isArray(text) ? text.join(' ') : text;
      const hindiRegex = /[\u0900-\u097F]/;
      sourceLang = hindiRegex.test(textSample) ? 'hi' : 'en';
      console.log(`[Translate API] Auto-detected source language: ${sourceLang}`);
    }

    console.log(`[Translate API] Translating from: ${sourceLang} to: ${to}. Input size: ${Array.isArray(text) ? text.length : 1}`);

    const texts = Array.isArray(text) ? text : [text];
    const validTexts = texts.map(t => (t && t.trim() !== "") ? t.trim() : "");
    
    // Find non-empty strings to translate
    const translationMap = [];
    const stringsToTranslate = [];
    
    validTexts.forEach((t, i) => {
      if (t !== "") {
        translationMap.push(i);
        stringsToTranslate.push(t);
      }
    });

    if (stringsToTranslate.length === 0) {
      return NextResponse.json({ translations: texts });
    }

    try {
      const translations = await translate(stringsToTranslate, { from: sourceLang, to });
      
      const finalTranslations = [...texts];
      translationMap.forEach((originalIndex, i) => {
        finalTranslations[originalIndex] = translations[i];
      });

      return NextResponse.json({ 
        translations: Array.isArray(text) ? finalTranslations : finalTranslations[0] 
      });
    } catch (apiError) {
      console.error("External Translation API error:", apiError);
      // If API fails, return original text as fallback so the quiz can still be played
      return NextResponse.json({ 
        translations: text,
        warning: "Translation failed, using original text"
      });
    }
  } catch (error) {
    console.error("Translation route error:", error);
    return NextResponse.json({ error: "Translation process failed" }, { status: 500 });
  }
}
