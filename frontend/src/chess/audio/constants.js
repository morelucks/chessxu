/**
 * Audio subsystem constants.
 */

/** localStorage key used to persist the mute preference. */
export const SOUND_MUTED_KEY = 'chessxu_sound_muted';

/** localStorage key used to persist the volume level. */
export const SOUND_VOLUME_KEY = 'chessxu_sound_volume';

/** Default volume level (0–1). */
export const DEFAULT_VOLUME = 0.7;

/** All valid sound event types. */
export const SoundEventTypes = Object.freeze({
  MOVE: 'move',
  CAPTURE: 'capture',
  CHECK: 'check',
  CASTLE: 'castle',
  PROMOTE: 'promote',
  GAME_START: 'game-start',
  GAME_WIN: 'game-win',
  GAME_LOSS: 'game-loss',
  GAME_DRAW: 'game-draw',
});
