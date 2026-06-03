/**
 * Audio subsystem constants.
 */

export const SOUND_MUTED_KEY = 'chessxu_sound_muted';
export const SOUND_VOLUME_KEY = 'chessxu_sound_volume';
export const DEFAULT_VOLUME = 0.6;

/** Sound event types triggered by game state changes. */
export const SoundEvent = Object.freeze({
  MOVE: 'move',
  CAPTURE: 'capture',
  CHECK: 'check',
  CASTLE: 'castle',
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  ILLEGAL: 'illegal',
});
