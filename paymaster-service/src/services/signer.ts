import { ethers } from 'ethers';
import { config } from '../config';
import type { UserOp } from './validator';

const signer = new ethers.Wallet(config.signerPrivateKey);

export function getSignerAddress(): string {
  return signer.address;
}

/**
 * Computes the EIP-712 hash of a UserOperation as expected by VerifyingPaymaster.
 * Matches the on-chain getHash(userOp, validUntil, validAfter) logic.
 */
function getUserOpHash(userOp: UserOp, validUntil: number, validAfter: number): string {
  const userOpPacked = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    [
      userOp.sender,
      BigInt(userOp.nonce),
      ethers.keccak256(userOp.initCode),
      ethers.keccak256(userOp.callData),
      BigInt(userOp.callGasLimit),
      BigInt(userOp.verificationGasLimit),
      BigInt(userOp.preVerificationGas),
      BigInt(userOp.maxFeePerGas),
      BigInt(userOp.maxPriorityFeePerGas),
    ],
  );

  const userOpHash = ethers.keccak256(userOpPacked);

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'address', 'uint48', 'uint48', 'address', 'uint256'],
    [
      userOpHash,
      config.paymasterAddress,
      validUntil,
      validAfter,
      config.entrypointAddress,
      config.chainId,
    ],
  );

  return ethers.keccak256(encoded);
}

export interface SignResult {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

/**
 * Signs a UserOperation and returns paymasterAndData.
 * paymasterAndData = paymasterAddress ++ abi.encode(validUntil, validAfter) ++ signature
 */
export async function signUserOp(userOp: UserOp): Promise<SignResult> {
  const validUntil = Math.floor(Date.now() / 1000) + config.signValiditySeconds;
  const validAfter = 0;

  const hash = getUserOpHash(userOp, validUntil, validAfter);
  const signature = await signer.signMessage(ethers.getBytes(hash));

  const validityEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint48', 'uint48'],
    [validUntil, validAfter],
  );

  const paymasterAndData = ethers.concat([
    config.paymasterAddress,
    validityEncoded,
    signature,
  ]);

  return {
    paymasterAndData,
    preVerificationGas: userOp.preVerificationGas,
    verificationGasLimit: userOp.verificationGasLimit,
    callGasLimit: userOp.callGasLimit,
  };
}
