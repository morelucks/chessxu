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
