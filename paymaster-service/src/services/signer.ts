import { ethers } from 'ethers';
import { config } from '../config';

const signer = new ethers.Wallet(config.signerPrivateKey);

export function getSignerAddress(): string {
  return signer.address;
}
