/**
 * OfflineModeBanner — #186 freemium offline-first banner
 *
 * Shown to users who are playing without a wallet.
 * Displays their progress and an optional upgrade prompt.
 */

import React from 'react';
import { useFreemium, UPGRADE_THRESHOLD } from '../hooks/useFreemium';
