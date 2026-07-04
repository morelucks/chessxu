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
