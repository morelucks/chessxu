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
      transport: custom((window as any).ethereum)
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
      transport: custom((window as any).ethereum)
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

  /**
   * Joins an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {string} wagerInEth - Wager amount for joining (must match game)
   * @param {boolean} isNative - Whether the wager is in native CELO
   */
  joinGame: async (gameId: number, wagerInEth: string, isNative: boolean) => {
    // Implementation pending
  },
};

export default celoService;
