import { GAME_STATUS } from '../chess/blockchainConstants';
import { useStacksChess } from '../hooks/useStacksChess';
import { useCeloChess } from '../hooks/useCeloChess';
import useAppStore from '../zustand/store';
import GaslessBadge from './ui/GaslessBadge';
import './GameStatusBanner.css';

interface Props {
  status: number | null;
  gameId: number | null;
  gasSponsored?: boolean;
}

export default function GameStatusBanner({ status, gameId, gasSponsored: propGasSponsored }: Props) {
  const { getGameStatusString: getStacksStatus } = useStacksChess();
  const { getGameStatusString: getCeloStatus, gasSponsored: hookGasSponsored } = useCeloChess();
  
  const gasSponsored = propGasSponsored ?? hookGasSponsored;
  const activeChain = useAppStore((state) => state.activeChain);
  
  if (status === null || gameId === null) return null;

  const getGameStatusString = activeChain === 'celo' ? getCeloStatus : getStacksStatus;
  const label = getGameStatusString(status);
  const isActive = status === GAME_STATUS.WAITING || status === GAME_STATUS.ONGOING;

  return (
    <div className={`game-banner ${isActive ? 'game-banner--active' : 'game-banner--ended'}`}>
      <div className="game-banner__main">
        <span className="game-banner__id">Game #{gameId}</span>
        <span className="game-banner__status">{label}</span>
      </div>
      {activeChain === 'celo' && gasSponsored && (
        <div className="game-banner__sponsored animate-pulse">
          <GaslessBadge />
          <span className="text-[10px] uppercase tracking-tighter text-emerald-400 font-bold ml-1">Sponsored</span>
        </div>
      )}
      {activeChain === 'celo' && !gasSponsored && (
        <div className="game-banner__fallback">
          <span className="text-[10px] uppercase tracking-tighter text-amber-400 font-bold">Gas Required (CELO)</span>
        </div>
      )}
    </div>
  );
}
