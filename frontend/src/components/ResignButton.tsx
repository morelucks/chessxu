import { useState } from 'react';
import { useStacksChess } from '../hooks/useStacksChess';
import { useCeloChess } from '../hooks/useCeloChess';
import useAppStore from '../zustand/store';
import './ResignButton.css';

export default function ResignButton() {
  const { resign: stacksResign } = useStacksChess();
  const { resign: celoResign } = useCeloChess();
  
  const activeGameId = useAppStore((state) => state.activeGameId);
  const activeChain = useAppStore((state) => state.activeChain);
  const [confirming, setConfirming] = useState(false);

  if (!activeGameId) return null;

  const handleClick = () => {
    if (!confirming) { setConfirming(true); return; }
    
    const resignFn = activeChain === 'celo' ? celoResign : stacksResign;
    
    resignFn(activeGameId)
      .then(() => setConfirming(false))
      .catch(() => setConfirming(false));
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
