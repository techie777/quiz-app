// Simple sound effects using the Web Audio API
let audioCtx = null;

// Function to initialize the AudioContext
export function initSounds() {
  if (typeof window !== 'undefined' && !audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Resume the context if it's in a suspended state (required by modern browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.error("Could not create AudioContext:", e);
    }
  }
}

function getAudioContext() {
  // We now expect initSounds() to have been called, but we can still have a fallback.
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    initSounds();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = "sine", volume = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if it's suspended (browsers block auto-play)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Sound playback error:", e);
  }
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const now = ctx.currentTime;

    // Pleasant ascending two-tone chime
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  } catch (e) {
    console.warn("Correct sound playback error:", e);
  }
}

export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}
  // Low buzzer tone
  playTone(200, 0.35, "square", 0.15);
}
