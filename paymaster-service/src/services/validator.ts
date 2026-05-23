import { ethers } from 'ethers';
import { config } from '../config';

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
