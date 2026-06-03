/**
 * SoundEngine — Procedural audio synthesis for chess game events.
 *
 * Uses the Web Audio API to generate lightweight, distinctive sounds for each
 * event type.  No external audio assets are required; everything is synthesised
 * at runtime from oscillators and gain envelopes.
 */

import { SoundEvent } from './constants';

let audioCtx = null;

/**
 * Lazily initialise (or resume) the shared AudioContext.
 * Must be called from a user-gesture handler on iOS / Safari.
 */
export function initAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function playTone(ctx, frequency, duration, volume, type = 'sine', detune = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  if (detune) osc.detune.value = detune;

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(ctx, duration, volume) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

/* ------------------------------------------------------------------ */
/*  Per-event sound recipes                                            */
/* ------------------------------------------------------------------ */

const recipes = {
  [SoundEvent.MOVE](ctx, vol) {
    playTone(ctx, 400, 0.08, vol * 0.5, 'sine');
    playTone(ctx, 600, 0.06, vol * 0.3, 'sine');
  },

  [SoundEvent.CAPTURE](ctx, vol) {
    playNoise(ctx, 0.12, vol);
    playTone(ctx, 250, 0.15, vol * 0.6, 'sawtooth');
  },

  [SoundEvent.CHECK](ctx, vol) {
    playTone(ctx, 880, 0.10, vol * 0.7, 'square');
    setTimeout(() => playTone(ctx, 1100, 0.10, vol * 0.5, 'square'), 100);
  },

  [SoundEvent.CASTLE](ctx, vol) {
    playTone(ctx, 350, 0.08, vol * 0.4, 'sine');
    setTimeout(() => playTone(ctx, 500, 0.08, vol * 0.4, 'sine'), 80);
    setTimeout(() => playTone(ctx, 350, 0.08, vol * 0.3, 'sine'), 160);
  },

  [SoundEvent.GAME_START](ctx, vol) {
    playTone(ctx, 523, 0.12, vol * 0.4, 'sine');
    setTimeout(() => playTone(ctx, 659, 0.12, vol * 0.4, 'sine'), 120);
    setTimeout(() => playTone(ctx, 784, 0.15, vol * 0.5, 'sine'), 240);
  },

  [SoundEvent.GAME_END](ctx, vol) {
    playTone(ctx, 784, 0.20, vol * 0.5, 'triangle');
    setTimeout(() => playTone(ctx, 659, 0.20, vol * 0.4, 'triangle'), 200);
    setTimeout(() => playTone(ctx, 523, 0.30, vol * 0.5, 'triangle'), 400);
  },

  [SoundEvent.ILLEGAL](ctx, vol) {
    playTone(ctx, 200, 0.15, vol * 0.4, 'sawtooth');
  },
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Play the sound associated with the given chess event.
 *
 * @param {string}  event  One of the `SoundEvent` values.
 * @param {number} [volume=0.6] Master volume (0-1).
 */
export function playChessSound(event, volume = 0.6) {
  const ctx = initAudioContext();
  if (!ctx) return;

  const fn = recipes[event];
  if (fn) {
    try {
      fn(ctx, Math.max(0, Math.min(1, volume)));
    } catch {
      // Silently swallow audio errors so they never break gameplay.
    }
  }
}
