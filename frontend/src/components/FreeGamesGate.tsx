import { useWalletAuth } from '../hooks/useWalletAuth';
import { UPGRADE_THRESHOLD } from '../hooks/useFreemium';
import './FreeGamesGate.css';

interface FreeGamesGateProps {
  gamesPlayed: number;
}

/**
 * Full-screen overlay that blocks gameplay when all free offline games are exhausted.
 * Prompts the user to connect a wallet to continue playing.
 */
export default function FreeGamesGate({ gamesPlayed }: FreeGamesGateProps) {
  const { isConnecting, connect } = useWalletAuth();

  return (
    <div className="free-games-gate">
      <div className="free-games-gate__backdrop" />
      <div className="free-games-gate__card">
        {/* Decorative chess piece */}
        <div className="free-games-gate__icon">
          <span className="free-games-gate__icon-piece">♟</span>
          <div className="free-games-gate__icon-ring" />
          <div className="free-games-gate__icon-ring free-games-gate__icon-ring--outer" />
        </div>

        {/* Header */}
        <h2 className="free-games-gate__title">Free Games Exhausted</h2>
        <p className="free-games-gate__subtitle">
          You've played <strong>{gamesPlayed}/{UPGRADE_THRESHOLD}</strong> free games
        </p>

        {/* Progress bar */}
        <div className="free-games-gate__progress-track">
          <div
            className="free-games-gate__progress-fill"
            style={{ width: '100%' }}
          />
          {Array.from({ length: UPGRADE_THRESHOLD }).map((_, i) => (
            <div
              key={i}
              className="free-games-gate__progress-dot"
              style={{ left: `${((i + 1) / UPGRADE_THRESHOLD) * 100}%` }}
            >
              <span className="free-games-gate__progress-check">✓</span>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="free-games-gate__message">
          <p>Connect your wallet to unlock <strong>unlimited games</strong>, on-chain play, rankings, and rewards.</p>
        </div>

        {/* Benefits grid */}
        <div className="free-games-gate__benefits">
          <div className="free-games-gate__benefit">
            <span className="free-games-gate__benefit-icon">♛</span>
            <span>Unlimited Games</span>
          </div>
          <div className="free-games-gate__benefit">
            <span className="free-games-gate__benefit-icon">⚔️</span>
            <span>PvP Matches</span>
          </div>
          <div className="free-games-gate__benefit">
            <span className="free-games-gate__benefit-icon">🏆</span>
            <span>Leaderboard</span>
          </div>
          <div className="free-games-gate__benefit">
            <span className="free-games-gate__benefit-icon">💎</span>
            <span>Earn Rewards</span>
          </div>
        </div>

        {/* CTA */}
        <button
          className="free-games-gate__cta"
          onClick={() => connect()}
          disabled={isConnecting}
        >
          <span className="free-games-gate__cta-icon">⚡</span>
          {isConnecting ? 'Connecting…' : 'Connect Wallet to Continue'}
        </button>

        <p className="free-games-gate__disclaimer">
          Free • No gas fees required to connect
        </p>
      </div>
    </div>
  );
}
