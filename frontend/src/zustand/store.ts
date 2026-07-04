import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig, UserSession } from '@stacks/connect';

// Stacks Configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export type ChainType = 'stacks' | 'celo';

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
}

export interface AppStore extends AuthState, GameState {
  // Actions
  setAddress: (address: string | null) => void;
  setStacksAddress: (address: string | null) => void;
  setCeloAddress: (address: string | null) => void;
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
  logout: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Authentication State
      address: null,
      stacksAddress: null,
      celoAddress: null,
      activeChain: 'celo',
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

      // Actions
      // When address changes, sync offline mode: offline iff no address
      setAddress: (address: string | null) => {
        const { activeChain } = get();
        if (activeChain === 'stacks') {
            set({ stacksAddress: address, address, isAuthenticated: !!address });
        } else {
            set({ celoAddress: address, address, isAuthenticated: !!address, isOfflineMode: !address, upgradePromptDismissed: false });
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
      setActiveChain: (activeChain: ChainType) => {
        const { stacksAddress, celoAddress } = get();
        const address = activeChain === 'stacks' ? stacksAddress : celoAddress;
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
      logout: () => {
        userSession.signUserOut();
        set({ 
            address: null, 
            stacksAddress: null, 
            celoAddress: null, 
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
// offlineGamesPlayed counts completed games in current session
// upgradePromptDismissed persists across page reloads via zustand persist
// Freemium: no wallet required for PvC or pass-and-play modes
// Upgrade prompt shown after 3 offline games to encourage wallet connect// isOfflineMode starts true — players can play immediately without any setup
// offlineGamesPlayed resets to 0 on logout for fresh session tracking
// upgradePromptDismissed resets false when new wallet connects
// incrementOfflineGames uses functional update to avoid stale closure
// setOfflineMode can also be called manually to force offline/online state
// Freemium state is persisted by zustand-persist for cross-session continuity
