/**
 * Audio module barrel export.
 *
 * Re-exports everything consumers need from a single entry point.
 */

export { playChessSound, initAudioContext } from './SoundEngine';
export { SoundEvent, SOUND_MUTED_KEY, SOUND_VOLUME_KEY, DEFAULT_VOLUME } from './constants';
