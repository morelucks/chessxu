import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { CELO_CONFIG } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';

/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  config: CELO_CONFIG,
  
  /**
   * Connects to the Celo wallet
   */
  connectWallet: async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask or other EVM wallet not found');
    }
    
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(window.ethereum)
    });
    
    const [address] = await walletClient.requestAddresses();
    return address;
  },

  /**
   * Creates a new game on-chain
   * @param {string} wagerInEth - Wager amount in ETH/CELO
   * @param {boolean} isNative - Whether the wager is in native CELO or token
   */
  createGame: async (wagerInEth: string, isNative: boolean) => {
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(window.ethereum!)
    });
    const [address] = await walletClient.requestAddresses();
    
    return await walletClient.writeContract({
      address: CELO_CONFIG.CONTRACT_ADDRESS as `0x${string}`,
      abi: CHESSXU_ABI,
      functionName: 'createGame',
      args: [BigInt(parseEther(wagerInEth)), isNative],
      account: address,
      value: isNative ? parseEther(wagerInEth) : 0n,
    });
  },

};


export default celoService;
