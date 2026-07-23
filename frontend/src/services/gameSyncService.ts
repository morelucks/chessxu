/**
 * Game Synchronization Service
 * 
 * Handles automatic synchronization of game history from blockchain to IndexedDB cache.
 * Syncs on application load and provides manual sync capabilities.
 */

import { gameHistoryDB, CachedGame } from './gameHistoryDB';
import celoService from '../chess/services/celoService';
import stacksService from '../chess/services/stacksService';
import { ChainType } from '../zustand/store';
import { getGameBlockTimestamp } from './blockTimestampService';
import { CONTRACTS } from '../chess/blockchainConstants';

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  isComplete: boolean;
}

export interface SyncResult {
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  errors: string[];
  duration: number;
}

class GameSyncService {
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private syncListeners: Array<(progress: SyncProgress) => void> = [];

  /**
   * Check if sync is currently in progress
   */
  get syncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Get last sync timestamp
   */
  get lastSync(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Subscribe to sync progress updates
   */
  onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of sync progress
   */
  private notifyProgress(progress: SyncProgress): void {
    this.syncListeners.forEach(callback => callback(progress));
  }

  /**
   * Sync games for a specific player address
   */
  async syncPlayerGames(
    playerAddress: string,
    chain: ChainType,
    options: {
      maxGames?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    const startTime = Date.now();
    this.isSyncing = true;

    const result: SyncResult = {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: [],
      duration: 0
    };

    try {
      await gameHistoryDB.init();

      // Get existing cached games for this player
      const cachedGames = await gameHistoryDB.getPlayerGames(playerAddress, chain);
      const cachedGameIds = new Set(cachedGames.map(g => g.gameId));

      // Fetch games from blockchain
      const onChainGames = await this.fetchPlayerGamesFromChain(
        playerAddress,
        chain,
        options.maxGames || 50
      );

      const progress: SyncProgress = {
        total: onChainGames.length,
        synced: 0,
        failed: 0,
        isComplete: false
      };

      this.notifyProgress(progress);

      // Process each game
      for (const game of onChainGames) {
        try {
          const isUpdate = cachedGameIds.has(game.gameId);
          
          // Skip if not forcing refresh and game is already cached and completed
          if (!options.forceRefresh && isUpdate && game.status >= 2) {
            progress.synced++;
            this.notifyProgress(progress);
            continue;
          }

          await gameHistoryDB.saveGame(game);

          if (isUpdate) {
            result.gamesUpdated++;
          } else {
            result.gamesAdded++;
          }

          progress.synced++;
          this.notifyProgress(progress);
        } catch (error) {
          console.error(`Failed to sync game ${game.gameId}:`, error);
          result.errors.push(`Game ${game.gameId}: ${error}`);
          progress.failed++;
          this.notifyProgress(progress);
        }
      }

      progress.isComplete = true;
      this.notifyProgress(progress);

      result.success = result.errors.length === 0;
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
      result.errors.push(`Sync error: ${error}`);
      result.success = false;
    } finally {
      this.isSyncing = false;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Fetch player games from blockchain
   */
  private async fetchPlayerGamesFromChain(
    playerAddress: string,
    chain: ChainType,
    maxGames: number
  ): Promise<CachedGame[]> {
    const games: CachedGame[] = [];

    if (chain === 'celo') {
      // Fetch from Celo blockchain
      games.push(...await this.fetchCeloGames(playerAddress, maxGames));
    } else {
      // Fetch from Stacks blockchain
      games.push(...await this.fetchStacksGames(playerAddress, maxGames));
    }

    return games;
  }

  /**
   * Fetch games from Celo blockchain
   */
  private async fetchCeloGames(
    playerAddress: string,
    maxGames: number
  ): Promise<CachedGame[]> {
    const games: CachedGame[] = [];

    try {
      // Get total game count from contract
      const gameCount = await celoService.getGameCount();
      
      // Scan recent games (reverse order for efficiency)
      const startId = Math.max(1, gameCount - maxGames * 2);
      
      for (let gameId = gameCount; gameId >= startId && games.length < maxGames; gameId--) {
        try {
          const gameData = await celoService.getGame(gameId);
          
          if (!gameData) continue;

          // Check if player is involved in this game
          const isPlayerW = gameData.playerW?.toLowerCase() === playerAddress.toLowerCase();
          const isPlayerB = gameData.playerB?.toLowerCase() === playerAddress.toLowerCase();

          if (!isPlayerW && !isPlayerB) continue;

          // Retrieve the true block timestamp for this game from the Celo chain
          const blockTimestamp = await getGameBlockTimestamp('celo', gameId);

          // Convert to CachedGame format
          const cachedGame: CachedGame = {
            gameId,
            chain: 'celo',
            playerW: gameData.playerW || '',
            playerB: gameData.playerB || '',
            wager: gameData.wager?.toString() || '0',
            isNative: gameData.isNative || false,
            boardState: gameData.boardState || '',
            turn: gameData.turn || 'w',
            status: gameData.status || 0,
            winner: this.determineWinner(gameData.status, isPlayerW),
            moveHistory: await this.fetchCeloMoveHistory(gameId),
            timestamp: blockTimestamp,
            lastUpdated: Date.now(),
            syncedAt: Date.now()
          };

          games.push(cachedGame);
        } catch (error) {
          console.warn(`Failed to fetch Celo game ${gameId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Celo games:', error);
    }

    return games;
  }

  /**
   * Fetch move history for a Celo game ID from blockchain logs/events
   */
  private async fetchCeloMoveHistory(gameId: number): Promise<string[]> {
    try {
      const publicClient = celoService.getPublicClient();
      const contractAddress = celoService.getContractAddress();

      const MOVE_SUBMITTED_EVENT = {
        type: 'event',
        name: 'MoveSubmitted',
        inputs: [
          { type: 'uint256', name: 'gameId', indexed: true },
          { type: 'string', name: 'moveStr', indexed: false },
          { type: 'string', name: 'boardState', indexed: false }
        ]
      } as const;

      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: MOVE_SUBMITTED_EVENT,
        args: {
          gameId: BigInt(gameId)
        },
        fromBlock: 0n
      });

      // Sort logs by block number and log index to keep correct chronological order
      const sortedLogs = [...logs].sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return (a.logIndex || 0) - (b.logIndex || 0);
        }
        return Number((a.blockNumber || 0n) - (b.blockNumber || 0n));
      });

      return sortedLogs
        .map(log => log.args.moveStr)
        .filter((moveStr): moveStr is string => typeof moveStr === 'string');
    } catch (error) {
      console.warn(`Failed to fetch move history for Celo game ${gameId}:`, error);
      return [];
    }
  }

  /**
   * Fetch games from Stacks blockchain
   */
  private async fetchStacksGames(
    playerAddress: string,
    maxGames: number
  ): Promise<CachedGame[]> {
    const games: CachedGame[] = [];

    try {
      // Get total game count from contract
      const gameCount = await stacksService.getGameCount();
      
      // Scan recent games
      const startId = Math.max(1, gameCount - maxGames * 2);
      
      for (let gameId = gameCount; gameId >= startId && games.length < maxGames; gameId--) {
        try {
          const gameData = await stacksService.getGameState(gameId) as any;
          
          if (!gameData) continue;

          // Check if player is involved
          const playerW = gameData['player-w'];
          const playerB = gameData['player-b']?.value || gameData['player-b'];
          
          const isPlayerW = playerW?.toLowerCase() === playerAddress.toLowerCase();
          const isPlayerB = playerB?.toLowerCase() === playerAddress.toLowerCase();

          if (!isPlayerW && !isPlayerB) continue;

          // Retrieve the true block timestamp for this game from the Stacks chain
          const blockTimestamp = await getGameBlockTimestamp('stacks', gameId, CONTRACTS.GAME);

          // Convert to CachedGame format
          const cachedGame: CachedGame = {
            gameId,
            chain: 'stacks',
            playerW: playerW || '',
            playerB: playerB || '',
            wager: gameData.wager?.toString() || '0',
            isNative: gameData['is-stx'] || false,
            boardState: gameData['board-state'] || '',
            turn: gameData.turn?.value || gameData.turn || 'w',
            status: gameData.status || 0,
            winner: this.determineWinner(gameData.status, isPlayerW),
            moveHistory: [], // TODO: Parse from transaction history
            timestamp: blockTimestamp,
            lastUpdated: Date.now(),
            syncedAt: Date.now()
          };

          games.push(cachedGame);
        } catch (error) {
          console.warn(`Failed to fetch Stacks game ${gameId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Stacks games:', error);
    }

    return games;
  }

  /**
   * Determine winner based on game status
  private determineWinner(status: number, isPlayerWhite: boolean): string | undefined {
    if (status === 2) return isPlayerWhite ? 'win' : 'loss'; // White wins
    if (status === 3) return isPlayerWhite ? 'loss' : 'win'; // Black wins
    if (status === 4) return 'draw';
    return undefined;
  }

  /**
   * Sync a single game by ID
   */
  async syncGame(
    gameId: number,
    chain: 'stacks' | 'celo'
  ): Promise<boolean> {
    try {
      await gameHistoryDB.init();

      let gameData: any;
      if (chain === 'celo') {
        gameData = await celoService.getGame(gameId);
      } else {
        gameData = await stacksService.getGameState(gameId);
      }

      if (!gameData) return false;

      // Resolve the true block timestamp for this game
      const blockTimestamp = await getGameBlockTimestamp(
        chain,
        gameId,
        chain === 'stacks' ? CONTRACTS.GAME : undefined
      );

      const cachedGame: CachedGame = {
        gameId,
        chain,
        playerW: chain === 'celo' ? gameData.playerW : gameData['player-w'],
        playerB: chain === 'celo' ? gameData.playerB : (gameData['player-b']?.value || gameData['player-b']),
        wager: gameData.wager?.toString() || '0',
        isNative: chain === 'celo' ? gameData.isNative : gameData['is-stx'],
        boardState: chain === 'celo' ? gameData.boardState : gameData['board-state'],
        turn: gameData.turn?.value || gameData.turn || 'w',
        status: gameData.status || 0,
        moveHistory: chain === 'celo' ? await this.fetchCeloMoveHistory(gameId) : [],
        timestamp: blockTimestamp,
        lastUpdated: Date.now(),
        syncedAt: Date.now()
      };

      await gameHistoryDB.saveGame(cachedGame);
      return true;
    } catch (error) {
      console.error(`Failed to sync game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Auto-sync on application load
   */
  async autoSync(playerAddress: string, chain: 'stacks' | 'celo'): Promise<void> {
    // Check if we should sync (e.g., not synced in last hour)
    const ONE_HOUR = 60 * 60 * 1000;
    const shouldSync = !this.lastSyncTime || (Date.now() - this.lastSyncTime) > ONE_HOUR;

    if (!shouldSync) {
      console.log('Skipping auto-sync, recently synced');
      return;
    }

    try {
      console.log('Starting auto-sync...');
      const result = await this.syncPlayerGames(playerAddress, chain, {
        maxGames: 30,
        forceRefresh: false
      });
      
      console.log('Auto-sync complete:', result);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }
}

// Export singleton instance
export const gameSyncService = new GameSyncService();
export default gameSyncService;
