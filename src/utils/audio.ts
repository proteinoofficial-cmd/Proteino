// Ultra-loud, multi-tier audio notification engine for kitchen & admin incoming orders
// Combines high-gain Web Audio API oscillators + HTML5 Audio WAV fallback for 100% browser reliability.

let sharedAudioCtx: AudioContext | null = null;

// Call on user interaction (clicks anywhere in admin panel) to unlock browser audio policy
export function initAudioUnlock() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn("Audio unlock error:", e);
  }
}

// Generate a Loud Double-Chime WAV buffer as Data URL for HTML5 Audio fallback
function generateLoudChimeWavUrl(): string {
  const sampleRate = 44100;
  const duration = 1.8; // 1.8 seconds total
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  // FMT Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)
  // Data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate sound samples: High-energy two-stage double chime (880Hz -> 1320Hz -> 1760Hz)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // First Chime (0.0s - 0.7s)
    if (t < 0.7) {
      const env = Math.exp(-t * 4.5);
      const s1 = Math.sin(2 * Math.PI * 784 * t); // G5
      const s2 = Math.sin(2 * Math.PI * 1046.5 * t); // C6
      const s3 = Math.sin(2 * Math.PI * 1568 * t); // G6
      sample += (s1 * 0.45 + s2 * 0.45 + s3 * 0.3) * env;
    }
    // Second Punchy Chime (0.5s - 1.5s)
    if (t >= 0.45 && t < 1.6) {
      const t2 = t - 0.45;
      const env2 = Math.exp(-t2 * 3.8);
      const s1 = Math.sin(2 * Math.PI * 1046.5 * t2); // C6
      const s2 = Math.sin(2 * Math.PI * 1318.5 * t2); // E6
      const s3 = Math.sin(2 * Math.PI * 2093 * t2); // C7 (High bell ping)
      sample += (s1 * 0.5 + s2 * 0.4 + s3 * 0.35) * env2;
    }

    // Boost & Soft clip
    sample = Math.max(-1, Math.min(1, sample * 1.5));
    // 16-bit PCM integer
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convert ArrayBuffer to Base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Cached WAV data url
let cachedWavUrl: string | null = null;

export function playOrderAlertSound(): Promise<void> {
  return new Promise(async (resolve) => {
    let playedWithWebAudio = false;

    // 1. Play via Web Audio API with Master Gain Amplifier & Harmonics
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
          sharedAudioCtx = new AudioContextClass();
        }
        if (sharedAudioCtx.state === "suspended") {
          await sharedAudioCtx.resume();
        }

        const ctx = sharedAudioCtx;
        const now = ctx.currentTime;

        // Master Gain node set high for loud sound
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.9, now);
        masterGain.connect(ctx.destination);

        // Dynamics Compressor to make it punchy and prevent harsh digital clipping
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-15, now);
        compressor.knee.setValueAtTime(20, now);
        compressor.ratio.setValueAtTime(12, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.25, now);
        compressor.connect(masterGain);

        // Loud 4-stage restaurant notification chime:
        // Note 1: 659.25Hz (E5), Note 2: 880Hz (A5), Note 3: 1318.5Hz (E6), Note 4: 1760Hz (A6)
        const notes = [
          { freq: 659.25, start: 0.0, dur: 0.35, type: 'triangle' as OscillatorType, vol: 0.8 },
          { freq: 880.00, start: 0.12, dur: 0.45, type: 'sine' as OscillatorType, vol: 0.9 },
          { freq: 1318.51, start: 0.35, dur: 0.65, type: 'sine' as OscillatorType, vol: 0.95 },
          { freq: 1760.00, start: 0.48, dur: 0.95, type: 'triangle' as OscillatorType, vol: 0.85 },
          { freq: 2637.02, start: 0.50, dur: 0.80, type: 'sine' as OscillatorType, vol: 0.4 } // High sparkle
        ];

        notes.forEach(({ freq, start, dur, type, vol }) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);

          noteGain.gain.setValueAtTime(0.0001, now + start);
          noteGain.gain.linearRampToValueAtTime(vol, now + start + 0.015);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

          osc.connect(noteGain);
          noteGain.connect(compressor);

          osc.start(now + start);
          osc.stop(now + start + dur);
        });

        // Second confirmation repeat chime after 1.1s
        setTimeout(() => {
          try {
            if (!ctx || ctx.state === "closed") return;
            const now2 = ctx.currentTime;
            const repeatNotes = [
              { freq: 880.00, start: 0.0, dur: 0.3, type: 'triangle' as OscillatorType, vol: 0.85 },
              { freq: 1318.51, start: 0.15, dur: 0.7, type: 'sine' as OscillatorType, vol: 0.95 },
              { freq: 1760.00, start: 0.20, dur: 0.85, type: 'sine' as OscillatorType, vol: 0.7 }
            ];

            repeatNotes.forEach(({ freq, start, dur, type, vol }) => {
              const osc2 = ctx.createOscillator();
              const noteGain2 = ctx.createGain();
              osc2.type = type;
              osc2.frequency.setValueAtTime(freq, now2 + start);
              noteGain2.gain.setValueAtTime(0.0001, now2 + start);
              noteGain2.gain.linearRampToValueAtTime(vol, now2 + start + 0.015);
              noteGain2.gain.exponentialRampToValueAtTime(0.0001, now2 + start + dur);
              osc2.connect(noteGain2);
              noteGain2.connect(compressor);
              osc2.start(now2 + start);
              osc2.stop(now2 + start + dur);
            });
          } catch (e) {
            console.warn("Repeat note error:", e);
          }
        }, 1100);

        playedWithWebAudio = true;
      }
    } catch (err) {
      console.warn("Web Audio API chime failed:", err);
    }

    // 2. Play HTML5 Audio fallback
    try {
      if (!cachedWavUrl) {
        cachedWavUrl = generateLoudChimeWavUrl();
      }
      const audio = new Audio(cachedWavUrl);
      audio.volume = 1.0;
      audio.play().catch((e) => {
        if (!playedWithWebAudio) {
          console.warn("HTML5 audio playback blocked by browser:", e);
        }
      });
    } catch (fallbackErr) {
      console.warn("HTML5 audio fallback error:", fallbackErr);
    }

    resolve();
  });
}
