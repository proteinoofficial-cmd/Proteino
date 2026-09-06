// Universal High-Decibel Kitchen/Admin Order Alert Sound System
// Engineered specifically for 100% reliability on Desktop Computers (Windows, Mac, Linux) & Mobile.

let sharedAudioContext: AudioContext | null = null;
let cachedBlobWavUrl: string | null = null;
let cachedPreOrderBlobWavUrl: string | null = null;
let cachedKitchenOpeningBlobWavUrl: string | null = null;
let isAudioUnlocked = false;

// Create 16-bit PCM WAV binary for universal Desktop & Mobile HTML5 Audio playback (Normal Orders)
function buildLoudChimeWavBlob(): string {
  if (cachedBlobWavUrl) return cachedBlobWavUrl;

  try {
    const sampleRate = 44100;
    const duration = 2.0; // 2 seconds
    const totalSamples = Math.floor(sampleRate * duration);
    const byteLength = 44 + totalSamples * 2;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    // 1. RIFF Header
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeAscii(view, 8, 'WAVE');

    // 2. fmt Sub-chunk
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // 16 for PCM
    view.setUint16(20, 1, true); // PCM Format = 1
    view.setUint16(22, 1, true); // Mono = 1
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate (44100 * 2)
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16 bits per sample

    // 3. data Sub-chunk
    writeAscii(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    // 4. Generate high-visibility, crisp restaurant bell chords
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Note 1 (Ding)
      if (t >= 0.0 && t < 0.8) {
        const decay = Math.exp(-t * 5.0);
        const wave = 
          Math.sin(2 * Math.PI * 523.25 * t) * 0.35 +
          Math.sin(2 * Math.PI * 659.25 * t) * 0.35 +
          Math.sin(2 * Math.PI * 1046.5 * t) * 0.30;
        sample += wave * decay;
      }

      // Note 2 (Dong)
      if (t >= 0.35 && t < 1.3) {
        const t2 = t - 0.35;
        const decay2 = Math.exp(-t2 * 4.5);
        const wave2 = 
          Math.sin(2 * Math.PI * 783.99 * t2) * 0.40 +
          Math.sin(2 * Math.PI * 987.77 * t2) * 0.35 +
          Math.sin(2 * Math.PI * 1567.98 * t2) * 0.30;
        sample += wave2 * decay2;
      }

      // Note 3 (High Clarity Bell Finish)
      if (t >= 0.75 && t < 2.0) {
        const t3 = t - 0.75;
        const decay3 = Math.exp(-t3 * 3.5);
        const wave3 = 
          Math.sin(2 * Math.PI * 1046.5 * t3) * 0.45 +
          Math.sin(2 * Math.PI * 1318.5 * t3) * 0.40 +
          Math.sin(2 * Math.PI * 2093.0 * t3) * 0.35;
        sample += wave3 * decay3;
      }

      // Master volume boost & hard limiter
      sample = Math.max(-0.98, Math.min(0.98, sample * 1.8));

      // Convert to 16-bit signed PCM
      const pcm16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(44 + i * 2, pcm16, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedBlobWavUrl = URL.createObjectURL(blob);
    return cachedBlobWavUrl;
  } catch (err) {
    console.warn("WAV Blob generation error:", err);
    return "";
  }
}

// Create distinct Pre-Order futuristic harmonic sequence WAV (Ascending crystal chime)
function buildPreOrderChimeWavBlob(): string {
  if (cachedPreOrderBlobWavUrl) return cachedPreOrderBlobWavUrl;

  try {
    const sampleRate = 44100;
    const duration = 2.2; // 2.2 seconds
    const totalSamples = Math.floor(sampleRate * duration);
    const byteLength = 44 + totalSamples * 2;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeAscii(view, 8, 'WAVE');

    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeAscii(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    // 4-Note Ascending Crystal Harp / Electronic Chime:
    // Note 1 (0.00s): A4 (440.00 Hz) + E5 (659.25 Hz)
    // Note 2 (0.22s): C#5 (554.37 Hz) + A5 (880.00 Hz)
    // Note 3 (0.45s): E5 (659.25 Hz) + C#6 (1108.73 Hz)
    // Note 4 (0.70s): A5 (880.00 Hz) + E6 (1318.51 Hz) + A6 (1760.00 Hz) Shimmer
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Note 1 (Pulse 1)
      if (t >= 0.0 && t < 0.9) {
        const d = Math.exp(-t * 5.5);
        sample += (Math.sin(2 * Math.PI * 440.0 * t) * 0.4 + Math.sin(2 * Math.PI * 659.25 * t) * 0.3) * d;
      }

      // Note 2 (Pulse 2)
      if (t >= 0.22 && t < 1.2) {
        const t2 = t - 0.22;
        const d2 = Math.exp(-t2 * 5.0);
        sample += (Math.sin(2 * Math.PI * 554.37 * t2) * 0.45 + Math.sin(2 * Math.PI * 880.0 * t2) * 0.35) * d2;
      }

      // Note 3 (Pulse 3)
      if (t >= 0.45 && t < 1.6) {
        const t3 = t - 0.45;
        const d3 = Math.exp(-t3 * 4.2);
        sample += (Math.sin(2 * Math.PI * 659.25 * t3) * 0.45 + Math.sin(2 * Math.PI * 1108.73 * t3) * 0.35) * d3;
      }

      // Note 4 (Ascending Climax Ring)
      if (t >= 0.70 && t < 2.2) {
        const t4 = t - 0.70;
        const d4 = Math.exp(-t4 * 2.8);
        sample += (
          Math.sin(2 * Math.PI * 880.0 * t4) * 0.45 + 
          Math.sin(2 * Math.PI * 1318.51 * t4) * 0.40 + 
          Math.sin(2 * Math.PI * 1760.0 * t4) * 0.35 +
          Math.sin(2 * Math.PI * 2637.0 * t4) * 0.20
        ) * d4;
      }

      sample = Math.max(-0.98, Math.min(0.98, sample * 1.9));
      const pcm16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(44 + i * 2, pcm16, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedPreOrderBlobWavUrl = URL.createObjectURL(blob);
    return cachedPreOrderBlobWavUrl;
  } catch (err) {
    console.warn("Pre-order WAV Blob error:", err);
    return "";
  }
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

// Unlock audio on any computer/mobile interaction
export function initAudioUnlock() {
  if (isAudioUnlocked) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      if (!sharedAudioContext) {
        sharedAudioContext = new AudioCtx();
      }
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }
    }
    // Pre-create the WAV blobs
    buildLoudChimeWavBlob();
    buildPreOrderChimeWavBlob();
    buildKitchenOpeningChimeWavBlob();
  } catch (e) {
    console.warn("Audio unlock warning:", e);
  }
}

// Play sound for Normal / Single Meal / Instant Orders
export function playOrderAlertSound(): Promise<void> {
  return new Promise(async (resolve) => {
    initAudioUnlock();

    // Strategy 1: HTML5 Audio with WAV Blob
    try {
      const wavUrl = buildLoudChimeWavBlob();
      if (wavUrl) {
        const audio = new Audio(wavUrl);
        audio.volume = 1.0;
        audio.play().catch((err) => {
          console.warn("HTML5 normal order audio autoplay error:", err);
        });
      }
    } catch (e) {
      console.warn("HTML5 Audio player error:", e);
    }

    // Strategy 2: Web Audio API Oscillator Bell Synthesis
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        let ctx = sharedAudioContext;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioCtx();
          sharedAudioContext = ctx;
        }
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const now = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(1.0, now);
        master.connect(ctx.destination);

        const chimeNotes = [
          { freq: 587.33, start: 0.00, dur: 0.50, vol: 0.6 },
          { freq: 880.00, start: 0.12, dur: 0.65, vol: 0.75 },
          { freq: 1174.66, start: 0.35, dur: 0.85, vol: 0.85 },
          { freq: 1479.98, start: 0.48, dur: 0.95, vol: 0.75 },
          { freq: 1760.00, start: 0.52, dur: 1.10, vol: 0.90 },
        ];

        chimeNotes.forEach((n) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(n.freq, now + n.start);
          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.015);
          gain.gain.setTargetAtTime(0.0001, now + n.start + 0.03, n.dur / 4);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });
      }
    } catch (synthErr) {
      console.warn("Web Audio synth alert warning:", synthErr);
    }

    resolve();
  });
}

