/*
npm
Npm: Npm download concentration
NPM Package Downloads
Npm: Npm download uniform
Npm: Npm excluded packages quality
Npm: Npm monorepo collapsed
Npm: Npm download sparse burst
Npm: Npm excluded packages
*/

/**
 * Represents the local client-side game state.
 */
export interface GameState {
  position: any[];
  turn: string;
  candidateMoves: any[];
  movesList: any[];
  promotionSquare: any;
  status: string;
  castleDirection: {
    w: string;
    b: string;
  };
  points: {
    w: number;
    b: number;
  };
  gameMode: string;
  playerColor?: string;
}

export interface OnChainGameState {
  status: number | string;
  turn?: { value: string } | string;
  'player-w'?: string;
  'player-b'?: { value: string } | null;
  'last-move'?: { value: string } | null;
}

/**
 * Represents the player stake details.
 */
export interface StakeData {
  amount: string | number;
  isStx: boolean;
  status?: string;
  id?: number;
  savedAt?: string;
  updatedAt?: number;
}

/**
 * Represents a result entry in the leaderboard.
 */
export interface LeaderboardResult {
  name: string;
  score: number;
  winner?: string;
}

export interface GameModeSelectionProps {
  gameMode: string;
  onNewGame: (mode: string) => void;
  onShowStakingModal: (show: boolean) => void;
}

export interface StakeSectionProps {
  appState: GameState;
}
