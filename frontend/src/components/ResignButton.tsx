import { useState } from 'react';
import { useOnChainGame } from '../chess/hooks/useOnChainGame';
import './ResignButton.css';

export default function ResignButton() {
  const { resign, activeGameId } = useOnChainGame();
  const [confirming, setConfirming] = useState(false);

  if (!activeGameId) return null;

  const handleClick = () => {
    if (!confirming) { setConfirming(true); return; }
    resign(
      () => setConfirming(false),
      () => setConfirming(false),
    );
  };

  return (
    <button
      className={`resign-btn ${confirming ? 'resign-btn--confirm' : ''}`}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'Confirm resign?' : 'Resign'}
    </button>
  );
}