// Play distinct sound for PRE-ORDERS (Crisp ascending crystal arpeggio + shimmer chime)
export function playPreOrderAlertSound(): Promise<void> {
  return new Promise(async (resolve) => {
    initAudioUnlock();

    // Strategy 1: HTML5 Audio with Distinct Pre-Order WAV Blob
    try {
      const wavUrl = buildPreOrderChimeWavBlob();
      if (wavUrl) {
        const audio = new Audio(wavUrl);
        audio.volume = 1.0;
        audio.play().catch((err) => {
          console.warn("HTML5 pre-order audio autoplay error:", err);
        });
      }
    } catch (e) {
      console.warn("HTML5 Pre-order audio player error:", e);
    }

    // Strategy 2: Web Audio API Oscillator Arpeggio Synthesis (Distinct Ascending Futuristic Chords)
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        let ctx = sharedAudioContext;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioCtx();
          sharedAudioContext = ctx;
        }
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const now = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(1.0, now);
        master.connect(ctx.destination);

        // Harmonic ascending 5-note melodic chime (distinct from normal order bell)
        const preOrderChimes = [
          { freq: 440.00, start: 0.00, dur: 0.65, vol: 0.65, type: 'triangle' as OscillatorType },  // A4
          { freq: 554.37, start: 0.18, dur: 0.70, vol: 0.70, type: 'triangle' as OscillatorType },  // C#5
          { freq: 659.25, start: 0.36, dur: 0.80, vol: 0.75, type: 'sine' as OscillatorType },      // E5
          { freq: 880.00, start: 0.54, dur: 0.95, vol: 0.85, type: 'sine' as OscillatorType },      // A5
          { freq: 1318.51, start: 0.72, dur: 1.30, vol: 0.90, type: 'sine' as OscillatorType },     // E6
          { freq: 1760.00, start: 0.76, dur: 1.40, vol: 0.85, type: 'sine' as OscillatorType },     // A6 Shimmer
        ];

        preOrderChimes.forEach((n) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = n.type;
          osc.frequency.setValueAtTime(n.freq, now + n.start);

          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.02);
          gain.gain.setTargetAtTime(0.0001, now + n.start + 0.04, n.dur / 3.5);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });
      }
    } catch (synthErr) {
      console.warn("Web Audio pre-order synth warning:", synthErr);
    }

    resolve();
  });
}

