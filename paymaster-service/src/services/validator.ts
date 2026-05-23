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

/** Validates chainId is Celo Mainnet (42220). */
export function validateChainId(chainId: number): ValidationResult {
  if (chainId !== config.chainId) {
    return { valid: false, error: `Unsupported chainId ${chainId}. Only Celo Mainnet (42220) is accepted.` };
  }
  return { valid: true };
}

/** Validates sender is a valid Ethereum address. */
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

export function validateGasFields(userOp: UserOp): ValidationResult {
  const gasFields: (keyof UserOp)[] = ['callGasLimit', 'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas', 'maxPriorityFeePerGas'];
  for (const field of gasFields) {
    try {
      const val = BigInt(userOp[field]);
      if (val < 0n) throw new Error('negative');
    } catch {
      return { valid: false, error: `Invalid gas field: ${field}` };
    }
  }
  return { valid: true };
}

export function validateUserOp(userOp: UserOp, chainId: number): ValidationResult {
  const checks = [
    validateChainId(chainId),
    validateSender(userOp.sender),
    validateCallData(userOp.callData),
    validateGasFields(userOp),
  ];
  return checks.find(r => !r.valid) ?? { valid: true };
}

/**
 * Verifies the on-chain nonce for the sender matches the UserOp nonce.
 */
export async function validateNonce(userOp: UserOp, provider: ethers.JsonRpcProvider): Promise<ValidationResult> {
  try {
    const ENTRYPOINT_ABI = ['function getNonce(address sender, uint192 key) view returns (uint256)'];
    const entrypoint = new ethers.Contract(config.entrypointAddress, ENTRYPOINT_ABI, provider);
    const onChainNonce: bigint = await entrypoint.getNonce(userOp.sender, 0);
    const opNonce = BigInt(userOp.nonce);
    if (opNonce !== onChainNonce) {
      return { valid: false, error: `Nonce mismatch: expected ${onChainNonce}, got ${opNonce}` };
    }
    return { valid: true };
  } catch (err) {
    console.warn('[validator] Nonce check failed (non-fatal):', err);
    return { valid: true };
  }
}
