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
