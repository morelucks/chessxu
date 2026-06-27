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
  concat,
} from 'viem';
import { getUserOperationHash } from 'viem/account-abstraction';
import { celo } from 'viem/chains';
import { CELO_CONFIG, CELO_FEE_CURRENCIES, PAYMASTER_CONFIG } from '../blockchainConstants';
import { CHESSXU_ABI } from './contractAbi';
import { selectSupportedFeeCurrency } from '../../utils/feeCurrency';
import {
  sponsorUserOp,
  submitUserOp,
  waitForUserOpReceipt,
  UserOperation,
} from './paymasterClient';


/**
 * Service to handle all Celo blockchain interactions
 */
const celoService = {
  /**
   * The Celo network and contract configuration
   */
  config: CELO_CONFIG,
  
  /**
   * Returns gas sponsorship metadata for the current session
   */
  getGasSponsorshipInfo: () => ({
    isSponsored: true,
    sponsor: 'Chessxu Foundation',
    method: 'Paymaster',
    maxSaved: 0.15
  }),

  /**
   * Whether transactions are currently being sponsored by the paymaster
   */
  gasSponsored: true,
  
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

  getProvider: () => {
    if (typeof window === 'undefined') {
      return null;
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

  payForDailyAccess: async () => {
    const walletClient = celoService.getWalletClient();
    
    // Ensure account is authorized by the provider. 
    // This fixes "The requested account and/or method has not been authorized by the user" errors.
    const [account] = await walletClient.requestAddresses();
    
    const amount = parseUnits(CELO_CONFIG.DAILY_ACCESS_CUSD, 18);
    const cusdAddr = CELO_CONFIG.CUSD_ADDRESS as `0x${string}`;
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [CELO_CONFIG.PAYMENT_RECIPIENT as `0x${string}`, amount],
    });

    const feeCurrency = await celoService.selectFeeCurrency(account, cusdAddr, data);

    return walletClient.writeContract({
      address: cusdAddr,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [CELO_CONFIG.PAYMENT_RECIPIENT as `0x${string}`, amount],
      account,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    });
  },

  /**
   * Pays for daily access using native CELO instead of USDm.
   */
  payForDailyAccessWithCelo: async () => {
    const walletClient = celoService.getWalletClient();
    const [account] = await walletClient.requestAddresses();
    const value = parseEther(CELO_CONFIG.DAILY_ACCESS_CELO);

    return walletClient.sendTransaction({
      to: CELO_CONFIG.PAYMENT_RECIPIENT as `0x${string}`,
      value,
      account,
      ...celoService.getTxOptions(),
    });
  },

  /**
   * Verifies a native CELO daily access payment by checking the transaction receipt.
   */
  verifyDailyAccessPaymentCelo: async (txHash: string, walletAddress: string) => {
    const receipt = await celoService.waitForTransactionReceipt(txHash as `0x${string}`);
    if (receipt.status !== 'success') return false;

    const tx = await celoService.publicClient.getTransaction({ hash: txHash as `0x${string}` });
    return (
      tx.from.toLowerCase() === walletAddress.toLowerCase() &&
      tx.to?.toLowerCase() === CELO_CONFIG.PAYMENT_RECIPIENT.toLowerCase() &&
      tx.value >= parseEther(CELO_CONFIG.DAILY_ACCESS_CELO)
    );
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

  /**
   * Executes a transaction through the ERC-4337 Paymaster pipeline (gasless).
   */
  executeWithPaymaster: async (
    targetAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
    value: bigint = 0n,
  ): Promise<`0x${string}`> => {
    const walletClient = celoService.getWalletClient();
    const publicClient = celoService.getPublicClient();
    const [ownerAddress] = await walletClient.requestAddresses();

    const factoryAddress = '0x9406Cc6185a346906296840746125a0E44976454' as `0x${string}`;

    // Predict Smart Account Address
    const scAddress = await publicClient.readContract({
      address: factoryAddress,
      abi: [{
        name: 'getAddress',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'salt', type: 'uint256' }
        ],
        outputs: [{ type: 'address' }]
      }],
      functionName: 'getAddress',
      args: [ownerAddress, 0n]
    });

    // Check if deployment is needed
    const code = await publicClient.getCode({ address: scAddress });
    const isDeployed = code && code !== '0x';

    const initCode = isDeployed
      ? '0x' as `0x${string}`
      : concat([
          factoryAddress,
          encodeFunctionData({
            abi: [{
              name: 'createAccount',
              type: 'function',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'salt', type: 'uint256' }
              ]
            }],
            functionName: 'createAccount',
            args: [ownerAddress, 0n]
          })
        ]);

    // Encode call to SimpleAccount.execute
    const callData = encodeFunctionData({
      abi: [{
        name: 'execute',
        type: 'function',
        inputs: [
          { name: 'dest', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'func', type: 'bytes' }
        ]
      }],
      functionName: 'execute',
      args: [
        targetAddress,
        value,
        encodeFunctionData({
          abi,
          functionName,
          args
        })
      ]
    });

    // Get nonce from EntryPoint
    const nonce = await publicClient.readContract({
      address: PAYMASTER_CONFIG.ENTRYPOINT_ADDRESS,
      abi: [{
        name: 'getNonce',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'sender', type: 'address' },
          { name: 'key', type: 'uint256' }
        ],
        outputs: [{ type: 'uint256' }]
      }],
      functionName: 'getNonce',
      args: [scAddress, 0n]
    });

    // Estimate Fees
    let maxFeePerGas = 20_000_000_000n;
    let maxPriorityFeePerGas = 1_000_000_000n;
    try {
      const fees = await publicClient.estimateFeesPerGas();
      if (fees.maxFeePerGas) maxFeePerGas = fees.maxFeePerGas;
      if (fees.maxPriorityFeePerGas) maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
    } catch {
      // Use fallback defaults
    }

    const unsignedUserOp: UserOperation = {
      sender: scAddress,
      nonce,
      initCode,
      callData,
      callGasLimit: 200_000n,
      verificationGasLimit: 150_000n,
      preVerificationGas: 50_000n,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData: '0x',
      signature: '0x',
    };

    // 1. Sign structured EIP-712 Sponsorship request
    const sponsorshipSignature = await walletClient.signTypedData({
      account: ownerAddress,
      domain: {
        name: 'Chessxu',
        version: '1',
        chainId: celo.id,
        verifyingContract: PAYMASTER_CONFIG.CHESSXU_CONTRACT,
      },
      types: {
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
      },
      primaryType: 'Sponsorship',
      message: {
        sender: unsignedUserOp.sender,
        nonce: unsignedUserOp.nonce,
        initCode: unsignedUserOp.initCode,
        callData: unsignedUserOp.callData,
        callGasLimit: unsignedUserOp.callGasLimit,
        verificationGasLimit: unsignedUserOp.verificationGasLimit,
        preVerificationGas: unsignedUserOp.preVerificationGas,
        maxFeePerGas: unsignedUserOp.maxFeePerGas,
        maxPriorityFeePerGas: unsignedUserOp.maxPriorityFeePerGas,
      },
    });

    // 2. Sponsor the UserOp with EIP-712 signature
    const sponsorResult = await sponsorUserOp(unsignedUserOp, sponsorshipSignature);

    const sponsoredUserOp: UserOperation = {
      ...unsignedUserOp,
      paymasterAndData: sponsorResult.paymasterAndData,
      preVerificationGas: sponsorResult.preVerificationGas,
      verificationGasLimit: sponsorResult.verificationGasLimit,
      callGasLimit: sponsorResult.callGasLimit,
    };

    // 2. Sign UserOp Hash
    const userOpHash = getUserOperationHash({
      userOperation: {
        sender: sponsoredUserOp.sender,
        nonce: sponsoredUserOp.nonce,
        initCode: sponsoredUserOp.initCode,
        callData: sponsoredUserOp.callData,
        callGasLimit: sponsoredUserOp.callGasLimit,
        verificationGasLimit: sponsoredUserOp.verificationGasLimit,
        preVerificationGas: sponsoredUserOp.preVerificationGas,
        maxFeePerGas: sponsoredUserOp.maxFeePerGas,
        maxPriorityFeePerGas: sponsoredUserOp.maxPriorityFeePerGas,
        paymasterAndData: sponsoredUserOp.paymasterAndData,
        signature: sponsoredUserOp.signature,
      },
      entryPointAddress: PAYMASTER_CONFIG.ENTRYPOINT_ADDRESS,
      entryPointVersion: '0.6',
      chainId: celo.id,
    });

    const signature = await walletClient.signMessage({
      account: ownerAddress,
      message: { raw: userOpHash },
    });

    const signedUserOp: UserOperation = {
      ...sponsoredUserOp,
      signature,
    };

    // 3. Submit to Bundler
    const txHashReturned = await submitUserOp(signedUserOp);

    // 4. Poll for receipt
    const receipt = await waitForUserOpReceipt(txHashReturned);
    return receipt.transactionHash;
  },

  /**
   * Wrapper implementing the Execute-with-Fallback pattern.
   * Runs gasless sponsorship via Paymaster, falling back to legacy fee currency or native CELO.
   */
  executeWithFallback: async (
    targetAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
    value: bigint = 0n,
  ): Promise<`0x${string}`> => {
    if (celoService.gasSponsored) {
      try {
        return await celoService.executeWithPaymaster(targetAddress, abi, functionName, args, value);
      } catch (error) {
        console.error('[CeloService] Paymaster transaction failed. Falling back to fee currency...', error);
      }
    }

    const walletClient = celoService.getWalletClient();
    const [address] = await walletClient.requestAddresses();
    
    const data = encodeFunctionData({
      abi,
      functionName,
      args,
    });

    const feeCurrency = await celoService.selectFeeCurrency(address, targetAddress, data, value);

    return await walletClient.writeContract({
      address: targetAddress,
      abi,
      functionName: 'executeWithFallback' === functionName ? '' : functionName, // fallback targets the exact same function name
      args,
      account: address,
      value,
      ...(feeCurrency ? { feeCurrency } : {}),
      ...celoService.getTxOptions(),
    } as any);
  },

  // --- Write Operations ---

  /**
   * Creates a new game on-chain
   * @param {string} wagerInEth - Wager amount in ETH/CELO
   * @param {boolean} isNative - Whether the wager is in native CELO or token
   */
  createGame: async (wagerInEth: string, isNative: boolean) => {
    const contractAddr = celoService.getContractAddress();
    const value = isNative ? parseEther(wagerInEth) : 0n;

    return await celoService.executeWithFallback(
      contractAddr,
      CHESSXU_ABI,
      'createGame',
      [BigInt(parseEther(wagerInEth)), isNative],
      value,
    );
  },

  /**
   * Join an existing game on-chain
   * @param {number} gameId - The ID of the game to join
   * @param {string} wagerInEth - Wager amount for joining (must match game)
   * @param {boolean} isNative - Whether the wager is in native CELO
   */
  joinGame: async (gameId: number, wagerInEth: string, isNative: boolean) => {
    const contractAddr = celoService.getContractAddress();
    const value = isNative ? parseEther(wagerInEth) : 0n;

    return await celoService.executeWithFallback(
      contractAddr,
      CHESSXU_ABI,
      'joinGame',
      [BigInt(gameId)],
      value,
    );
  },

  /**
   * Submits a move to the on-chain game
   * @param {number} gameId - The ID of the game
   * @param {string} moveStr - The move string (e.g., "e2e4")
   * @param {string} boardState - The resulting board state (FEN)
   */
  submitMove: async (gameId: number, moveStr: string, boardState: string) => {
    const contractAddr = celoService.getContractAddress();

    return await celoService.executeWithFallback(
      contractAddr,
      CHESSXU_ABI,
      'submitMove',
      [BigInt(gameId), moveStr, boardState],
    );
  },

  /**
   * Resigns from an active game
   * @param {number} gameId - The game to resign from
   */
  resign: async (gameId: number) => {
    const contractAddr = celoService.getContractAddress();

    return await celoService.executeWithFallback(
      contractAddr,
      CHESSXU_ABI,
      'resign',
      [BigInt(gameId)],
    );
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
   * Fetches the total game count from the contract
   * Alias for getLastGameId for consistency with other services
   */
  getGameCount: async () => {
    return await celoService.getLastGameId();
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
