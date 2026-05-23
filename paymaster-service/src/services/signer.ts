import { ethers } from 'ethers';
import { config } from '../config';
import type { UserOp } from './validator';

const signer = new ethers.Wallet(config.signerPrivateKey);

export function getSignerAddress(): string {
  return signer.address;
}

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
