import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig, UserSession } from '@stacks/connect';

// Stacks Configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export type ChainType = 'stacks' | 'celo';

export interface AuthState {
  address: string | null; // Currently active chain address
  stacksAddress: string | null;
  celoAddress: string | null;
  activeChain: ChainType;
  isAuthenticated: boolean;
  isLoading: boolean;
  miniPayDetected: boolean;
  miniPayAccessExpiresAt: string | null;
  miniPayLastPaymentTx: string | null;
}

export interface GameState {
  activeGameId: number | null;
  isGameStarted: boolean;
  elo: number;
  chessBalance: number;
}

export interface AppStore extends AuthState, GameState {
  // Actions
  setAddress: (address: string | null) => void;
  setStacksAddress: (address: string | null) => void;
  setCeloAddress: (address: string | null) => void;
  setActiveChain: (chain: ChainType) => void;
  setIsLoading: (isLoading: boolean) => void;
  setMiniPayDetected: (detected: boolean) => void;
  setMiniPayAccess: (expiresAt: string | null, txHash?: string | null) => void;
  clearMiniPayAccess: () => void;
  setActiveGameId: (gameId: number | null) => void;
  setGameStarted: (started: boolean) => void;
  setElo: (elo: number) => void;
  setChessBalance: (balance: number) => void;
  logout: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Authentication State
      address: null,
      stacksAddress: null,
      celoAddress: null,
      activeChain: 'stacks',
      isAuthenticated: false,
      isLoading: false,
      miniPayDetected: false,
      miniPayAccessExpiresAt: null,
      miniPayLastPaymentTx: null,

      // Game State
      activeGameId: null,
      isGameStarted: false,
      elo: 1200,
      chessBalance: 0,

      // Actions
      setAddress: (address: string | null) => {
        const { activeChain } = get();
        if (activeChain === 'stacks') {
            set({ stacksAddress: address, address, isAuthenticated: !!address });
        } else {
            set({ celoAddress: address, address, isAuthenticated: !!address });
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
      setMiniPayDetected: (miniPayDetected: boolean) => set({ miniPayDetected }),
      setMiniPayAccess: (miniPayAccessExpiresAt: string | null, miniPayLastPaymentTx: string | null = null) =>
        set({ miniPayAccessExpiresAt, miniPayLastPaymentTx }),
      clearMiniPayAccess: () => set({ miniPayAccessExpiresAt: null, miniPayLastPaymentTx: null }),
      setActiveGameId: (activeGameId: number | null) => set({ activeGameId }),
      setGameStarted: (isGameStarted: boolean) => set({ isGameStarted }),
      setElo: (elo: number) => set({ elo }),
      setChessBalance: (chessBalance: number) => set({ chessBalance }),
      logout: () => {
        userSession.signUserOut();
        set({ 
            address: null, 
            stacksAddress: null, 
            celoAddress: null, 
            isAuthenticated: false, 
            miniPayDetected: false,
            miniPayAccessExpiresAt: null,
            miniPayLastPaymentTx: null,
            activeGameId: null, 
            isGameStarted: false,
            elo: 1200,
            chessBalance: 0
        });
      },
    }),
    {
      name: 'chessxu-storage',
    }
  )
);

export default useAppStore;
