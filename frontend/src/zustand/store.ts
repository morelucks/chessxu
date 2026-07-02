import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChainType = 'celo';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
}

export interface AuthState {
  address: string | null; // Currently active chain address
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

// ── AI Hint state types ──────────────────────────────────────────────────────
export interface AiHint {
  piece: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  notation: string;
  description: string;
  evaluation: number;
}

export interface GameState {
  activeGameId: number | null;
  isGameStarted: boolean;
  elo: number;
  chessBalance: number;
  timeControlMs: number | null;
  isAiHintsEnabled: boolean;
  showHintOnBoard: boolean;
  activeAiHint: AiHint | null;
  activeAiHint: {
    piece: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    notation: string;
    description: string;
    evaluation: number;
  } | null;
}

export interface AppStore extends AuthState, GameState {
  // Actions
  setAddress: (address: string | null) => void;
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
  setAiHintsEnabled: (enabled: boolean) => void;
  setShowHintOnBoard: (show: boolean) => void;
  setActiveAiHint: (hint: any | null) => void;
  logout: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Authentication State
      address: null,
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
      isAiHintsEnabled: false,
      showHintOnBoard: false,
      activeAiHint: null,

      // Actions
      setAddress: (address: string | null) => {
        set({ celoAddress: address, address, isAuthenticated: !!address });
      },
      setCeloAddress: (celoAddress: string | null) => {
        set({ celoAddress, address: celoAddress, isAuthenticated: !!celoAddress });
      },
      setActiveChain: (activeChain: ChainType) => {
        const { celoAddress } = get();
        set({ activeChain, address: celoAddress, isAuthenticated: !!celoAddress });
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
      setConnectModalOpen: (isConnectModalOpen: boolean) => set({ isConnectModalOpen }),
      setAiHintsEnabled: (isAiHintsEnabled: boolean) => set({ isAiHintsEnabled }),
      setShowHintOnBoard: (showHintOnBoard: boolean) => set({ showHintOnBoard }),
      setActiveAiHint: (activeAiHint: any | null) => set({ activeAiHint }),
      logout: () => {
        set({ 
            address: null, 
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
            isAiHintsEnabled: false,
            showHintOnBoard: false,
            activeAiHint: null,
        });
      },
    }),
    {
      name: 'chessxu-storage',
    }
  )
);

export default useAppStore;
