import { useState, useCallback, useEffect } from 'react';
import { playChessSound, initAudioContext } from '../audio';
import { SOUND_MUTED_KEY, SOUND_VOLUME_KEY, DEFAULT_VOLUME } from '../audio/constants';

/**
 * useSoundSettings — Manages mute / volume state with localStorage persistence
 * and exposes a `play` helper that honours the current settings.
 *
 * @returns {{ isMuted: boolean, volume: number, toggleMute: () => void,
 *             setVolume: (v: number) => void, play: (event: string) => void }}
 */
export default function useSoundSettings() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_VOLUME_KEY);
      return stored !== null ? Number(stored) : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  });

  // Persist mute state
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(isMuted));
    } catch { /* storage unavailable */ }
  }, [isMuted]);

  // Persist volume
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
    } catch { /* storage unavailable */ }
  }, [volume]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // Ensure AudioContext is unlocked on the first user gesture.
    initAudioContext();
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(Math.max(0, Math.min(1, Number(v) || 0)));
  }, []);

  /**
   * Play a chess sound event, respecting the muted / volume settings.
   */
  const play = useCallback(
    (event) => {
      if (isMuted) return;
      playChessSound(event, volume);
    },
    [isMuted, volume],
  );

  return { isMuted, volume, toggleMute, setVolume, play };
}
