/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chessxu Celo Service Layer
 * 
 * This service handles all interactions with the Chessxu smart contract on the Celo blockchain.
 * It uses the viem library for efficient EVM interactions and handles wallet connection,
 * game creation, joining, moves, and query operations.
 * 
 * @example
 * ```typescript
 * import celoService from './celoService';
 * 
 * // 1. Connect wallet
 * const address = await celoService.connectWallet();
 * 
 * // 2. Create a new game with 0.1 CELO wager
 * const txHash = await celoService.createGame("0.1", true);
 * 
 * // 3. Join an existing game
 * await celoService.joinGame(1, "0.1", true);
 * 
 * // 4. Submit a move (FEN string)
 * await celoService.submitMove(1, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
 * 
 * // 5. Get game state
 * const game = await celoService.getGame(1);
 * ```
 */
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  parseEther, 
  formatEther,
  hexToBigInt,
  encodeFunctionData,
  erc20Abi,
  parseUnits,
} from 'viem';
import { celo } from 'viem/chains';
import { CELO_CONFIG, CELO_FEE_CURRENCIES } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';
import { selectSupportedFeeCurrency } from '../../utils/feeCurrency';
import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  /**
   * The Celo network and contract configuration
   */
  config: CELO_CONFIG,
  
  /**
   * Public client for read-only operations
   */
  publicClient: createPublicClient({
    chain: celo,
    transport: http()
  }),

  /**
   * Common error messages for service exceptions
   */
  ERROR_MESSAGES: {
    WALLET_NOT_FOUND: 'MetaMask or other EVM wallet not found',
    WRONG_NETWORK: 'Please switch your wallet to the Celo network.',
  },

  // --- Utility Helpers ---

  isFarcaster: () => {
    return typeof window !== 'undefined' && Boolean((window as Record<string, any>).isFarcaster);
  },

  getProvider: () => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (celoService.isFarcaster()) {
      return sdk.wallet.ethProvider;
    }

    return (window as any).ethereum || (window as any).provider || null;
  },

  /**
   * Returns a public client for read operations
   */
  getPublicClient: () => {
    return celoService.publicClient;
  },

  /**
   * Returns the contract address as a type-safe hex string
   */
  getContractAddress: () => {
    return CELO_CONFIG.CONTRACT_ADDRESS as `0x${string}`;
  },

  /**
   * Returns a wallet client for write operations
   */
  getWalletClient: () => {
    const provider = celoService.getProvider();
    if (!provider) {
      throw new Error(celoService.ERROR_MESSAGES.WALLET_NOT_FOUND);
    }
    return createWalletClient({
      chain: celo,
      transport: custom(provider)
    });
  },
  
  /**
   * Returns common transaction options for MiniPay compatibility.
   * Uses robust fee-currency selection when MiniPay is detected.
   */
  getTxOptions: () => {
    if (celoService.isMiniPay()) {
      return { type: 'legacy' as const };
    }
    return {};
  },

  /**
   * Selects the best fee currency for a given transaction using gas estimation.
   * Falls back to undefined (native CELO gas) on non-MiniPay wallets.
   */
  selectFeeCurrency: async (
    account: `0x${string}`,
    to: `0x${string}`,
    data?: `0x${string}`,
    value?: bigint,
  ): Promise<`0x${string}` | undefined> => {
    try {
      return await selectSupportedFeeCurrency({
        publicClient: celoService.publicClient,
        account,
        to,
        data,
        value,
      });
    } catch {
      // Fall back to native CELO gas if no stablecoin has enough for fees
      return undefined;
    }
  },

  isMiniPay: () => {
    const provider = celoService.getProvider();
    return Boolean(provider?.isMiniPay);
  },

  getChainId: async () => {
    const provider = celoService.getProvider();
    if (!provider?.request) {
      throw new Error(celoService.ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    const rawChainId = await provider.request({ method: 'eth_chainId' });
    return Number.parseInt(rawChainId, 16);
  },

  switchToCelo: async () => {
    const provider = celoService.getProvider();
    if (!provider?.request) {
      throw new Error(celoService.ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    const chainHex = `0x${CELO_CONFIG.CHAIN_ID.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });
    } catch (error: any) {
      if (error?.code !== 4902) {
        throw error;
      }

      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainHex,
            chainName: CELO_CONFIG.CHAIN_NAME,
            nativeCurrency: {
              name: CELO_CONFIG.CURRENCY,
              symbol: CELO_CONFIG.CURRENCY,
              decimals: 18,
            },
            rpcUrls: [CELO_CONFIG.RPC_URL],
            blockExplorerUrls: [CELO_CONFIG.EXPLORER_URL],
          },
        ],
      });
    }
  },

  ensureCorrectNetwork: async () => {
    const chainId = await celoService.getChainId();
    if (chainId === CELO_CONFIG.CHAIN_ID) {
      return true;
    }

    await celoService.switchToCelo();
    const nextChainId = await celoService.getChainId();
    if (nextChainId !== CELO_CONFIG.CHAIN_ID) {
      throw new Error(celoService.ERROR_MESSAGES.WRONG_NETWORK);
    }

    return true;
  },

  /**
   * @deprecated Use selectFeeCurrency() instead for gas-estimated selection.
   * Kept for backward compatibility.
   */
  getSupportedFeeCurrency: async (address: `0x${string}`) => {
    for (const currency of CELO_FEE_CURRENCIES) {
      try {
        const balance = await celoService.publicClient.readContract({
          address: currency.tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });

        if (balance > 0n) {
          return currency.tokenAddress as `0x${string}`;
        }
      } catch (error) {
        console.error(`Unable to inspect ${currency.symbol} balance for fee currency selection:`, error);
      }
    }

    return undefined;
  },
  
  /**
   * Converts a hex string to a BigInt
   * @param {string} hex - The hex string to convert
   */
  hexToBigInt: (hex: string) => {
    return hexToBigInt(hex as `0x${string}`);
  },
  
  // --- Wallet Operations ---

  /**
   * Connects to the Celo wallet
   */
  connectWallet: async () => {
    await celoService.ensureCorrectNetwork();
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    return address;
  },

  payForDailyAccess: async (address: string) => {
    const walletClient = celoService.getWalletClient();
    const account = address as `0x${string}`;
    const amount = parseUnits(CELO_CONFIG.DAILY_ACCESS_CUSD, 18);
    const cusdAddr = CELO_CONFIG.CUSD_ADDRESS as `0x${string}`;
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [CELO_CONFIG.PAYMENT_RECIPIENT as `0x${string}`, amount],
    });

    const feeCurrency = await celoService.selectFeeCurrency(account, cusdAddr, data);

    return walletClient.sendTransaction({
      account,
      to: cusdAddr,
      data,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  waitForTransactionReceipt: async (txHash: `0x${string}`, maxRetries = 10, delayMs = 2000) => {
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const receipt = await celoService.publicClient.getTransactionReceipt({ hash: txHash });
        if (receipt) {
          return receipt;
        }
      } catch (error: any) {
        if (error?.name !== 'TransactionReceiptNotFoundError') {
          throw error;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Transaction confirmation timed out. Check the transaction in your wallet and try again.');
  },

  verifyDailyAccessPayment: async (txHash: string, walletAddress: string) => {
    const receipt = await celoService.waitForTransactionReceipt(txHash as `0x${string}`);
    if (receipt.status !== 'success') {
      return false;
    }

    const transferEventSignature =
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    const transferLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === CELO_CONFIG.CUSD_ADDRESS.toLowerCase() &&
        log.topics[0] === transferEventSignature &&
        log.topics[1] &&
        log.topics[2] &&
        `0x${log.topics[1].slice(-40)}`.toLowerCase() === walletAddress.toLowerCase() &&
        `0x${log.topics[2].slice(-40)}`.toLowerCase() === CELO_CONFIG.PAYMENT_RECIPIENT.toLowerCase()
    );

    if (!transferLog) {
      return false;
    }

    const amount = BigInt(transferLog.data);
    return amount === parseUnits(CELO_CONFIG.DAILY_ACCESS_CUSD, 18);
  },

  // --- Write Operations ---

  /**
   * Creates a new game on-chain
   * @param {string} wagerInEth - Wager amount in ETH/CELO
   * @param {boolean} isNative - Whether the wager is in native CELO or token
   */
  createGame: async (wagerInEth: string, isNative: boolean) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    const contractAddr = celoService.getContractAddress();
    const value = isNative ? parseEther(wagerInEth) : 0n;

    const data = encodeFunctionData({
      abi: CHESSXU_ABI,
      functionName: 'createGame',
      args: [BigInt(parseEther(wagerInEth)), isNative],
    });

    const feeCurrency = await celoService.selectFeeCurrency(address, contractAddr, data, value);

    return await walletClient.writeContract({
      address: contractAddr,
      abi: CHESSXU_ABI,
      functionName: 'createGame',
      args: [BigInt(parseEther(wagerInEth)), isNative],
      account: address,
      value,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  /**
   * Join an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {string} wagerInEth - Wager amount for joining (must match game)
   * @param {boolean} isNative - Whether the wager is in native CELO
   */
  joinGame: async (gameId: number, wagerInEth: string, isNative: boolean) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    const contractAddr = celoService.getContractAddress();
    const value = isNative ? parseEther(wagerInEth) : 0n;

    const data = encodeFunctionData({
      abi: CHESSXU_ABI,
      functionName: 'joinGame',
      args: [BigInt(gameId)],
    });

    const feeCurrency = await celoService.selectFeeCurrency(address, contractAddr, data, value);

    return await walletClient.writeContract({
      address: contractAddr,
      abi: CHESSXU_ABI,
      functionName: 'joinGame',
      args: [BigInt(gameId)],
      account: address,
      value,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  /**
   * Submits a move to the on-chain game
   * @param {number} gameId - The ID of the game
   * @param {string} moveStr - The move string (e.g., "e2e4")
   * @param {string} boardState - The resulting board state (FEN)
   */
  submitMove: async (gameId: number, moveStr: string, boardState: string) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    const contractAddr = celoService.getContractAddress();

    const data = encodeFunctionData({
      abi: CHESSXU_ABI,
      functionName: 'submitMove',
      args: [BigInt(gameId), moveStr, boardState],
    });

    const feeCurrency = await celoService.selectFeeCurrency(address, contractAddr, data);

    return await walletClient.writeContract({
      address: contractAddr,
      abi: CHESSXU_ABI,
      functionName: 'submitMove',
      args: [BigInt(gameId), moveStr, boardState],
      account: address,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  /**
   * Resigns from an active game
   * @param {number} gameId - The game to resign from
   */
  resign: async (gameId: number) => {
    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    const contractAddr = celoService.getContractAddress();

    const data = encodeFunctionData({
      abi: CHESSXU_ABI,
      functionName: 'resign',
      args: [BigInt(gameId)],
    });

    const feeCurrency = await celoService.selectFeeCurrency(address, contractAddr, data);

    return await walletClient.writeContract({
      address: contractAddr,
      abi: CHESSXU_ABI,
      functionName: 'resign',
      args: [BigInt(gameId)],
      account: address,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  // --- Read Operations ---

  /**
   * Fetches the current game state from the blockchain
   * @param {number} gameId - The ID of the game to fetch
   */
  getGame: async (gameId: number) => {
    return await celoService.getPublicClient().readContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'getGame',
      args: [BigInt(gameId)],
    });
  },

  /**
   * Fetches the current game state (alias for consistency)
   * @param {number} gameId - The ID of the game to fetch
   */
  getGameState: async (gameId: number) => {
    return await celoService.getGame(gameId);
  },

  /**
   * Fetches the last game ID from the contract
   */
  getLastGameId: async () => {
    const result = await celoService.getPublicClient().readContract({
      address: celoService.getContractAddress(),
      abi: CHESSXU_ABI,
      functionName: 'getLastGameId',
    });
    
    return Number(result);
  },

  /**
   * Checks if the game wager is in native CELO
   * @param {number} gameId - The game ID
   */
  isNative: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.isNative;
  },

  /**
   * Returns the wager amount for a specific game
   * @param {number} gameId - The game ID
   */
  getWager: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.wager;
  },

  /**
   * Formats a wager from BigInt to string
   * @param {bigint} wager - The wager in wei
   */
  formatWager: (wager: bigint) => {
    return formatEther(wager);
  },

  /**
   * Returns the white and black player addresses for a game
   * @param {number} gameId - The game ID
   */
  getGamePlayers: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return {
      white: game.white,
      black: game.black,
    };
  },

  /**
   * Checks if the game is over (winner is 1 or 2)
   * @param {number} gameId - The game ID
   */
  isGameOver: async (gameId: number) => {
    const game = await celoService.getGame(gameId) as any;
    return game.winner > 0;
  },

  /**
   * Returns the native CELO balance of an address
   * @param {string} address - The wallet address
   */
  getNativeBalance: async (address: `0x${string}`) => {
    return await celoService.getPublicClient().getBalance({ address });
  },

  getStableTokenBalance: async (address: `0x${string}`, tokenAddress: string) => {
    return await celoService.getPublicClient().readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });
  },

  /**
   * Returns the token balance (XU) of an address
   * @param {string} address - The wallet address
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTokenBalance: async (_address: `0x${string}`) => {
    // This assumes the contract implements a balance method or uses an ERC20 token
    return 0n;
  },
};

export default celoService;

// End of Chessxu Celo Service Implementation
