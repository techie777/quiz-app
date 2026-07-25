import { NextResponse } from "next/server";
import translate from "translate-google-api";

// Server-side in-memory translation cache (reduces network calls to 0ms for repeated strings)
const serverTranslationCache = new Map();

async function translateFast(strings, { from, to }) {
  const results = new Array(strings.length);
  const uncachedIndices = [];
  const uncachedStrings = [];

  // 1. Check server-side memory cache first
  strings.forEach((str, idx) => {
    const cacheKey = `${from}_${to}_${str}`;
    if (serverTranslationCache.has(cacheKey)) {
      results[idx] = serverTranslationCache.get(cacheKey);
    } else {
      uncachedIndices.push(idx);
      uncachedStrings.push(str);
    }
  });

  if (uncachedStrings.length === 0) {
    console.log(`[Translate API] All ${strings.length} strings retrieved from server cache (0ms)!`);
    return results;
  }

  console.log(`[Translate API] Translating ${uncachedStrings.length}/${strings.length} uncached strings in array batches...`);

  // 2. Batch uncached strings in chunks of 40 for fast array translation
  const chunkSize = 40;
  for (let i = 0; i < uncachedStrings.length; i += chunkSize) {
    const chunk = uncachedStrings.slice(i, i + chunkSize);
    const chunkIndices = uncachedIndices.slice(i, i + chunkSize);

    try {
      // Pass array directly to translate-google-api (1 single HTTP request instead of 40!)
      const batchRes = await translate(chunk, { from, to });
      const translatedArray = Array.isArray(batchRes) ? batchRes : [batchRes];

      if (translatedArray.length === chunk.length) {
        chunk.forEach((str, cIdx) => {
          const trans = translatedArray[cIdx] || str;
          const origIndex = chunkIndices[cIdx];
          results[origIndex] = trans;
          serverTranslationCache.set(`${from}_${to}_${str}`, trans);
        });
      } else {
        throw new Error("Batch translation count mismatch");
      }
    } catch (batchErr) {
      console.warn(`[Translate API] Array batch failed for chunk, falling back to parallel items:`, batchErr.message);
      // Fallback item by item in parallel
      const fallbackPromises = chunk.map((text) => 
        translate(text, { from, to })
          .then(res => (Array.isArray(res) ? res[0] : res))
          .catch(() => text)
      );
      const fallbackRes = await Promise.all(fallbackPromises);
      chunk.forEach((str, cIdx) => {
        const trans = fallbackRes[cIdx] || str;
        const origIndex = chunkIndices[cIdx];
        results[origIndex] = trans;
        serverTranslationCache.set(`${from}_${to}_${str}`, trans);
      });
    }
  }

  return results;
}

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
      const textSample = Array.isArray(text) ? text.join(' ') : text;
      const hindiRegex = /[\u0900-\u097F]/;
      sourceLang = hindiRegex.test(textSample) ? 'hi' : 'en';
    }

    const texts = Array.isArray(text) ? text : [text];
    const validTexts = texts.map(t => (t && typeof t === 'string' && t.trim() !== "") ? t.trim() : "");
    
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
      const results = await translateFast(stringsToTranslate, { from: sourceLang, to });
      
      const finalTranslations = [...texts];
      translationMap.forEach((originalIndex, i) => {
        finalTranslations[originalIndex] = results[i];
      });

      return NextResponse.json({ 
        translations: Array.isArray(text) ? finalTranslations : finalTranslations[0] 
      });
    } catch (apiError) {
      console.error("External Translation API error:", apiError);
      return NextResponse.json({ 
        error: "External translation provider error: " + (apiError?.message || "unknown"),
        translations: text
      }, { status: 502 });
    }
  } catch (error) {
    console.error("Translation route error:", error);
    return NextResponse.json({ error: "Translation process failed" }, { status: 500 });
  }
}
