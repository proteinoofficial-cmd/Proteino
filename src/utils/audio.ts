// Universal High-Decibel Kitchen/Admin Order Alert Sound System
// Engineered specifically for 100% reliability on Desktop Computers (Windows, Mac, Linux) & Mobile.

let sharedAudioContext: AudioContext | null = null;
let cachedBlobWavUrl: string | null = null;
let isAudioUnlocked = false;

// Create 16-bit PCM WAV binary for universal Desktop & Mobile HTML5 Audio playback
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
    // Chord 1 (0.0s - 0.7s): High C Major bell (523.25Hz, 659.25Hz, 1046.5Hz, 1318.5Hz)
    // Chord 2 (0.45s - 1.2s): High G Major resonant chime (783.99Hz, 987.77Hz, 1567.98Hz)
    // Chord 3 (0.95s - 2.0s): High C6 triple ring (1046.5Hz, 1318.5Hz, 2093.0Hz)
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Note 1
      if (t >= 0.0 && t < 0.8) {
        const decay = Math.exp(-t * 5.0);
        const wave = 
          Math.sin(2 * Math.PI * 523.25 * t) * 0.35 +
          Math.sin(2 * Math.PI * 659.25 * t) * 0.35 +
          Math.sin(2 * Math.PI * 1046.5 * t) * 0.30;
        sample += wave * decay;
      }

      // Note 2 (Ding)
      if (t >= 0.35 && t < 1.3) {
        const t2 = t - 0.35;
        const decay2 = Math.exp(-t2 * 4.5);
        const wave2 = 
          Math.sin(2 * Math.PI * 783.99 * t2) * 0.40 +
          Math.sin(2 * Math.PI * 987.77 * t2) * 0.35 +
          Math.sin(2 * Math.PI * 1567.98 * t2) * 0.30;
        sample += wave2 * decay2;
      }

      // Note 3 (Dong - High Clarity Bell Finish)
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
    // Pre-create the WAV blob
    buildLoudChimeWavBlob();
  } catch (e) {
    console.warn("Audio unlock warning:", e);
  }
}

// Play sound simultaneously using Web Audio API + HTML5 Audio element for 100% desktop compatibility
export function playOrderAlertSound(): Promise<void> {
  return new Promise(async (resolve) => {
    initAudioUnlock();

    let playedHTML5 = false;

    // --- STRATEGY 1: HTML5 Audio with WAV Blob (Most reliable on Desktop Chrome/Edge/Firefox) ---
    try {
      const wavUrl = buildLoudChimeWavBlob();
      if (wavUrl) {
        const audio = new Audio(wavUrl);
        audio.volume = 1.0; // Max volume
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            playedHTML5 = true;
          }).catch((err) => {
            console.warn("HTML5 audio autoplay prevented by browser policy:", err);
          });
        }
      }
    } catch (e) {
      console.warn("HTML5 Audio player error:", e);
    }

    // --- STRATEGY 2: Web Audio API Oscillator Bell Synthesis (Crisp, High-Gain Synth) ---
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        // Always instantiate or resume context
        let ctx = sharedAudioContext;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioCtx();
          sharedAudioContext = ctx;
        }
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const now = ctx.currentTime + 0.02; // Small offset to avoid past-timestamp dropouts

        // Primary Master Output
        const master = ctx.createGain();
        master.gain.setValueAtTime(1.0, now);
        master.connect(ctx.destination);

        // Bell Frequencies (Restaurant Chime: D5, A5, D6, F#6, A6)
        const chimeNotes = [
          { freq: 587.33, start: 0.00, dur: 0.50, vol: 0.6 },  // D5
          { freq: 880.00, start: 0.12, dur: 0.65, vol: 0.75 }, // A5
          { freq: 1174.66, start: 0.35, dur: 0.85, vol: 0.85 }, // D6
          { freq: 1479.98, start: 0.48, dur: 0.95, vol: 0.75 }, // F#6
          { freq: 1760.00, start: 0.52, dur: 1.10, vol: 0.90 }, // A6
        ];

        chimeNotes.forEach((n) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(n.freq, now + n.start);

          // Linear rise, exponential decay
          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.015);
          gain.gain.setTargetAtTime(0.0001, now + n.start + 0.03, n.dur / 4);

          osc.connect(gain);
          gain.connect(master);

          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });

        // Second Repeat Bell (Echo chime for loud recognition)
        const repeatTime = now + 0.95;
        const repeatNotes = [
          { freq: 880.00, start: 0.00, dur: 0.5, vol: 0.7 },
          { freq: 1174.66, start: 0.12, dur: 0.7, vol: 0.8 },
          { freq: 1760.00, start: 0.22, dur: 0.9, vol: 0.85 }
        ];

        repeatNotes.forEach((n) => {
          if (!ctx) return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(n.freq, repeatTime + n.start);

          gain2.gain.setValueAtTime(0.001, repeatTime + n.start);
          gain2.gain.linearRampToValueAtTime(n.vol, repeatTime + n.start + 0.015);
          gain2.gain.setTargetAtTime(0.0001, repeatTime + n.start + 0.03, n.dur / 4);

          osc2.connect(gain2);
          gain2.connect(master);

          osc2.start(repeatTime + n.start);
          osc2.stop(repeatTime + n.start + n.dur);
        });
      }
    } catch (synthErr) {
      console.warn("Web Audio synth alert warning:", synthErr);
    }

    resolve();
  });
}