// Create distinct Kitchen Opening Ceremony / Session Start WAV (Majestic resonant gong + ascending triumphant fanfare)
function buildKitchenOpeningChimeWavBlob(): string {
  if (cachedKitchenOpeningBlobWavUrl) return cachedKitchenOpeningBlobWavUrl;

  try {
    const sampleRate = 44100;
    const duration = 2.8; // 2.8 seconds
    const totalSamples = Math.floor(sampleRate * duration);
    const byteLength = 44 + totalSamples * 2;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeAscii(view, 8, 'WAVE');

    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeAscii(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 1. Deep resonant gong fundamental (C3 130.81Hz + G3 196.00Hz)
      if (t >= 0.0 && t < 2.5) {
        const d = Math.exp(-t * 1.6);
        sample += (
          Math.sin(2 * Math.PI * 130.81 * t) * 0.45 +
          Math.sin(2 * Math.PI * 196.00 * t) * 0.35 +
          Math.sin(2 * Math.PI * 261.63 * t) * 0.25
        ) * d;
      }

      // 2. Triumphant Fanfare Sequence:
      // Note A (0.25s): E4 (329.63 Hz)
      if (t >= 0.25 && t < 1.4) {
        const t2 = t - 0.25;
        const d2 = Math.exp(-t2 * 4.0);
        sample += (Math.sin(2 * Math.PI * 329.63 * t2) * 0.40 + Math.sin(2 * Math.PI * 659.25 * t2) * 0.25) * d2;
      }

      // Note B (0.50s): G4 (392.00 Hz)
      if (t >= 0.50 && t < 1.6) {
        const t3 = t - 0.50;
        const d3 = Math.exp(-t3 * 3.8);
        sample += (Math.sin(2 * Math.PI * 392.00 * t3) * 0.45 + Math.sin(2 * Math.PI * 783.99 * t3) * 0.25) * d3;
      }

      // Note C (0.75s): C5 (523.25 Hz)
      if (t >= 0.75 && t < 1.9) {
        const t4 = t - 0.75;
        const d4 = Math.exp(-t4 * 3.5);
        sample += (Math.sin(2 * Math.PI * 523.25 * t4) * 0.50 + Math.sin(2 * Math.PI * 1046.50 * t4) * 0.30) * d4;
      }

      // Note D (1.05s): High Glorious E5 (659.25 Hz) + G5 (783.99 Hz) + C6 (1046.50 Hz) Climax Ring
      if (t >= 1.05 && t < 2.8) {
        const t5 = t - 1.05;
        const d5 = Math.exp(-t5 * 2.2);
        sample += (
          Math.sin(2 * Math.PI * 659.25 * t5) * 0.45 +
          Math.sin(2 * Math.PI * 783.99 * t5) * 0.40 +
          Math.sin(2 * Math.PI * 1046.50 * t5) * 0.35 +
          Math.sin(2 * Math.PI * 1567.98 * t5) * 0.20
        ) * d5;
      }

      sample = Math.max(-0.98, Math.min(0.98, sample * 1.95));
      const pcm16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(44 + i * 2, pcm16, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedKitchenOpeningBlobWavUrl = URL.createObjectURL(blob);
    return cachedKitchenOpeningBlobWavUrl;
  } catch (err) {
    console.warn("Kitchen opening WAV Blob error:", err);
    return "";
  }
}

// Play distinct sound for KITCHEN OPENING TIME (6:00 AM & 6:00 PM session open alert)
export function playKitchenOpeningAlertSound(): Promise<void> {
  return new Promise(async (resolve) => {
    initAudioUnlock();

    // Strategy 1: HTML5 Audio with WAV Blob
    try {
      const wavUrl = buildKitchenOpeningChimeWavBlob();
      if (wavUrl) {
        const audio = new Audio(wavUrl);
        audio.volume = 1.0;
        audio.play().catch((err) => {
          console.warn("HTML5 kitchen opening audio autoplay error:", err);
        });
      }
    } catch (e) {
      console.warn("HTML5 Kitchen opening audio player error:", e);
    }

    // Strategy 2: Web Audio API Oscillator Gong + Brass Fanfare
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        let ctx = sharedAudioContext;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioCtx();
          sharedAudioContext = ctx;
        }
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const now = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(1.0, now);
        master.connect(ctx.destination);

        // Resonant gong strike + ascending fanfare chimes
        const sessionChimes = [
          // Deep Gong Fundamental
          { freq: 130.81, start: 0.00, dur: 2.2, vol: 0.50, type: 'triangle' as OscillatorType },
          { freq: 196.00, start: 0.00, dur: 2.0, vol: 0.45, type: 'sine' as OscillatorType },
          // Fanfare sequence
          { freq: 329.63, start: 0.25, dur: 0.9, vol: 0.55, type: 'triangle' as OscillatorType }, // E4
          { freq: 392.00, start: 0.50, dur: 1.0, vol: 0.60, type: 'triangle' as OscillatorType }, // G4
          { freq: 523.25, start: 0.75, dur: 1.2, vol: 0.70, type: 'sine' as OscillatorType },     // C5
          // High Triumph
          { freq: 659.25, start: 1.05, dur: 1.6, vol: 0.75, type: 'sine' as OscillatorType },     // E5
          { freq: 783.99, start: 1.05, dur: 1.6, vol: 0.70, type: 'sine' as OscillatorType },     // G5
          { freq: 1046.50, start: 1.08, dur: 1.8, vol: 0.80, type: 'sine' as OscillatorType },    // C6
        ];

        sessionChimes.forEach((n) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = n.type;
          osc.frequency.setValueAtTime(n.freq, now + n.start);

          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.02);
          gain.gain.setTargetAtTime(0.0001, now + n.start + 0.04, n.dur / 3.0);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });
      }
    } catch (synthErr) {
      console.warn("Web Audio kitchen opening synth warning:", synthErr);
    }

    resolve();
  });
}
