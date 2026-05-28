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

// ─────────────────────────────────────────────────────────────────────────────
// EIP-712 Constants and Chessxu Moves definitions
// ─────────────────────────────────────────────────────────────────────────────

export const CHESSXU_EIP712_DOMAIN_NAME = 'Chessxu';
export const CHESSXU_EIP712_DOMAIN_VERSION = '1';

// Type hash for Chessxu moves: submitMove(gameId, move, boardState)
export const MOVE_TYPE_HASH = ethers.id('Move(uint256 gameId,string move,string boardState,uint256 nonce)');

/**
 * Returns the exact Domain Separator hash for Chessxu.
 */
export function getChessxuDomainSeparator(chainId: number, contractAddress: string): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        ethers.id('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
        ethers.id(CHESSXU_EIP712_DOMAIN_NAME),
        ethers.id(CHESSXU_EIP712_DOMAIN_VERSION),
        BigInt(chainId),
        contractAddress,
      ]
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────────────

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

/** Validates callData targets a whitelisted Chessxu function selector. */
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

/** Validates all gas-related fields are valid non-negative integers. */
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

/**
 * Recovers or predicts the EOA owner of the SimpleAccount.
 */
export async function getSmartAccountOwner(
  sender: string,
  initCode: string,
  provider: ethers.JsonRpcProvider
): Promise<string> {
  if (initCode && initCode !== '0x') {
    try {
      // Decode owner from initCode
      // initCode starts with factoryAddress (20 bytes / 40 hex chars after '0x') followed by encoded args.
      // So factory address is in characters index 2 to 42 (length 40).
      const callData = '0x' + initCode.slice(42);
      const iface = new ethers.Interface([
        'function createAccount(address owner, uint256 salt) external returns (address)'
      ]);
      const decoded = iface.decodeFunctionData('createAccount', callData);
      return decoded[0].toLowerCase();
    } catch (err) {
      console.error('[validator] Failed to decode owner from initCode:', err);
    }
  }

  // Fallback to on-chain view call
  try {
    const simpleAccount = new ethers.Contract(
      sender,
      ['function owner() view returns (address)'],
      provider
    );
    const owner = await simpleAccount.owner();
    return owner.toLowerCase();
  } catch (err) {
    console.error('[validator] Failed to call owner() on sender contract:', err);
    throw new Error('Could not determine smart account owner.');
  }
}

/**
 * Verifies the EIP-712 structured signature for the transaction sponsorship.
 */
export async function validateEIP712Signature(
  userOp: UserOp,
  chainId: number,
  signature: string | undefined,
  provider: ethers.JsonRpcProvider
): Promise<ValidationResult> {
  if (!signature || signature === '0x') {
    return { valid: false, error: 'Transaction sponsorship request is missing EIP-712 signature.' };
  }

  try {
    // 1. Get the expected EOA owner of this SimpleAccount
    const expectedOwner = await getSmartAccountOwner(userOp.sender, userOp.initCode, provider);

    // 2. Define the EIP-712 domain (configured for Chessxu Moves contract to tie authorization to Chessxu)
    const domain = {
      name: CHESSXU_EIP712_DOMAIN_NAME,
      version: CHESSXU_EIP712_DOMAIN_VERSION,
      chainId: chainId,
      verifyingContract: config.chessxuContractAddress,
    };

    const types = {
      Sponsorship: [
        { name: 'sender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'initCode', type: 'bytes' },
        { name: 'callData', type: 'bytes' },
        { name: 'callGasLimit', type: 'uint256' },
        { name: 'verificationGasLimit', type: 'uint256' },
        { name: 'preVerificationGas', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
      ],
    };

    const value = {
      sender: userOp.sender,
      nonce: BigInt(userOp.nonce),
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: BigInt(userOp.callGasLimit),
      verificationGasLimit: BigInt(userOp.verificationGasLimit),
      preVerificationGas: BigInt(userOp.preVerificationGas),
      maxFeePerGas: BigInt(userOp.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
    };

    // 3. Verify signature matches EOA owner
    const recoveredSigner = ethers.verifyTypedData(domain, types, value, signature);

    if (recoveredSigner.toLowerCase() !== expectedOwner.toLowerCase()) {
      return {
        valid: false,
        error: `Signature verification failed: expected owner ${expectedOwner}, but recovered ${recoveredSigner}`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `EIP-712 signature verification failed: ${err.message || err}` };
  }
}
