import React from 'react';
import { UPGRADE_THRESHOLD } from '../hooks/useFreemium';
import { useWalletAuth } from '../hooks/useWalletAuth';
import useAppStore from '../zustand/store';
import './FreeGamesGate.css';

interface FreeGamesGateProps {
  gamesPlayed: number;
}

/**
 * Full-screen overlay that blocks gameplay when all free offline games are exhausted.
 * Embeds wallet connection options directly — no intermediate modal.
 */
export default function FreeGamesGate({ gamesPlayed }: FreeGamesGateProps) {
  const { connect } = useWalletAuth();
  const isFarcaster = useAppStore((s) => s.isFarcaster);
  const [connecting, setConnecting] = React.useState<string | null>(null);

  const handleConnect = async (chain: 'privy' | 'celo' | 'farcaster') => {
    setConnecting(chain);
    try {
      await connect({ chain });
    } finally {
      setConnecting(null);
    }
  };

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
          <p>Connect a wallet to unlock <strong>unlimited games</strong>, on-chain play, rankings, and rewards.</p>
        </div>

        {/* Direct Wallet Options — no intermediate modal */}
        <div className="free-games-gate__wallets">
          {/* Privy */}
          <button
            className="free-games-gate__wallet-option free-games-gate__wallet-option--privy"
            onClick={() => handleConnect('privy')}
            disabled={connecting !== null}
          >
            <div className="free-games-gate__wallet-badge free-games-gate__wallet-badge--privy">PRIVY</div>
            <div className="free-games-gate__wallet-info">
              <span className="free-games-gate__wallet-name">
                Privy WalletConnect
                {connecting === 'privy' && <span className="free-games-gate__spinner" />}
              </span>
              <span className="free-games-gate__wallet-desc">Email, Socials, or Embedded Wallet</span>
            </div>
            <span className="free-games-gate__wallet-arrow">→</span>
          </button>

          {/* Farcaster (conditional) */}
          {isFarcaster && (
            <button
              className="free-games-gate__wallet-option free-games-gate__wallet-option--farcaster"
              onClick={() => handleConnect('farcaster')}
              disabled={connecting !== null}
            >
              <div className="free-games-gate__wallet-badge free-games-gate__wallet-badge--farcaster">FC</div>
              <div className="free-games-gate__wallet-info">
                <span className="free-games-gate__wallet-name">
                  Farcaster Wallet
                  {connecting === 'farcaster' && <span className="free-games-gate__spinner" />}
                </span>
                <span className="free-games-gate__wallet-desc">Use your Farcaster wallet</span>
              </div>
              <span className="free-games-gate__wallet-arrow">→</span>
            </button>
          )}

          {/* Celo */}
          <button
            className="free-games-gate__wallet-option free-games-gate__wallet-option--celo"
            onClick={() => handleConnect('celo')}
            disabled={connecting !== null}
          >
            <div className="free-games-gate__wallet-badge free-games-gate__wallet-badge--celo">CELO</div>
            <div className="free-games-gate__wallet-info">
              <span className="free-games-gate__wallet-name">
                Celo Network
                {connecting === 'celo' && <span className="free-games-gate__spinner" />}
              </span>
              <span className="free-games-gate__wallet-desc">MetaMask, Valora, or Web3 wallets</span>
            </div>
            <span className="free-games-gate__wallet-arrow">→</span>
          </button>
        </div>

        <p className="free-games-gate__disclaimer">
          Free • No gas fees required to connect
        </p>
      </div>
    </div>
  );
}
// Free games gate check optimization
