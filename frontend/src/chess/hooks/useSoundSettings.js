import { useState, useCallback, useEffect } from 'react';
import { playChessSound, initAudioContext } from '../audio';
import { SOUND_MUTED_KEY, SOUND_VOLUME_KEY, DEFAULT_VOLUME } from '../audio/constants';

/**
 * Hook providing sound‑effect controls for chess game events.
 *
 * Reads and persists the mute preference to localStorage so it survives
 * page refreshes.  Exposes a `play()` helper that respects the current
 * muted state.
 *
 * @returns {{
 *   isMuted: boolean,
 *   volume: number,
 *   toggleMute: () => void,
 *   setMuted: (v: boolean) => void,
 *   setVolume: (v: number) => void,
 *   play: (eventType: string) => void,
 * }}
 */
const useSoundSettings = () => {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_MUTED_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_VOLUME_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : DEFAULT_VOLUME;
      }
      return DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  });

  // Persist mute state whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(isMuted));
    } catch {
      // Ignore write failures (private browsing, quota, etc.)
    }
  }, [isMuted]);

  // Persist volume whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
    } catch {
      // Ignore write failures
    }
  }, [volume]);

  // Eagerly prime the AudioContext on first user gesture after mount.
  useEffect(() => {
    const prime = () => {
      initAudioContext();
      window.removeEventListener('click', prime);
      window.removeEventListener('keydown', prime);
      window.removeEventListener('touchstart', prime);
    };
    window.addEventListener('click', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    window.addEventListener('touchstart', prime, { once: true });
    return () => {
      window.removeEventListener('click', prime);
      window.removeEventListener('keydown', prime);
      window.removeEventListener('touchstart', prime);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setMuted = useCallback((value) => {
    setIsMuted(Boolean(value));
  }, []);

  const setVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    setVolumeState(clamped);
  }, []);

  /**
   * Play a sound effect if the user has not muted audio.
   *
   * @param {string} eventType — One of the SoundEventTypes values.
   */
  const play = useCallback(
    (eventType) => {
      if (!isMuted) {
        playChessSound(eventType);
      }
    },
    [isMuted],
  );

  return { isMuted, volume, toggleMute, setMuted, setVolume, play };
};

export default useSoundSettings;
