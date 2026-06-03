import { useState, useCallback } from 'react';
import './SoundToggle.css';

/**
 * SoundToggle — A compact audio settings component that allows users to
 * mute/unmute sound effects and adjust the volume.
 *
 * Props:
 *   isMuted     — Whether sound is currently muted.
 *   volume      — Current volume level (0–1).
 *   onToggle    — Callback invoked when the mute button is clicked.
 *   onVolumeChange — Callback invoked when the slider value changes.
 */
const SoundToggle = ({ isMuted, volume, onToggle, onVolumeChange }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    setIsAnimating(true);
    onToggle();
    // Remove the pulse animation class after it plays.
    setTimeout(() => setIsAnimating(false), 300);
  }, [onToggle]);

  const handleVolumeChange = useCallback(
    (e) => {
      const value = parseFloat(e.target.value);
      if (onVolumeChange) onVolumeChange(value);
    },
    [onVolumeChange],
  );

  const btnClass = [
    'sound-toggle__btn',
    isMuted ? 'sound-toggle__btn--muted' : '',
    isAnimating && !isMuted ? 'sound-toggle__btn--playing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClass = [
    'sound-toggle__label',
    isMuted ? 'sound-toggle__label--muted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="sound-toggle" id="sound-toggle-control">
      <button
        className={btnClass}
        onClick={handleToggle}
        title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        id="sound-mute-btn"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <span className={labelClass}>
        {isMuted ? 'Muted' : 'Sound On'}
      </span>

      {!isMuted && (
        <div className="sound-toggle__volume">
          <input
            type="range"
            className="sound-toggle__slider"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            id="sound-volume-slider"
          />
        </div>
      )}
    </div>
  );
};

export default SoundToggle;
