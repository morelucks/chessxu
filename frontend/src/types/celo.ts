/**
 * Celo Contract and Service Type Definitions
 */

export interface CeloGameStruct {
  playerW: `0x${string}`;
  playerB: `0x${string}`;
  white?: string;
  black?: string;
  wager: bigint;
  isNative: boolean;
  boardState: string;
  turn: string;
  status: number;
  winner?: number;
}

export interface CeloscanTxResult {
  input?: string;
  isError?: string;
  timeStamp?: string;
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  [key: string]: unknown;
}

export interface GasSponsorshipInfo {
  isSponsored: boolean;
  sponsor: string;
  method: string;
  maxSaved: number;
}
