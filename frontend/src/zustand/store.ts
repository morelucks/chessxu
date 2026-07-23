import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig, UserSession } from '@stacks/connect';

// Stacks Configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export type ChainType = 'stacks' | 'celo' | 'privy';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
}

export interface AuthState {
  address: string | null; // Currently active chain address
  stacksAddress: string | null;
  celoAddress: string | null;
  privyAddress: string | null;
  activeChain: ChainType;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFarcaster: boolean;
  farcasterUser: FarcasterUser | null;
  miniPayDetected: boolean;
  miniPayAccessExpiresAt: string | null;
  miniPayLastPaymentTx: string | null;
  isConnectModalOpen: boolean;
}

export interface GameState {
  activeGameId: number | null;
  isGameStarted: boolean;
  elo: number;
  chessBalance: number;
  timeControlMs: number | null;
  /** True when playing offline without a wallet */
  isOfflineMode: boolean;
  /** Offline games completed this session */
  offlineGamesPlayed: number;
  /** Whether the upgrade prompt has been dismissed */
  upgradePromptDismissed: boolean;
  boardTheme: 'classic-wood' | 'modern-neon' | 'light' | 'dark';
}

export interface AppStore extends AuthState, GameState {
  // Actions
  setAddress: (address: string | null) => void;
  setStacksAddress: (address: string | null) => void;
  setCeloAddress: (address: string | null) => void;
  setPrivyAddress: (address: string | null) => void;
  setActiveChain: (chain: ChainType) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsFarcaster: (isFarcaster: boolean) => void;
  setFarcasterUser: (user: FarcasterUser | null) => void;
  setMiniPayDetected: (detected: boolean) => void;
  setMiniPayAccess: (expiresAt: string | null, txHash?: string | null) => void;
  clearMiniPayAccess: () => void;
  setActiveGameId: (gameId: number | null) => void;
  setGameStarted: (started: boolean) => void;
  setElo: (elo: number) => void;
  setChessBalance: (balance: number) => void;
  setTimeControlMs: (ms: number | null) => void;
  setConnectModalOpen: (open: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  incrementOfflineGames: () => void;
  dismissUpgradePrompt: () => void;
  setBoardTheme: (theme: 'classic-wood' | 'modern-neon' | 'light' | 'dark') => void;
  logout: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Authentication State
      address: null,
      stacksAddress: null,
      celoAddress: null,
      privyAddress: null,
      activeChain: 'stacks',
      isAuthenticated: false,
      isLoading: false,
      isFarcaster: false,
      farcasterUser: null,
      miniPayDetected: false,
      miniPayAccessExpiresAt: null,
      miniPayLastPaymentTx: null,
      isConnectModalOpen: false,

      // Game State
      activeGameId: null,
      isGameStarted: false,
      elo: 1200,
      chessBalance: 0,
      timeControlMs: null,
      isOfflineMode: true,
      offlineGamesPlayed: 0,
      upgradePromptDismissed: false,
      boardTheme: 'dark',

      // Actions
      // When address changes, sync offline mode: offline iff no address
      setAddress: (address: string | null) => {
        const { activeChain } = get();
        if (activeChain === 'stacks') {
            set({ stacksAddress: address, address, isAuthenticated: !!address, isOfflineMode: !address, upgradePromptDismissed: false });
        } else if (activeChain === 'celo') {
            set({ celoAddress: address, address, isAuthenticated: !!address, isOfflineMode: !address, upgradePromptDismissed: false });
        } else {
            set({ privyAddress: address, address, isAuthenticated: !!address, isOfflineMode: !address, upgradePromptDismissed: false });
        }
      },
      setStacksAddress: (stacksAddress: string | null) => {
        const { activeChain } = get();
        set({ stacksAddress });
        if (activeChain === 'stacks') {
            set({ address: stacksAddress, isAuthenticated: !!stacksAddress });
        }
      },
      setCeloAddress: (celoAddress: string | null) => {
        const { activeChain } = get();
        set({ celoAddress });
        if (activeChain === 'celo') {
            set({ address: celoAddress, isAuthenticated: !!celoAddress });
        }
      },
      setPrivyAddress: (privyAddress: string | null) => {
        const { activeChain } = get();
        set({ privyAddress });
        if (activeChain === 'privy') {
            set({ address: privyAddress, isAuthenticated: !!privyAddress });
        }
      },
      setActiveChain: (activeChain: ChainType) => {
        const { stacksAddress, celoAddress, privyAddress } = get();
        let address = null;
        if (activeChain === 'stacks') address = stacksAddress;
        else if (activeChain === 'celo') address = celoAddress;
        else address = privyAddress;
        set({ activeChain, address, isAuthenticated: !!address });
      },
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      setIsFarcaster: (isFarcaster: boolean) => set({ isFarcaster }),
      setFarcasterUser: (farcasterUser: FarcasterUser | null) => set({ farcasterUser }),
      setMiniPayDetected: (miniPayDetected: boolean) => set({ miniPayDetected }),
      setMiniPayAccess: (miniPayAccessExpiresAt: string | null, miniPayLastPaymentTx: string | null = null) =>
        set({ miniPayAccessExpiresAt, miniPayLastPaymentTx }),
      clearMiniPayAccess: () => set({ miniPayAccessExpiresAt: null, miniPayLastPaymentTx: null }),
      setActiveGameId: (activeGameId: number | null) => set({ activeGameId }),
      setGameStarted: (isGameStarted: boolean) => set({ isGameStarted }),
      setElo: (elo: number) => set({ elo }),
      setChessBalance: (chessBalance: number) => set({ chessBalance }),
      setTimeControlMs: (timeControlMs: number | null) => set({ timeControlMs }),
      setOfflineMode: (isOfflineMode: boolean) => set({ isOfflineMode }),
      incrementOfflineGames: () => set((s) => ({ offlineGamesPlayed: s.offlineGamesPlayed + 1 })),
      dismissUpgradePrompt: () => set({ upgradePromptDismissed: true }),
      setConnectModalOpen: (isConnectModalOpen: boolean) => set({ isConnectModalOpen }),
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      logout: () => {
        userSession.signUserOut();
        set({ 
            address: null, 
            stacksAddress: null, 
            celoAddress: null,
            privyAddress: null,
            isAuthenticated: false, 
            isFarcaster: false,
            farcasterUser: null,
            miniPayDetected: false,
            miniPayAccessExpiresAt: null,
            miniPayLastPaymentTx: null,
            isConnectModalOpen: false,
            activeGameId: null, 
            isGameStarted: false,
            elo: 1200,
            chessBalance: 0,
            timeControlMs: null,
            isOfflineMode: true,
            offlineGamesPlayed: 0,
            upgradePromptDismissed: false,
            boardTheme: 'dark',
        });
      },
    }),
    {
      name: 'chessxu-storage',
    }
  )
);

export default useAppStore;

// isOfflineMode defaults true so players can play immediately on load
