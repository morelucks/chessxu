import { ethers } from 'ethers';
import { config } from '../config';

// Function selectors for whitelisted Chessxu operations
const WHITELISTED_SELECTORS = new Set([
  ethers.id('submitMove(uint256,string,string)').slice(0, 10),
  ethers.id('createGame(uint256,bool)').slice(0, 10),
  ethers.id('joinGame(uint256)').slice(0, 10),
  ethers.id('resign(uint256)').slice(0, 10),
]);

export interface UserOp {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateChainId(chainId: number): ValidationResult {
  if (chainId !== config.chainId) {
    return { valid: false, error: `Unsupported chainId ${chainId}. Only Celo Mainnet (42220) is accepted.` };
  }
  return { valid: true };
}

export function validateSender(sender: string): ValidationResult {
  if (!ethers.isAddress(sender)) {
    return { valid: false, error: 'Invalid sender address.' };
  }
  return { valid: true };
}

export function validateCallData(callData: string): ValidationResult {
  if (!callData || callData === '0x') {
    return { valid: false, error: 'callData is empty — no function call to sponsor.' };
  }
  const selector = callData.slice(0, 10).toLowerCase();
  if (!WHITELISTED_SELECTORS.has(selector)) {
    return {
      valid: false,
      error: `Function selector ${selector} is not whitelisted. Only submitMove, createGame, joinGame, resign are sponsored.`,
    };
  }
  return { valid: true };
}
