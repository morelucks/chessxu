/**
 * OfflineModeBanner — #186 freemium offline-first banner
 *
 * Shown to users who are playing without a wallet.
 * Displays their progress and an optional upgrade prompt.
 */

import React from 'react';
import { useFreemium, UPGRADE_THRESHOLD } from '../hooks/useFreemium';
import { useWalletAuth } from '../hooks/useWalletAuth';
import './OfflineModeBanner.css';

/**
 * Compact status bar shown inside ChessScreen when user is offline.
 * Full upgrade prompt appears after UPGRADE_THRESHOLD games.
 */
const OfflineModeBanner: React.FC = () => {
    const { isOfflineMode, offlineGamesPlayed, shouldShowUpgradePrompt, dismissUpgradePrompt } = useFreemium();
    const { connect } = useWalletAuth();

    if (!isOfflineMode) return null;

    const handleConnect = () => connect();

    return (
        <div className="offline-banner" role="banner" aria-label="Offline mode status">
            {/* Compact status strip */}
            <div className="offline-banner__strip">
                <span className="offline-banner__dot" aria-hidden="true" />
                <span className="offline-banner__label">Offline Mode</span>
                <span className="offline-banner__games" aria-label={`${offlineGamesPlayed} of ${UPGRADE_THRESHOLD} free games played`}>
                    {offlineGamesPlayed}/{UPGRADE_THRESHOLD} free games
                </span>
                <button
                    className="offline-banner__connect-btn"
                    onClick={handleConnect}
                    aria-label="Connect wallet to unlock on-chain features"
                >
                    Connect Wallet
                </button>
            </div>

            {/* Full upgrade prompt — shown after UPGRADE_THRESHOLD games */}
            {shouldShowUpgradePrompt && (
                <div className="offline-banner__prompt" role="dialog" aria-modal="false" aria-label="Upgrade to on-chain play">
                    <button
                        className="offline-banner__dismiss"
                        onClick={dismissUpgradePrompt}
                        aria-label="Dismiss upgrade prompt"
                    >
                        &times;
                    </button>
                    <div className="offline-banner__prompt-icon" aria-hidden="true">&#x265F;</div>
                    <h3 className="offline-banner__prompt-title">Ready to play for real?</h3>
                    <p className="offline-banner__prompt-body">
                        You&apos;ve played {offlineGamesPlayed} free games.
                        Connect your wallet to stake CELO, earn rewards, and climb the leaderboard.
                    </p>
                    <div className="offline-banner__prompt-features">
                        <div className="offline-banner__feature">
                            <span className="offline-banner__feature-icon" aria-hidden="true">⚡</span>
                            <span>Stake CELO on matches</span>
                        </div>
                        <div className="offline-banner__feature">
                            <span className="offline-banner__feature-icon" aria-hidden="true">🏆</span>
                            <span>Climb the on-chain leaderboard</span>
                        </div>
                        <div className="offline-banner__feature">
                            <span className="offline-banner__feature-icon" aria-hidden="true">💰</span>
                            <span>Win real CELO rewards</span>
                        </div>
                        <div className="offline-banner__feature">
                            <span className="offline-banner__feature-icon" aria-hidden="true">🧩</span>
                            <span>Gasless moves via Paymaster</span>
                        </div>
                    </div>
                    <button
                        className="offline-banner__upgrade-btn"
                        onClick={handleConnect}
                    >
                        Connect Wallet &amp; Play On-Chain
                    </button>
                    <button
                        className="offline-banner__keep-offline-btn"
                        onClick={dismissUpgradePrompt}
                    >
                        Keep playing offline
                    </button>
                </div>
            )}
        </div>
    );
};

export default OfflineModeBanner;
    // Banner renders null immediately when wallet connects (isOfflineMode=false)
    // Upgrade prompt slides in with CSS animation to draw attention gently
    // Feature list gives concrete reasons to upgrade without being pushy
