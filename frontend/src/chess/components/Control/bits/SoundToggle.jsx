import { useState, useCallback } from 'react';
import './SoundToggle.css';

/**
 * SoundToggle — Compact mute / volume control rendered in the sidebar.
 *
 * Props:
 *  - isMuted        {boolean}
 *  - volume         {number}  0-1
 *  - onToggle       {() => void}
 *  - onVolumeChange {(v: number) => void}
 */
export default function SoundToggle({ isMuted, volume, onToggle, onVolumeChange }) {
  const [showSlider, setShowSlider] = useState(false);

  const handleVolumeChange = useCallback(
    (e) => {
      if (onVolumeChange) onVolumeChange(Number(e.target.value));
    },
    [onVolumeChange],
  );

  const icon = isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉';

  return (
    <div className="sound-toggle" id="sound-toggle">
      <button
        className="sound-toggle__btn"
        onClick={onToggle}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <span className="sound-toggle__icon">{icon}</span>
        <span className="sound-toggle__label">{isMuted ? 'Sound Off' : 'Sound On'}</span>
      </button>

      {showSlider && !isMuted && (
        <input
          className="sound-toggle__slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
          aria-label="Volume"
        />
      )}
    </div>
  );
}
